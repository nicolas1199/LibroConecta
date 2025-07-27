import { Op } from "sequelize";
import {
  User,
  Match,
  PublishedBooks,
  UserPublishedBookInteraction,
  Book,
} from "../db/modelIndex.js";
import { hasMutualLike } from "../utils/match.util.js";
import { formatMatchNotification } from "../utils/notification.util.js";

// Servicio principal para detección y creación automática de matches
// FLUJO DE DATOS:
// 1. Recibe user_id del usuario que hizo LIKE y published_book_id del libro
// 2. Obtiene información del libro y su propietario
// 3. Busca si ya existe match entre estos usuarios
// 4. Verifica si hay reciprocidad de likes entre los usuarios
// 5. Si hay reciprocidad: crea Match automático en base de datos
// 6. Retorna información del match para notificación en frontend
export async function checkAndCreateAutoMatch(userId, publishedBookId) {
  try {
    console.log(`Verificando posible auto-match para usuario ${userId} y libro ${publishedBookId}`);

    // PASO 1: Obtener información completa del libro que recibió el like
    // Incluye datos del propietario y del libro para construir el match
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
    
    // PASO 2: Validación de auto-match
    // Un usuario no puede hacer match consigo mismo
    if (userId === bookOwnerId) {
      return { success: false, message: "No se puede hacer match consigo mismo" };
    }

    // PASO 3: Verificar si ya existe un match entre estos usuarios
    // Buscar en ambas direcciones: user1->user2 o user2->user1
    const existingMatch = await Match.findOne({
      where: {
        [Op.or]: [
          { user_id_1: userId, user_id_2: bookOwnerId }, // userId es usuario_1
          { user_id_1: bookOwnerId, user_id_2: userId }, // userId es usuario_2
        ],
      },
    });

    if (existingMatch) {
      console.log(`Ya existe un match entre usuarios ${userId} y ${bookOwnerId}`);
      return { success: false, message: "Ya existe un match entre estos usuarios" };
    }

    // PASO 4: Búsqueda de reciprocidad
    // Obtener todos los libros del usuario actual que le gustaron al dueño del libro
    // LÓGICA DE RECIPROCIDAD:
    // - Usuario A le da like al libro de Usuario B
    // - Se busca: ¿Usuario B le dio like a algún libro de Usuario A?
    // - Si SÍ: hay reciprocidad → crear match automático
    const currentUserBooks = await PublishedBooks.findAll({
      where: { user_id: userId }, // Libros publicados por el usuario actual
      include: [
        {
          // Buscar interacciones del dueño del libro con los libros del usuario actual
          model: UserPublishedBookInteraction,
          where: {
            user_id: bookOwnerId, // El dueño del libro
            interaction_type: "like", // Solo likes, no dislikes
          },
          required: true, // INNER JOIN - solo libros que tienen likes del dueño
        },
        {
          model: Book, // Información del libro para logging
          attributes: ["title", "author"],
        },
      ],
    });

    console.log(`Libros del usuario ${userId} que le gustaron al dueño: ${currentUserBooks.length}`);

    // PASO 5: Validación de reciprocidad
    if (currentUserBooks.length === 0) {
      console.log(`No hay likes mutuos entre ${userId} y ${bookOwnerId}`);
      return { success: false, message: "No hay likes mutuos" };
    }

    // PASO 6: CREACIÓN DEL MATCH AUTOMÁTICO
    // Hay reciprocidad confirmada - crear match en base de datos
    console.log(`MATCH AUTOMÁTICO DETECTADO! Entre ${userId} y ${bookOwnerId}`);

    const matchData = {
      user_id_1: userId, // Usuario que acaba de hacer like
      user_id_2: bookOwnerId, // Propietario del libro
      date_match: new Date(), // Timestamp del match
      match_type: "automatic", // Tipo: automático (vs manual)
      // PASO 7: Metadata del match para logging y notificaciones
      triggered_by_books: {
        // Información del libro que disparó el match (el que acaba de recibir like)
        user1_liked_book: {
          published_book_id: publishedBookId,
          title: likedBook.Book.title,
          author: likedBook.Book.author,
        },
        // Información de todos los libros del usuario que el dueño había likeado
        user2_liked_books: currentUserBooks.map(book => ({
          published_book_id: book.published_book_id,
          title: book.Book.title,
          author: book.Book.author,
        })),
      },
    };

    // PASO 7: Persistencia del match
    const newMatch = await Match.create(matchData);

    // PASO 8: Obtener match completo con información de usuarios
    // Incluir datos de ambos usuarios para notificaciones en frontend
    const completeMatch = await Match.findByPk(newMatch.match_id, {
      include: [
        {
          model: User,
          as: "User1", // Usuario que hizo el like disparador
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
        {
          model: User,
          as: "User2", // Propietario del libro
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
      ],
    });

    console.log(`Match automático creado con ID: ${newMatch.match_id}`);

    // PASO 9: Estructurar respuesta para frontend
    // El frontend usará esta información para mostrar notificación de match
    return {
      success: true,
      message: "Match automático creado",
      match: completeMatch, // Match completo con datos de usuarios
      trigger_info: {
        books_count: currentUserBooks.length, // Cuántos libros causaron el match
        trigger_book: likedBook.Book.title, // Libro que disparó el match
      },
    };
  } catch (error) {
    console.error("Error en checkAndCreateAutoMatch:", error);
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
      auto_percentage: totalMatches > 0 ? Math.round((autoMatches / totalMatches) * 100) : 0,
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
          attributes: ["user_id", "first_name", "last_name", "email", "profile_image_base64"],
        },
        {
          model: User,
          as: "User2",
          attributes: ["user_id", "first_name", "last_name", "email", "profile_image_base64"],
        },
      ],
      order: [["date_match", "DESC"]],
    });

    // Formatear para mostrar el "otro usuario" y detalles del match
    const formattedMatches = autoMatches.map((match) => {
      const otherUser = match.get("user_id_1") === userId ? match.User2 : match.User1;
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
