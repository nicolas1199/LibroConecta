import { MatchBooks, PublishedBooks, Match } from "../db/modelIndex.js";

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