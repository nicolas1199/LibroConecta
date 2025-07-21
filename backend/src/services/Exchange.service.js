import { PublishedBooks, Match, User, Book } from "../db/modelIndex.js";
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

    // Obtener información de los dos usuarios del match
    const [user1, user2] = await Promise.all([
      User.findByPk(match.user_id_1),
      User.findByPk(match.user_id_2),
    ]);

    // Obtener los libros publicados de ambos usuarios sin incluir status en el SELECT
    const [user1Books, user2Books] = await Promise.all([
      PublishedBooks.findAll({
        where: { 
          user_id: match.user_id_1
        },
        attributes: { exclude: ['status'] } // Excluir status del SELECT por ahora
      }),
      PublishedBooks.findAll({
        where: { 
          user_id: match.user_id_2
        },
        attributes: { exclude: ['status'] } // Excluir status del SELECT por ahora
      })
    ]);

    // Usar SQL directo para actualizar el status
    try {
      await sequelize.query(`
        UPDATE "PublishedBooks" 
        SET status = 'sold' 
        WHERE user_id IN (:user1Id, :user2Id)
      `, {
        replacements: { 
          user1Id: match.user_id_1, 
          user2Id: match.user_id_2 
        }
      });
      console.log("✅ Status actualizado a 'sold' usando SQL directo");
    } catch (statusError) {
      console.log("⚠️ Error al actualizar status:", statusError.message);
    }

    return {
      success: true,
      message: "Intercambio completado exitosamente",
      match: {
        match_id: match.match_id,
        users: [
          {
            user_id: user1.user_id,
            name: `${user1.first_name} ${user1.last_name}`,
            books_exchanged: user1Books.length
          },
          {
            user_id: user2.user_id,
            name: `${user2.first_name} ${user2.last_name}`,
            books_exchanged: user2Books.length
          }
        ],
        completed_at: new Date()
      }
    };

  } catch (error) {
    console.error("Error en completeExchangeService:", error);
    throw error;
  }
}

// Servicio para obtener información del intercambio
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
    console.error("Error en getExchangeInfoService:", error);
    throw error;
  }
}
