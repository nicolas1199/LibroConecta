import { Match, PublishedBooks, User, Book } from "../db/modelIndex.js";
import { Op } from "sequelize";

// Crear match específico entre dos libros
export const createSpecificMatchService = async (user1Id, user1BookId, user2Id, user2BookId) => {
  try {
    // Verificar que no existe ya este match específico
    const existingMatch = await Match.findOne({
      where: {
        [Op.or]: [
          {
            user_id_1: user1Id,
            user_1_book_id: user1BookId,
            user_id_2: user2Id,
            user_2_book_id: user2BookId
          },
          {
            user_id_1: user2Id,
            user_1_book_id: user2BookId,
            user_id_2: user1Id,
            user_2_book_id: user1BookId
          }
        ]
      }
    });

    if (existingMatch) {
      return { success: false, message: "Ya existe un match para estos libros específicos" };
    }

    // Crear el nuevo match específico
    const newMatch = await Match.create({
      user_id_1: user1Id,
      user_1_book_id: user1BookId,
      user_id_2: user2Id,
      user_2_book_id: user2BookId,
      date_match: new Date()
    });

    return { success: true, match: newMatch };
  } catch (error) {
    console.error("Error creating specific match:", error);
    throw error;
  }
};

// Obtener matches específicos de un usuario
export const getUserSpecificMatchesService = async (userId) => {
  try {
    const matches = await Match.findAll({
      where: {
        [Op.or]: [
          { user_id_1: userId },
          { user_id_2: userId }
        ]
      },
      include: [
        {
          model: User,
          as: "User1",
          attributes: ["user_id", "first_name", "last_name", "email"]
        },
        {
          model: User,
          as: "User2",
          attributes: ["user_id", "first_name", "last_name", "email"]
        },
        {
          model: PublishedBooks,
          as: "User1Book",
          include: [
            {
              model: Book,
              attributes: ["title", "author", "isbn"]
            }
          ]
        },
        {
          model: PublishedBooks,
          as: "User2Book",
          include: [
            {
              model: Book,
              attributes: ["title", "author", "isbn"]
            }
          ]
        }
      ],
      order: [["date_match", "DESC"]]
    });

    // Formatear respuesta para incluir información del "otro usuario" y "mi libro" / "su libro"
    const formattedMatches = matches.map(match => {
      const isUser1 = match.user_id_1 === userId;
      const otherUser = isUser1 ? match.User2 : match.User1;
      const myBook = isUser1 ? match.User1Book : match.User2Book;
      const theirBook = isUser1 ? match.User2Book : match.User1Book;

      return {
        match_id: match.match_id,
        date_match: match.date_match,
        other_user: {
          user_id: otherUser.user_id,
          first_name: otherUser.first_name,
          last_name: otherUser.last_name,
          email: otherUser.email
        },
        my_book: {
          published_book_id: myBook.published_book_id,
          title: myBook.Book.title,
          author: myBook.Book.author,
          price: myBook.price,
          condition: myBook.condition
        },
        their_book: {
          published_book_id: theirBook.published_book_id,
          title: theirBook.Book.title,
          author: theirBook.Book.author,
          price: theirBook.price,
          condition: theirBook.condition
        }
      };
    });

    return formattedMatches;
  } catch (error) {
    console.error("Error fetching user specific matches:", error);
    throw error;
  }
};

// Migrar matches existentes (sin libros específicos) a matches específicos
export const migrateExistingMatchesToSpecificService = async () => {
  try {
    // Buscar matches sin libros específicos
    const oldMatches = await Match.findAll({
      where: {
        user_1_book_id: null,
        user_2_book_id: null
      }
    });

    console.log(`📚 Encontrados ${oldMatches.length} matches antiguos para migrar`);

    for (const match of oldMatches) {
      // Obtener todos los libros de ambos usuarios
      const user1Books = await PublishedBooks.findAll({
        where: { user_id: match.user_id_1, status: 'available' }
      });
      
      const user2Books = await PublishedBooks.findAll({
        where: { user_id: match.user_id_2, status: 'available' }
      });

      // Crear matches específicos para cada combinación
      const newMatches = [];
      for (const user1Book of user1Books) {
        for (const user2Book of user2Books) {
          const newMatch = await createSpecificMatchService(
            match.user_id_1,
            user1Book.published_book_id,
            match.user_id_2,
            user2Book.published_book_id
          );
          if (newMatch.success) {
            newMatches.push(newMatch.match);
          }
        }
      }

      console.log(`➡️ Match ${match.match_id}: Creados ${newMatches.length} matches específicos`);
    }

    console.log("✅ Migración completada");
    return { success: true, message: "Migración completada exitosamente" };
  } catch (error) {
    console.error("Error en migración:", error);
    throw error;
  }
};