import { MatchBooks, PublishedBooks, Match, Book, User } from "../db/modelIndex.js";
import { Op } from "sequelize";

// Agregar un libro específico a un match
export async function addBookToMatch(matchId, publishedBookId, userId) {
  try {
    // Verificar que el libro pertenece al usuario
    const book = await PublishedBooks.findOne({
      where: {
        published_book_id: publishedBookId,
        user_id: userId
      }
    });

    if (!book) {
      throw new Error("Libro no encontrado o no pertenece al usuario");
    }

    // Verificar que el usuario es parte del match
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    if (!match) {
      throw new Error("Match no encontrado o usuario no autorizado");
    }

    // Crear la relación
    const matchBook = await MatchBooks.create({
      match_id: matchId,
      published_book_id: publishedBookId,
      user_id: userId
    });

    console.log(`✅ Libro ${publishedBookId} agregado al match ${matchId} por usuario ${userId}`);
    return matchBook;

  } catch (error) {
    console.error("Error en addBookToMatch:", error);
    throw error;
  }
}

// Obtener todos los libros de un match
export async function getMatchBooks(matchId) {
  try {
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

    return matchBooks;
  } catch (error) {
    console.error("Error en getMatchBooks:", error);
    throw error;
  }
}

// NUEVO: Función para agregar libros automáticamente a matches existentes
export async function populateExistingMatch(matchId) {
  try {
    console.log(`🔄 Intentando poblar match ${matchId} con libros...`);
    
    // Obtener el match
    const match = await Match.findByPk(matchId);
    if (!match) {
      throw new Error("Match no encontrado");
    }

    // Verificar si ya tiene libros
    const existingBooks = await MatchBooks.count({ where: { match_id: matchId } });
    if (existingBooks > 0) {
      console.log(`✅ Match ${matchId} ya tiene ${existingBooks} libros`);
      return;
    }

    // Buscar libros de intercambio de ambos usuarios
    const [user1Books, user2Books] = await Promise.all([
      PublishedBooks.findAll({
        where: { 
          user_id: match.user_id_1,
          transaction_type_id: 2 // Intercambio
        },
        limit: 2,
        order: [['date_published', 'DESC']]
      }),
      PublishedBooks.findAll({
        where: { 
          user_id: match.user_id_2,
          transaction_type_id: 2 // Intercambio
        },
        limit: 2,
        order: [['date_published', 'DESC']]
      })
    ]);

    // Agregar un libro de cada usuario al match
    const booksToAdd = [];
    if (user1Books.length > 0) {
      booksToAdd.push({
        match_id: matchId,
        published_book_id: user1Books[0].published_book_id,
        user_id: match.user_id_1
      });
    }
    if (user2Books.length > 0) {
      booksToAdd.push({
        match_id: matchId,
        published_book_id: user2Books[0].published_book_id,
        user_id: match.user_id_2
      });
    }

    if (booksToAdd.length > 0) {
      await MatchBooks.bulkCreate(booksToAdd);
      console.log(`✅ Agregados ${booksToAdd.length} libros al match ${matchId}`);
      return booksToAdd.length;
    } else {
      console.log(`⚠️ No se encontraron libros de intercambio para el match ${matchId}`);
      return 0;
    }

  } catch (error) {
    console.error("Error en populateExistingMatch:", error);
    throw error;
  }
}