import { Op } from "sequelize";
import {
  User,
  Match,
  PublishedBooks,
  UserPublishedBookInteraction,
  Book,
  MatchBooks,
} from "../db/modelIndex.js";
import { hasMutualLike } from "../utils/match.util.js";
import { formatMatchNotification } from "../utils/notification.util.js";

// Servicio principal para detección y creación automática de matches ESPECÍFICOS POR LIBRO
// NUEVA LÓGICA:
// 1. Recibe user_id del usuario que hizo LIKE y published_book_id del libro
// 2. Obtiene información del libro y su propietario
// 3. Busca todos los libros del usuario actual que el dueño ha likeado
// 4. Para cada libro que coincide: crea un MATCH ESPECÍFICO (libro A ↔ libro B)
// 5. Popula automáticamente MatchBooks con los libros específicos
// 6. Retorna información de todos los matches creados
export async function checkAndCreateAutoMatch(userId, publishedBookId) {
  try {
    console.log(
      `🔍 Verificando auto-match específico para usuario ${userId} y libro ${publishedBookId}`
    );

    // PASO 1: Obtener información completa del libro que recibió el like
    const likedBook = await PublishedBooks.findByPk(publishedBookId, {
      include: [
        {
          model: User, // Propietario del libro
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: Book, // Información del libro
          attributes: ["title", "author"],
        },
      ],
    });

    if (!likedBook) {
      return { success: false, message: "Libro no encontrado" };
    }

    const bookOwnerId = likedBook.user_id;

    // PASO 2: Validación básica
    if (userId === bookOwnerId) {
      return {
        success: false,
        message: "No se puede hacer match consigo mismo",
      };
    }

    // PASO 3: Buscar todos los libros del usuario actual que el dueño ha likeado
    const currentUserBooks = await PublishedBooks.findAll({
      where: { 
        user_id: userId,
        status: 'available' // Solo libros disponibles
      },
      include: [
        {
          model: UserPublishedBookInteraction,
          as: "UserInteractions",
          where: {
            user_id: bookOwnerId,
            interaction_type: "like",
          },
          required: true,
        },
        {
          model: Book,
          attributes: ["title", "author"],
        },
      ],
    });

    if (currentUserBooks.length === 0) {
      console.log(`❌ No hay likes mutuos entre ${userId} y ${bookOwnerId}`);
      return { success: false, message: "No hay likes mutuos" };
    }

    console.log(`✅ Encontrados ${currentUserBooks.length} libros con reciprocidad`);

    // PASO 4: CREAR MATCHES ESPECÍFICOS - UN MATCH POR CADA COMBINACIÓN DE LIBROS
    const createdMatches = [];

    for (const userBook of currentUserBooks) {
      // Verificar si ya existe un match específico para esta combinación de libros
      const existingSpecificMatch = await MatchBooks.findAll({
        include: [
          {
            model: Match,
            where: {
              [Op.or]: [
                { user_id_1: userId, user_id_2: bookOwnerId },
                { user_id_1: bookOwnerId, user_id_2: userId },
              ],
            },
          },
        ],
        where: {
          [Op.or]: [
            { published_book_id: publishedBookId },
            { published_book_id: userBook.published_book_id },
          ],
        },
      });

      // Si ya existe un match que involucra alguno de estos libros específicos, saltar
      if (existingSpecificMatch.length > 0) {
        console.log(`⚠️ Ya existe match para libros ${publishedBookId} ↔ ${userBook.published_book_id}`);
        continue;
      }

      // CREAR NUEVO MATCH ESPECÍFICO
      const matchData = {
        user_id_1: userId,
        user_id_2: bookOwnerId,
        date_match: new Date(),
        match_type: "automatic",
        triggered_by_books: {
          user1_book: {
            published_book_id: userBook.published_book_id,
            title: userBook.Book.title,
            author: userBook.Book.author,
          },
          user2_book: {
            published_book_id: publishedBookId,
            title: likedBook.Book.title,
            author: likedBook.Book.author,
          },
        },
      };

      const newMatch = await Match.create(matchData);

      // PASO 5: POBLAR MATCHBOOKS AUTOMÁTICAMENTE
      await MatchBooks.bulkCreate([
        {
          match_id: newMatch.match_id,
          published_book_id: userBook.published_book_id,
          user_id: userId,
        },
        {
          match_id: newMatch.match_id,
          published_book_id: publishedBookId,
          user_id: bookOwnerId,
        },
      ]);

      // Obtener match completo con información de usuarios
      const completeMatch = await Match.findByPk(newMatch.match_id, {
        include: [
          {
            model: User,
            as: "User1",
            attributes: ["user_id", "first_name", "last_name", "email"],
          },
          {
            model: User,
            as: "User2",
            attributes: ["user_id", "first_name", "last_name", "email"],
          },
        ],
      });

      createdMatches.push(completeMatch);

      console.log(`✅ Match específico creado: "${userBook.Book.title}" ↔ "${likedBook.Book.title}" (ID: ${newMatch.match_id})`);
    }

    if (createdMatches.length === 0) {
      return {
        success: false,
        message: "No se pudieron crear matches específicos (ya existen)",
      };
    }

    // PASO 6: Respuesta con todos los matches creados
    return {
      success: true,
      message: `${createdMatches.length} match(es) específico(s) creado(s)`,
      matches: createdMatches,
      matches_count: createdMatches.length,
      trigger_info: {
        trigger_book: likedBook.Book.title,
        reciprocal_books: currentUserBooks.map(book => book.Book.title),
      },
    };
  } catch (error) {
    console.error("❌ Error en checkAndCreateAutoMatch:", error);
    return {
      success: false,
      message: "Error al verificar auto-match",
      error: error.message,
    };
  }
}

/**
 * Obtiene estadísticas de matches automáticos para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} - Estadísticas de matches
 */
export async function getAutoMatchStats(userId) {
  try {
    const totalMatches = await Match.count({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    const autoMatches = await Match.count({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
        match_type: "automatic",
      },
    });

    const manualMatches = totalMatches - autoMatches;

    return {
      total: totalMatches,
      automatic: autoMatches,
      manual: manualMatches,
      auto_percentage:
        totalMatches > 0 ? Math.round((autoMatches / totalMatches) * 100) : 0,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas de auto-match:", error);
    return {
      total: 0,
      automatic: 0,
      manual: 0,
      auto_percentage: 0,
    };
  }
}

/**
 * Obtiene todos los matches automáticos de un usuario con detalles
 * @param {string} userId - ID del usuario
 * @returns {Array} - Lista de matches automáticos
 */
export async function getUserAutoMatches(userId) {
  try {
    const autoMatches = await Match.findAll({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
        match_type: "automatic",
      },
      include: [
        {
          model: User,
          as: "User1",
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "profile_image_base64",
          ],
        },
        {
          model: User,
          as: "User2",
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "profile_image_base64",
          ],
        },
      ],
      order: [["date_match", "DESC"]],
    });

    // Formatear para mostrar el "otro usuario" y detalles del match
    const formattedMatches = autoMatches.map((match) => {
      const otherUser =
        match.get("user_id_1") === userId ? match.User2 : match.User1;
      return {
        match_id: match.get("match_id"),
        date_match: match.get("date_match"),
        match_type: match.get("match_type"),
        triggered_by_books: match.get("triggered_by_books"),
        user: otherUser,
      };
    });

    return formattedMatches;
  } catch (error) {
    console.error("Error obteniendo auto-matches del usuario:", error);
    return [];
  }
}
