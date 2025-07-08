import { Op } from "sequelize";
import {
  User,
  Rating,
  Exchange,
  Sell,
  UserBook,
  Match,
  sequelize,
} from "../db/modelIndex.js";

// Servicio para validar transacciones entre usuarios
export async function validateTransactionService(userId, ratedUserId, exchangeId, sellId) {
  try {
    let transactionExists = false;
    let transactionDetails = null;

    // Verificar exchange
    if (exchangeId) {
      const exchange = await Exchange.findOne({
        where: {
          exchange_id: exchangeId,
          [Op.or]: [
            { 
              "$Book1.user_id$": userId,
              "$Book2.user_id$": ratedUserId
            },
            { 
              "$Book1.user_id$": ratedUserId,
              "$Book2.user_id$": userId
            }
          ]
        },
        include: [
          {
            model: UserBook,
            as: "Book1",
            attributes: ["user_id", "title", "author"],
          },
          {
            model: UserBook,
            as: "Book2",
            attributes: ["user_id", "title", "author"],
          }
        ]
      });

      if (exchange) {
        transactionExists = true;
        transactionDetails = {
          type: "exchange",
          id: exchange.exchange_id,
          date: exchange.date_exchange,
          book1: exchange.Book1,
          book2: exchange.Book2,
        };
      }
    }

    // Verificar sell
    if (sellId && !transactionExists) {
      const sell = await Sell.findOne({
        where: {
          sell_id: sellId,
          [Op.or]: [
            { user_id_seller: userId, user_id_buyer: ratedUserId },
            { user_id_seller: ratedUserId, user_id_buyer: userId }
          ]
        },
        include: [
          {
            model: UserBook,
            attributes: ["title", "author", "price"],
          }
        ]
      });

      if (sell) {
        transactionExists = true;
        transactionDetails = {
          type: "sell",
          id: sell.sell_id,
          date: sell.date_sell,
          book: sell.UserBook,
          seller_id: sell.user_id_seller,
          buyer_id: sell.user_id_buyer,
        };
      }
    }

    return {
      exists: transactionExists,
      details: transactionDetails,
    };
  } catch (error) {
    console.error("Error al validar transacción:", error);
    throw error;
  }
}

// Servicio para crear una calificación
export async function createRatingService(raterId, ratedId, ratingData) {
  try {
    const { rating, comment, exchange_id, sell_id } = ratingData;

    // Verificar que el usuario calificado existe
    const ratedUser = await User.findByPk(ratedId);
    if (!ratedUser) {
      throw new Error("Usuario a calificar no encontrado");
    }

    // Validar transacción
    const transaction = await validateTransactionService(raterId, ratedId, exchange_id, sell_id);
    if (!transaction.exists) {
      throw new Error("No existe una transacción válida entre los usuarios");
    }

    // Verificar que no existe ya una calificación para esta transacción
    const existingRating = await Rating.findOne({
      where: {
        rater_id: raterId,
        rated_id: ratedId,
        ...(exchange_id && { exchange_id }),
        ...(sell_id && { sell_id }),
      },
    });

    if (existingRating) {
      throw new Error("Ya has calificado a este usuario para esta transacción");
    }

    // Crear la calificación
    const newRating = await Rating.create({
      rater_id: raterId,
      rated_id: ratedId,
      rating,
      comment: comment?.trim() || null,
      exchange_id: exchange_id || null,
      sell_id: sell_id || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Obtener la calificación con información adicional
    const ratingWithDetails = await Rating.findByPk(newRating.rating_id, {
      include: [
        {
          model: User,
          as: "Rater",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: User,
          as: "Rated",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: Exchange,
          required: false,
          attributes: ["exchange_id", "date_exchange"],
        },
        {
          model: Sell,
          required: false,
          attributes: ["sell_id", "date_sell"],
        },
      ],
    });

    return ratingWithDetails;
  } catch (error) {
    console.error("Error al crear calificación:", error);
    throw error;
  }
}

// Servicio para obtener calificaciones de un usuario
export async function getUserRatingsService(userId, options = {}) {
  try {
    const { limit = 10, offset = 0 } = options;

    // Obtener calificaciones recibidas
    const ratings = await Rating.findAll({
      where: { rated_id: userId },
      include: [
        {
          model: User,
          as: "Rater",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: Exchange,
          required: false,
          attributes: ["exchange_id", "date_exchange"],
        },
        {
          model: Sell,
          required: false,
          attributes: ["sell_id", "date_sell"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Calcular estadísticas
    const stats = await getRatingStatsService(userId);

    return {
      ratings,
      stats,
      total: ratings.length,
    };
  } catch (error) {
    console.error("Error al obtener calificaciones de usuario:", error);
    throw error;
  }
}

// Servicio para obtener estadísticas de calificaciones
export async function getRatingStatsService(userId) {
  try {
    // Estadísticas básicas
    const totalRatings = await Rating.count({ where: { rated_id: userId } });
    
    const avgRatingResult = await Rating.findOne({
      where: { rated_id: userId },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
        [sequelize.fn("COUNT", sequelize.col("rating")), "total_ratings"],
      ],
    });

    // Distribución de calificaciones
    const ratingDistribution = await Rating.findAll({
      where: { rated_id: userId },
      attributes: [
        "rating",
        [sequelize.fn("COUNT", sequelize.col("rating")), "count"],
      ],
      group: ["rating"],
      order: [["rating", "DESC"]],
    });

    // Calificaciones por tipo de transacción
    const exchangeRatings = await Rating.count({
      where: { rated_id: userId, exchange_id: { [Op.not]: null } },
    });

    const sellRatings = await Rating.count({
      where: { rated_id: userId, sell_id: { [Op.not]: null } },
    });

    // Calificaciones recientes (último mes)
    const recentRatings = await Rating.count({
      where: {
        rated_id: userId,
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      totalRatings,
      averageRating: parseFloat(avgRatingResult?.dataValues?.average_rating || 0).toFixed(1),
      ratingDistribution: ratingDistribution.map(item => ({
        rating: item.rating,
        count: parseInt(item.dataValues.count),
      })),
      transactionTypes: {
        exchanges: exchangeRatings,
        sells: sellRatings,
      },
      recentRatings,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de calificaciones:", error);
    throw error;
  }
}

// Servicio para obtener calificaciones pendientes
export async function getPendingRatingsService(userId) {
  try {
    // Obtener exchanges completados sin calificar
    const pendingExchanges = await sequelize.query(`
      SELECT DISTINCT
        e.exchange_id,
        e.date_exchange,
        CASE 
          WHEN ub1.user_id = :userId THEN u2.user_id
          ELSE u1.user_id
        END as other_user_id,
        CASE 
          WHEN ub1.user_id = :userId THEN u2.first_name
          ELSE u1.first_name
        END as other_first_name,
        CASE 
          WHEN ub1.user_id = :userId THEN u2.last_name
          ELSE u1.last_name
        END as other_last_name,
        CASE 
          WHEN ub1.user_id = :userId THEN ub2.title
          ELSE ub1.title
        END as book_title,
        'exchange' as transaction_type
      FROM "Exchange" e
      JOIN "UserBook" ub1 ON e.user_book_id_1 = ub1.user_book_id
      JOIN "UserBook" ub2 ON e.user_book_id_2 = ub2.user_book_id
      JOIN "User" u1 ON ub1.user_id = u1.user_id
      JOIN "User" u2 ON ub2.user_id = u2.user_id
      WHERE (ub1.user_id = :userId OR ub2.user_id = :userId)
        AND e.exchange_id NOT IN (
          SELECT exchange_id FROM "Rating" 
          WHERE rater_id = :userId AND exchange_id IS NOT NULL
        )
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT,
    });

    // Obtener sells completados sin calificar
    const pendingSells = await sequelize.query(`
      SELECT DISTINCT
        s.sell_id,
        s.date_sell,
        CASE 
          WHEN s.user_id_seller = :userId THEN s.user_id_buyer
          ELSE s.user_id_seller
        END as other_user_id,
        CASE 
          WHEN s.user_id_seller = :userId THEN ub.first_name
          ELSE us.first_name
        END as other_first_name,
        CASE 
          WHEN s.user_id_seller = :userId THEN ub.last_name
          ELSE us.last_name
        END as other_last_name,
        ubk.title as book_title,
        'sell' as transaction_type
      FROM "Sell" s
      JOIN "UserBook" ubk ON s.user_book_id = ubk.user_book_id
      JOIN "User" us ON s.user_id_seller = us.user_id
      JOIN "User" ub ON s.user_id_buyer = ub.user_id
      WHERE (s.user_id_seller = :userId OR s.user_id_buyer = :userId)
        AND s.sell_id NOT IN (
          SELECT sell_id FROM "Rating" 
          WHERE rater_id = :userId AND sell_id IS NOT NULL
        )
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT,
    });

    // Combinar resultados
    const allPending = [
      ...pendingExchanges.map(item => ({
        ...item,
        transaction_id: item.exchange_id,
        transaction_date: item.date_exchange,
      })),
      ...pendingSells.map(item => ({
        ...item,
        transaction_id: item.sell_id,
        transaction_date: item.date_sell,
      })),
    ];

    // Ordenar por fecha (más recientes primero)
    allPending.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

    return {
      pendingRatings: allPending,
      total: allPending.length,
    };
  } catch (error) {
    console.error("Error al obtener calificaciones pendientes:", error);
    throw error;
  }
}

// Servicio para obtener calificaciones del usuario (dadas y recibidas)
export async function getMyRatingsService(userId, options = {}) {
  try {
    const { type = "received", limit = 10, offset = 0 } = options;

    let whereClause = {};
    if (type === "received") {
      whereClause = { rated_id: userId };
    } else if (type === "given") {
      whereClause = { rater_id: userId };
    }

    const ratings = await Rating.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "Rater",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: User,
          as: "Rated",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: Exchange,
          required: false,
          attributes: ["exchange_id", "date_exchange"],
        },
        {
          model: Sell,
          required: false,
          attributes: ["sell_id", "date_sell"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      ratings,
      type,
      total: ratings.length,
    };
  } catch (error) {
    console.error("Error al obtener mis calificaciones:", error);
    throw error;
  }
}

// Servicio para actualizar una calificación
export async function updateRatingService(ratingId, userId, updateData) {
  try {
    const rating = await Rating.findByPk(ratingId);

    if (!rating) {
      throw new Error("Calificación no encontrada");
    }

    // Verificar ownership
    if (rating.rater_id !== userId) {
      throw new Error("No tienes permisos para actualizar esta calificación");
    }

    // Actualizar
    await rating.update({
      ...updateData,
      updated_at: new Date(),
    });

    // Obtener la calificación actualizada con información adicional
    const updatedRating = await Rating.findByPk(ratingId, {
      include: [
        {
          model: User,
          as: "Rater",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: User,
          as: "Rated",
          attributes: ["user_id", "first_name", "last_name"],
        },
      ],
    });

    return updatedRating;
  } catch (error) {
    console.error("Error al actualizar calificación:", error);
    throw error;
  }
}

// Servicio para eliminar una calificación
export async function deleteRatingService(ratingId, userId) {
  try {
    const rating = await Rating.findByPk(ratingId);

    if (!rating) {
      throw new Error("Calificación no encontrada");
    }

    // Verificar ownership
    if (rating.rater_id !== userId) {
      throw new Error("No tienes permisos para eliminar esta calificación");
    }

    await rating.destroy();

    return {
      deleted: true,
      rating_id: ratingId,
    };
  } catch (error) {
    console.error("Error al eliminar calificación:", error);
    throw error;
  }
} 