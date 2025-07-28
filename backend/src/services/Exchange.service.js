import { PublishedBooks, Match, User, Book, MatchBooks, Exchange, State, UserBook } from "../db/modelIndex.js";
import { Op } from "sequelize";
import { sequelize } from "../config/configDb.js";
import { populateExistingMatch, getMatchBooks } from "./MatchBooks.service.js";

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

    // Intentar obtener los libros específicos de este match
    let matchBooks = await getMatchBooks(matchId);

    // Si no hay libros específicos, intentar poblar automáticamente
    if (matchBooks.length === 0) {
      console.log("⚠️ No se encontraron libros específicos para este match, intentando poblar automáticamente...");
      
      try {
        await populateExistingMatch(matchId);
        matchBooks = await getMatchBooks(matchId);
        console.log(`✅ Se poblaron ${matchBooks.length} libros para el match ${matchId}`);
      } catch (populateError) {
        console.log("⚠️ Error al poblar match automáticamente:", populateError.message);
      }
    }

    if (matchBooks.length > 0) {
      // Lógica con libros específicos
      console.log(`🎯 Completando intercambio con ${matchBooks.length} libros específicos`);

      // Crear Exchange real en la base de datos
      let exchange = null;
      try {
        // Buscar estado "Completado"
        const completedState = await State.findOne({ where: { name: 'Completado' } });
        const stateId = completedState ? completedState.state_id : 1; // fallback

        // Obtener los UserBook IDs de cada usuario para el Exchange
        const user1Books = matchBooks.filter(mb => mb.user_id === match.user_id_1);
        const user2Books = matchBooks.filter(mb => mb.user_id === match.user_id_2);
        
        // Obtener los UserBook IDs correspondientes a los PublishedBooks
        const userBook1Id = user1Books[0]?.user_book_id;
        const userBook2Id = user2Books[0]?.user_book_id;

        if (userBook1Id && userBook2Id) {
          exchange = await Exchange.create({
            user_book_id_1: userBook1Id,
            user_book_id_2: userBook2Id,
            date_exchange: new Date(),
            state_id: stateId
          });

          console.log(`✅ Exchange creado con ID: ${exchange.exchange_id}`);
        } else {
          console.log("⚠️ No se pudieron obtener user_book_ids válidos para crear el Exchange");
        }
      } catch (exchangeError) {
        console.log("⚠️ Error al crear Exchange:", exchangeError.message);
      }

      // Actualizar status solo de los libros específicos del intercambio
      const bookIds = matchBooks.map(mb => mb.published_book_id);
      
      try {
        const [updatedRows] = await sequelize.query(`
          UPDATE "PublishedBooks" 
          SET status = 'sold' 
          WHERE published_book_id = ANY($1)
        `, {
          bind: [bookIds]
        });
        
        console.log(`✅ Status actualizado a 'sold' para ${bookIds.length} libros específicos del intercambio`);
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
          exchange_id: exchange?.exchange_id || null,
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
          books_updated: bookIds.length,
          method: "specific_books"
        }
      };

    } else {
      // Fallback a la lógica anterior si no se pudieron obtener libros específicos
      console.log("🔄 Usando lógica de fallback para match sin libros específicos");
      
      // Obtener información básica de los usuarios
      const [user1, user2] = await Promise.all([
        User.findByPk(match.user_id_1),
        User.findByPk(match.user_id_2),
      ]);

      return {
        success: true,
        message: "Intercambio completado (modo compatibilidad)",
        match: {
          match_id: match.match_id,
          exchange_id: null,
          users: [
            {
              user_id: user1.user_id,
              name: `${user1.first_name} ${user1.last_name}`,
              books_exchanged: 0
            },
            {
              user_id: user2.user_id,
              name: `${user2.first_name} ${user2.last_name}`,
              books_exchanged: 0
            }
          ],
          completed_at: new Date(),
          books_updated: 0,
          method: "fallback"
        }
      };
    }

  } catch (error) {
    console.error("Error en completeExchangeService:", error);
    throw error;
  }
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

    // Verificar si ya existe un Exchange completado para este match
    // Buscar por match directamente usando la tabla Match_Books si existe
    let existingExchange = null;
    try {
      // Intentar buscar exchanges relacionados con este match
      const exchangeQuery = await sequelize.query(`
        SELECT e.* FROM "Exchange" e
        JOIN "UserBooks" ub1 ON e.user_book_id_1 = ub1.user_book_id
        JOIN "UserBooks" ub2 ON e.user_book_id_2 = ub2.user_book_id
        WHERE (ub1.user_id = :user1 AND ub2.user_id = :user2)
           OR (ub1.user_id = :user2 AND ub2.user_id = :user1)
        LIMIT 1
      `, {
        replacements: { 
          user1: match.user_id_1, 
          user2: match.user_id_2 
        },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (exchangeQuery.length > 0) {
        existingExchange = exchangeQuery[0];
      }
    } catch (queryError) {
      console.log("⚠️ No se pudo verificar exchange existente:", queryError.message);
      existingExchange = null;
    }

    // Intentar obtener libros específicos del match
    let matchBooks = await getMatchBooks(matchId);

    if (matchBooks.length > 0) {
      // Usar libros específicos del match
      console.log(`📚 Intercambio con ${matchBooks.length} libros específicos`);
      
      const user1Books = matchBooks.filter(mb => mb.user_id === match.user_id_1);
      const user2Books = matchBooks.filter(mb => mb.user_id === match.user_id_2);

      return {
        match_id: match.match_id,
        exchange_id: existingExchange?.exchange_id || null,
        date_match: match.date_match,
        is_completed: !!existingExchange,
        has_specific_books: true,
        users: [
          {
            user_id: match.user_id_1,
            name: user1Books[0]?.User ? `${user1Books[0].User.first_name} ${user1Books[0].User.last_name}` : "Usuario 1",
            first_name: user1Books[0]?.User?.first_name || "Usuario",
            last_name: user1Books[0]?.User?.last_name || "1",
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
            first_name: user2Books[0]?.User?.first_name || "Usuario",
            last_name: user2Books[0]?.User?.last_name || "2",
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
        can_complete: !existingExchange,
        total_books: matchBooks.length
      };
    } else {
      // Fallback a la lógica anterior
      console.log("🔄 Usando lógica de fallback para obtener info del match");
      return await getExchangeInfoServiceFallback(matchId, userId, match, existingExchange);
    }

  } catch (error) {
    console.error("Error en getExchangeInfoService:", error);
    throw error;
  }
}

// Función de fallback para matches sin libros específicos
async function getExchangeInfoServiceFallback(matchId, userId, match, existingExchange) {
  try {
    // Obtener información de los dos usuarios del match
    const [user1, user2] = await Promise.all([
      User.findByPk(match.user_id_1, {
        attributes: ["user_id", "first_name", "last_name", "location_id"]
      }),
      User.findByPk(match.user_id_2, {
        attributes: ["user_id", "first_name", "last_name", "location_id"]
      })
    ]);

    return {
      match_id: match.match_id,
      exchange_id: existingExchange?.exchange_id || null,
      date_match: match.date_match,
      is_completed: !!existingExchange,
      has_specific_books: false,
      users: [
        {
          user_id: user1.user_id,
          name: `${user1.first_name} ${user1.last_name}`,
          first_name: user1.first_name,
          last_name: user1.last_name,
          location: user1.location_id,
          books: []
        },
        {
          user_id: user2.user_id,
          name: `${user2.first_name} ${user2.last_name}`,
          first_name: user2.first_name,
          last_name: user2.last_name,
          location: user2.location_id,
          books: []
        }
      ],
      can_complete: !existingExchange,
      total_books: 0
    };
  } catch (error) {
    console.error("Error en getExchangeInfoServiceFallback:", error);
    throw error;
  }
}

// Servicio para obtener historial de intercambios del usuario
export async function getExchangeHistoryService(userId) {
  try {
    // Obtener todos los intercambios completados donde el usuario participó
    const exchanges = await Exchange.findAll({
      include: [
        {
          model: UserBook,
          as: "Book1",
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name"]
            },
            {
              model: PublishedBooks,
              include: [
                {
                  model: Book,
                  attributes: ["title", "author"]
                }
              ]
            }
          ]
        },
        {
          model: UserBook,
          as: "Book2", 
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name"]
            },
            {
              model: PublishedBooks,
              include: [
                {
                  model: Book,
                  attributes: ["title", "author"]
                }
              ]
            }
          ]
        },
        {
          model: State,
          attributes: ["name"]
        }
      ],
      where: {
        [Op.or]: [
          { "$Book1.user_id$": userId },
          { "$Book2.user_id$": userId }
        ]
      },
      order: [["date_exchange", "DESC"]]
    });

    const formattedHistory = exchanges.map(exchange => {
      const isUser1 = exchange.Book1.user_id === userId;
      const myBook = isUser1 ? exchange.Book1 : exchange.Book2;
      const otherBook = isUser1 ? exchange.Book2 : exchange.Book1;
      const otherUser = isUser1 ? exchange.Book2.User : exchange.Book1.User;

      return {
        id: exchange.exchange_id,
        type: "exchange",
        book_title: myBook.PublishedBooks?.Book?.title || "Libro desconocido",
        book_author: myBook.PublishedBooks?.Book?.author || "Autor desconocido",
        other_book_title: otherBook.PublishedBooks?.Book?.title || "Libro desconocido",
        other_book_author: otherBook.PublishedBooks?.Book?.author || "Autor desconocido",
        other_user_name: `${otherUser.first_name} ${otherUser.last_name}`,
        other_user_id: otherUser.user_id,
        date: exchange.date_exchange,
        status: "completed", // Todos los exchanges en la tabla están completados
        notes: `Intercambié "${myBook.PublishedBooks?.Book?.title}" por "${otherBook.PublishedBooks?.Book?.title}"`
      };
    });

    return formattedHistory;
  } catch (error) {
    console.error("Error en getExchangeHistoryService:", error);
    throw error;
  }
}