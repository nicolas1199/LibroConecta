import { PublishedBooks, Match, User } from "../db/modelIndex.js";
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

    // Obtener información del match con los libros publicados
    const matchData = await Match.findByPk(matchId, {
      include: [
        {
          model: PublishedBooks,
          as: "PublishedBook1",
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        },
        {
          model: PublishedBooks,
          as: "PublishedBook2",
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        },
      ],
    });

    if (!matchData) {
      throw new Error("Datos del match no encontrados");
    }

    // Marcar ambos libros como vendidos/intercambiados
    const updatePromises = [];
    
    if (matchData.PublishedBook1) {
      updatePromises.push(
        PublishedBooks.update(
          { status: 'sold', updated_at: new Date() },
          { where: { published_book_id: matchData.PublishedBook1.published_book_id } }
        )
      );
    }
    
    if (matchData.PublishedBook2) {
      updatePromises.push(
        PublishedBooks.update(
          { status: 'sold', updated_at: new Date() },
          { where: { published_book_id: matchData.PublishedBook2.published_book_id } }
        )
      );
    }

    await Promise.all(updatePromises);

    return {
      success: true,
      message: "Intercambio marcado como completado",
      match: matchData,
    };
  } catch (error) {
    console.error("Error al completar intercambio:", error);
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
      include: [
        {
          model: PublishedBooks,
          as: "PublishedBook1",
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        },
        {
          model: PublishedBooks,
          as: "PublishedBook2",
          include: [
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        },
        {
          model: User,
          as: "User1",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: User,
          as: "User2",
          attributes: ["user_id", "first_name", "last_name"],
        },
      ],
    });

    if (!match) {
      throw new Error("Match no encontrado o no autorizado");
    }

    // Determinar el otro usuario
    const otherUser = match.user_id_1 === userId ? match.User2 : match.User1;
    const myBook = match.user_id_1 === userId ? match.PublishedBook1 : match.PublishedBook2;
    const otherBook = match.user_id_1 === userId ? match.PublishedBook2 : match.PublishedBook1;

    return {
      match_id: match.match_id,
      date_match: match.date_match,
      other_user: otherUser,
      my_book: myBook,
      other_book: otherBook,
      is_completed: myBook?.status === 'sold' || otherBook?.status === 'sold',
    };
  } catch (error) {
    console.error("Error al obtener información del intercambio:", error);
    throw error;
  }
}
