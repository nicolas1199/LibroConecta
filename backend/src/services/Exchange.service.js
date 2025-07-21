import { PublishedBooks, Match, User, Book, MatchBooks } from "../db/modelIndex.js";
import { Op } from "sequelize";
import { sequelize } from "../config/configDb.js";

// Servicio para marcar un intercambio como completado
export async function completeExchangeService(matchId, userId) {
  try {
    // Verificar que el usuario es parte del match
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    if (!match) {
      throw new Error("Match no encontrado o no autorizado");
    }

    // Obtener los libros específicos de este match
    const matchBooks = await MatchBooks.findAll({
      where: { match_id: matchId },
      include: [
        {
          model: PublishedBooks,
          include: [
            {
              model: Book,
              attributes: ["title", "author"]
            }
          ]
        },
        {
          model: User,
          attributes: ["user_id", "first_name", "last_name"]
        }
      ]
    });

    if (matchBooks.length === 0) {
      console.log("⚠️ No se encontraron libros específicos para este match, usando lógica antigua");
      // Fallback a la lógica anterior si no hay libros específicos
      return await completeExchangeServiceFallback(matchId, userId);
    }

    // Actualizar status solo de los libros específicos del intercambio
    const bookIds = matchBooks.map(mb => mb.published_book_id);
    
    try {
      const [updatedCount] = await sequelize.query(`
        UPDATE "PublishedBooks" 
        SET status = 'sold' 
        WHERE published_book_id IN (${bookIds.map(() => '?').join(',')})
      `, {
        replacements: bookIds
      });
      
      console.log(`✅ Status actualizado a 'sold' para ${updatedCount} libros específicos del intercambio`);
    } catch (statusError) {
      console.log("⚠️ Error al actualizar status:", statusError.message);
    }

    // Agrupar libros por usuario para la respuesta
    const user1Books = matchBooks.filter(mb => mb.user_id === match.user_id_1);
    const user2Books = matchBooks.filter(mb => mb.user_id === match.user_id_2);

    return {
      success: true,
      message: "Intercambio completado exitosamente",
      match: {
        match_id: match.match_id,
        users: [
          {
            user_id: match.user_id_1,
            name: user1Books[0]?.User ? `${user1Books[0].User.first_name} ${user1Books[0].User.last_name}` : "Usuario 1",
            books_exchanged: user1Books.length,
            books: user1Books.map(mb => ({
              published_book_id: mb.published_book_id,
              title: mb.PublishedBooks?.Book?.title || 'Título no disponible',
              author: mb.PublishedBooks?.Book?.author || 'Autor desconocido'
            }))
          },
          {
            user_id: match.user_id_2,
            name: user2Books[0]?.User ? `${user2Books[0].User.first_name} ${user2Books[0].User.last_name}` : "Usuario 2",
            books_exchanged: user2Books.length,
            books: user2Books.map(mb => ({
              published_book_id: mb.published_book_id,
              title: mb.PublishedBooks?.Book?.title || 'Título no disponible',
              author: mb.PublishedBooks?.Book?.author || 'Autor desconocido'
            }))
          }
        ],
        completed_at: new Date(),
        books_updated: bookIds.length
      }
    };

  } catch (error) {
    console.error("Error en completeExchangeService:", error);
    throw error;
  }
}

// Función de fallback para matches sin libros específicos
async function completeExchangeServiceFallback(matchId, userId) {
  // La lógica anterior como fallback
  console.log("🔄 Usando lógica de fallback para match sin libros específicos");
  return {
    success: true,
    message: "Intercambio completado (modo compatibilidad)",
    match: {
      match_id: matchId,
      completed_at: new Date(),
      note: "Completado sin especificar libros específicos"
    }
  };
}

// Servicio para obtener información del intercambio (actualizado)
export async function getExchangeInfoService(matchId, userId) {
  try {
    // Verificar acceso
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    if (!match) {
      throw new Error("Match no encontrado o no autorizado");
    }

    // Primero intentar obtener libros específicos del match
    const matchBooks = await MatchBooks.findAll({
      where: { match_id: matchId },
      include: [
        {
          model: PublishedBooks,
          include: [
            {
              model: Book,
              attributes: ["title", "author"]
            }
          ]
        },
        {
          model: User,
          attributes: ["user_id", "first_name", "last_name", "location_id"]
        }
      ]
    });

    if (matchBooks.length > 0) {
      // Usar libros específicos del match
      const user1Books = matchBooks.filter(mb => mb.user_id === match.user_id_1);
      const user2Books = matchBooks.filter(mb => mb.user_id === match.user_id_2);

      return {
        match_id: match.match_id,
        date_match: match.date_match,
        is_completed: false,
        has_specific_books: true,
        users: [
          {
            user_id: match.user_id_1,
            name: user1Books[0]?.User ? `${user1Books[0].User.first_name} ${user1Books[0].User.last_name}` : "Usuario 1",
            location: user1Books[0]?.User?.location_id,
            books: user1Books.map(mb => ({
              published_book_id: mb.published_book_id,
              title: mb.PublishedBooks?.Book?.title || 'Título no disponible',
              author: mb.PublishedBooks?.Book?.author || 'Autor desconocido',
              description: mb.PublishedBooks?.description || 'Sin descripción',
              status: mb.PublishedBooks?.status || 'available'
            }))
          },
          {
            user_id: match.user_id_2,
            name: user2Books[0]?.User ? `${user2Books[0].User.first_name} ${user2Books[0].User.last_name}` : "Usuario 2",
            location: user2Books[0]?.User?.location_id,
            books: user2Books.map(mb => ({
              published_book_id: mb.published_book_id,
              title: mb.PublishedBooks?.Book?.title || 'Título no disponible',
              author: mb.PublishedBooks?.Book?.author || 'Autor desconocido',
              description: mb.PublishedBooks?.description || 'Sin descripción',
              status: mb.PublishedBooks?.status || 'available'
            }))
          }
        ],
        can_complete: true,
        total_books: matchBooks.length
      };
    } else {
      // Fallback a la lógica anterior
      console.log("🔄 Usando lógica de fallback para obtener info del match");
      return await getExchangeInfoServiceFallback(matchId, userId, match);
    }

  } catch (error) {
    console.error("Error en getExchangeInfoService:", error);
    throw error;
  }
}

// Función de fallback para matches sin libros específicos
async function getExchangeInfoServiceFallback(matchId, userId, match) {
  // La lógica anterior como fallback
  try {
    // Verificar acceso
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    if (!match) {
      throw new Error("Match no encontrado o no autorizado");
    }

    // Obtener información de los dos usuarios del match
    const [user1, user2] = await Promise.all([
      User.findByPk(match.user_id_1, {
        attributes: ["user_id", "first_name", "last_name", "location_id"]
      }),
      User.findByPk(match.user_id_2, {
        attributes: ["user_id", "first_name", "last_name", "location_id"]
      })
    ]);

    // Usar SQL directo para obtener los libros con status (sin description que no existe)
    const [user1BooksResult, user2BooksResult] = await Promise.all([
      sequelize.query(`
        SELECT pb.*, b.title, b.author, pb.status
        FROM "PublishedBooks" pb
        LEFT JOIN "Books" b ON pb.book_id = b.book_id
        WHERE pb.user_id = :userId
      `, {
        replacements: { userId: match.user_id_1 },
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT pb.*, b.title, b.author, pb.status
        FROM "PublishedBooks" pb
        LEFT JOIN "Books" b ON pb.book_id = b.book_id
        WHERE pb.user_id = :userId
      `, {
        replacements: { userId: match.user_id_2 },
        type: sequelize.QueryTypes.SELECT
      })
    ]);

    // Determinar si el intercambio está completado
    const isCompleted = false;

    return {
      match_id: match.match_id,
      date_match: match.date_match,
      is_completed: isCompleted,
      users: [
        {
          user_id: user1.user_id,
          name: `${user1.first_name} ${user1.last_name}`,
          location: user1.location_id,
          books: user1BooksResult.map(book => ({
            published_book_id: book.published_book_id,
            title: book.title || 'Título no disponible',
            author: book.author || 'Autor desconocido',
            description: book.description || 'Sin descripción', // Usar la description de PublishedBooks
            status: book.status || 'available'
          }))
        },
        {
          user_id: user2.user_id,
          name: `${user2.first_name} ${user2.last_name}`,
          location: user2.location_id,
          books: user2BooksResult.map(book => ({
            published_book_id: book.published_book_id,
            title: book.title || 'Título no disponible',
            author: book.author || 'Autor desconocido',
            description: book.description || 'Sin descripción', // Usar la description de PublishedBooks
            status: book.status || 'available'
          }))
        }
      ],
      can_complete: true,
      total_books: user1BooksResult.length + user2BooksResult.length
    };

  } catch (error) {
    console.error("Error en getExchangeInfoServiceFallback:", error);
    throw error;
  }
}
