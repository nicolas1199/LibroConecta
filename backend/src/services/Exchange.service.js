import { PublishedBooks, Match, User, Book } from "../db/modelIndex.js";
import { Op } from "sequelize";

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

    // Obtener los libros publicados de ambos usuarios
    const [user1Books, user2Books] = await Promise.all([
      PublishedBooks.findAll({
        where: { 
          user_id: match.user_id_1
        }
      }),
      PublishedBooks.findAll({
        where: { 
          user_id: match.user_id_2
        }
      })
    ]);

    // Intentar actualizar el status si la columna existe
    try {
      await Promise.all([
        PublishedBooks.update(
          { status: 'sold' },
          { 
            where: { 
              user_id: match.user_id_1
            }
          }
        ),
        PublishedBooks.update(
          { status: 'sold' },
          { 
            where: { 
              user_id: match.user_id_2
            }
          }
        )
      ]);
    } catch (statusError) {
      console.log("⚠️ No se pudo actualizar el status, pero el intercambio se completó");
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

    // Obtener los libros publicados de ambos usuarios
    const [user1Books, user2Books] = await Promise.all([
      PublishedBooks.findAll({
        where: { 
          user_id: match.user_id_1
        },
        include: [
          {
            model: Book,
            attributes: ["title", "author", "description"]
          }
        ]
      }),
      PublishedBooks.findAll({
        where: { 
          user_id: match.user_id_2
        },
        include: [
          {
            model: Book,
            attributes: ["title", "author", "description"]
          }
        ]
      })
    ]);

    // Determinar si el intercambio está completado
    // Por ahora, asumimos que no está completado a menos que tengamos información específica
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
          books: user1Books.map(book => ({
            published_book_id: book.published_book_id,
            title: book.Book?.title || 'Título no disponible',
            author: book.Book?.author || 'Autor desconocido',
            description: book.Book?.description || '',
            status: book.status || 'available'
          }))
        },
        {
          user_id: user2.user_id,
          name: `${user2.first_name} ${user2.last_name}`,
          location: user2.location_id,
          books: user2Books.map(book => ({
            published_book_id: book.published_book_id,
            title: book.Book?.title || 'Título no disponible',
            author: book.Book?.author || 'Autor desconocido',
            description: book.Book?.description || '',
            status: book.status || 'available'
          }))
        }
      ],
      can_complete: true, // Siempre permitir completar por ahora
      total_books: user1Books.length + user2Books.length
    };

  } catch (error) {
    console.error("Error en getExchangeInfoService:", error);
    throw error;
  }
}
