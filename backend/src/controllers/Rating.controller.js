import { Op } from "sequelize";
import {
  User,
  Rating,
  Exchange,
  Sell,
  UserBook,
  sequelize,
} from "../db/modelIndex.js";
import { createResponse } from "../utils/responses.util.js";

export const createRating = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { rated_user_id, rating, comment, exchange_id, sell_id } = req.body;

    // Validaciones básicas
    if (!rated_user_id || !rating) {
      return res.status(400).json(
        createResponse(400, "El ID del usuario calificado y la calificación son requeridos", null, null)
      );
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json(
        createResponse(400, "La calificación debe ser entre 1 y 5 estrellas", null, null)
      );
    }

    if (user_id === rated_user_id) {
      return res.status(400).json(
        createResponse(400, "No puedes calificarte a ti mismo", null, null)
      );
    }

    // Verificar que el usuario calificado existe
    const ratedUser = await User.findByPk(rated_user_id);
    if (!ratedUser) {
      return res.status(404).json(
        createResponse(404, "Usuario a calificar no encontrado", null, null)
      );
    }

    // Verificar que existe una transacción entre los usuarios
    let transactionExists = false;
    let transactionType = null;

    if (exchange_id) {
      const exchange = await Exchange.findOne({
        where: {
          exchange_id,
          [Op.or]: [
            { 
              "$Book1.user_id$": user_id,
              "$Book2.user_id$": rated_user_id
            },
            { 
              "$Book1.user_id$": rated_user_id,
              "$Book2.user_id$": user_id
            }
          ]
        },
        include: [
          {
            model: UserBook,
            as: "Book1",
            attributes: ["user_id"],
          },
          {
            model: UserBook,
            as: "Book2",
            attributes: ["user_id"],
          }
        ]
      });

      if (exchange) {
        transactionExists = true;
        transactionType = "exchange";
      }
    }

    if (sell_id && !transactionExists) {
      const sell = await Sell.findOne({
        where: {
          sell_id,
          [Op.or]: [
            { user_id_seller: user_id, user_id_buyer: rated_user_id },
            { user_id_seller: rated_user_id, user_id_buyer: user_id }
          ]
        }
      });

      if (sell) {
        transactionExists = true;
        transactionType = "sell";
      }
    }

    if (!transactionExists) {
      return res.status(400).json(
        createResponse(400, "No existe una transacción válida entre los usuarios", null, null)
      );
    }

    // Verificar que no existe ya una calificación para esta transacción
    const existingRating = await Rating.findOne({
      where: {
        rater_id: user_id,
        rated_id: rated_user_id,
        ...(exchange_id && { exchange_id }),
        ...(sell_id && { sell_id }),
      },
    });

    if (existingRating) {
      return res.status(409).json(
        createResponse(409, "Ya has calificado a este usuario para esta transacción", null, null)
      );
    }

    // Crear la calificación
    const newRating = await Rating.create({
      rater_id: user_id,
      rated_id: rated_user_id,
      rating,
      comment: comment?.trim() || null,
      exchange_id: exchange_id || null,
      sell_id: sell_id || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Obtener la calificación creada con información de los usuarios
    const ratingWithUsers = await Rating.findByPk(newRating.rating_id, {
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

    return res.status(201).json(
      createResponse(201, "Calificación creada exitosamente", ratingWithUsers, null)
    );
  } catch (error) {
    console.error("Error al crear calificación:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

export const getUserRatings = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Verificar que el usuario existe
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json(
        createResponse(404, "Usuario no encontrado", null, null)
      );
    }

    // Obtener calificaciones recibidas por el usuario
    const ratings = await Rating.findAll({
      where: { rated_id: user_id },
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
    const totalRatings = await Rating.count({ where: { rated_id: user_id } });
    const avgRating = await Rating.findOne({
      where: { rated_id: user_id },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
      ],
      raw: true,
    });

    const ratingDistribution = await Rating.findAll({
      where: { rated_id: user_id },
      attributes: [
        "rating",
        [sequelize.fn("COUNT", sequelize.col("rating")), "count"],
      ],
      group: ["rating"],
      order: [["rating", "DESC"]],
      raw: true,
    });

    return res.json(
      createResponse(
        200,
        "Calificaciones obtenidas exitosamente",
        ratings,
        null,
        {
          total: totalRatings,
          average_rating: parseFloat(avgRating?.average_rating || 0).toFixed(1),
          distribution: ratingDistribution,
        }
      )
    );
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

export const getMyRatings = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { type = "received", limit = 10, offset = 0 } = req.query;

    let whereClause = {};
    let includeClause = [];

    if (type === "received") {
      whereClause.rated_id = user_id;
      includeClause.push({
        model: User,
        as: "Rater",
        attributes: ["user_id", "first_name", "last_name"],
      });
    } else if (type === "given") {
      whereClause.rater_id = user_id;
      includeClause.push({
        model: User,
        as: "Rated",
        attributes: ["user_id", "first_name", "last_name"],
      });
    } else {
      return res.status(400).json(
        createResponse(400, "Tipo de calificación inválido. Use 'received' o 'given'", null, null)
      );
    }

    const ratings = await Rating.findAll({
      where: whereClause,
      include: [
        ...includeClause,
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

    const totalRatings = await Rating.count({ where: whereClause });

    return res.json(
      createResponse(
        200,
        `Calificaciones ${type === "received" ? "recibidas" : "dadas"} obtenidas exitosamente`,
        ratings,
        null,
        { total: totalRatings }
      )
    );
  } catch (error) {
    console.error("Error al obtener mis calificaciones:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

export const updateRating = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { rating_id } = req.params;
    const { rating, comment } = req.body;

    // Validaciones
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json(
        createResponse(400, "La calificación debe ser entre 1 y 5 estrellas", null, null)
      );
    }

    // Buscar la calificación
    const existingRating = await Rating.findOne({
      where: {
        rating_id,
        rater_id: user_id,
      },
    });

    if (!existingRating) {
      return res.status(404).json(
        createResponse(404, "Calificación no encontrada o no autorizada", null, null)
      );
    }

    // Actualizar la calificación
    const updateData = {
      updated_at: new Date(),
    };

    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment?.trim() || null;

    await existingRating.update(updateData);

    // Obtener la calificación actualizada con información de los usuarios
    const updatedRating = await Rating.findByPk(rating_id, {
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

    return res.json(
      createResponse(200, "Calificación actualizada exitosamente", updatedRating, null)
    );
  } catch (error) {
    console.error("Error al actualizar calificación:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

export const deleteRating = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { rating_id } = req.params;

    const rating = await Rating.findOne({
      where: {
        rating_id,
        rater_id: user_id,
      },
    });

    if (!rating) {
      return res.status(404).json(
        createResponse(404, "Calificación no encontrada o no autorizada", null, null)
      );
    }

    await rating.destroy();

    return res.json(
      createResponse(200, "Calificación eliminada exitosamente", null, null)
    );
  } catch (error) {
    console.error("Error al eliminar calificación:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

export const getPendingRatings = async (req, res) => {
  try {
    const { user_id } = req.user;

    // Obtener transacciones completadas donde el usuario puede dar calificaciones
    const pendingFromExchanges = await sequelize.query(`
      SELECT DISTINCT
        e.exchange_id,
        e.date_exchange as transaction_date,
        'exchange' as transaction_type,
        CASE 
          WHEN ub1.user_id = :userId THEN ub2.user_id
          ELSE ub1.user_id
        END as other_user_id,
        CASE 
          WHEN ub1.user_id = :userId THEN u2.first_name
          ELSE u1.first_name
        END as other_user_first_name,
        CASE 
          WHEN ub1.user_id = :userId THEN u2.last_name
          ELSE u1.last_name
        END as other_user_last_name
      FROM "Exchange" e
      JOIN "UserBook" ub1 ON e.user_book_id_1 = ub1.user_book_id
      JOIN "UserBook" ub2 ON e.user_book_id_2 = ub2.user_book_id
      JOIN "User" u1 ON ub1.user_id = u1.user_id
      JOIN "User" u2 ON ub2.user_id = u2.user_id
      JOIN "State" s ON e.state_id = s.state_id
      WHERE (ub1.user_id = :userId OR ub2.user_id = :userId)
        AND s.state_name = 'Completado'
        AND NOT EXISTS (
          SELECT 1 FROM "Rating" r 
          WHERE r.rater_id = :userId 
            AND r.exchange_id = e.exchange_id
            AND r.rated_id = CASE 
              WHEN ub1.user_id = :userId THEN ub2.user_id
              ELSE ub1.user_id
            END
        )
    `, {
      replacements: { userId: user_id },
      type: sequelize.QueryTypes.SELECT
    });

    const pendingFromSells = await sequelize.query(`
      SELECT DISTINCT
        s.sell_id,
        s.date_sell as transaction_date,
        'sell' as transaction_type,
        CASE 
          WHEN s.user_id_seller = :userId THEN s.user_id_buyer
          ELSE s.user_id_seller
        END as other_user_id,
        CASE 
          WHEN s.user_id_seller = :userId THEN u_buyer.first_name
          ELSE u_seller.first_name
        END as other_user_first_name,
        CASE 
          WHEN s.user_id_seller = :userId THEN u_buyer.last_name
          ELSE u_seller.last_name
        END as other_user_last_name
      FROM "Sell" s
      JOIN "User" u_seller ON s.user_id_seller = u_seller.user_id
      JOIN "User" u_buyer ON s.user_id_buyer = u_buyer.user_id
      JOIN "State" st ON s.state_id = st.state_id
      WHERE (s.user_id_seller = :userId OR s.user_id_buyer = :userId)
        AND st.state_name = 'Completado'
        AND NOT EXISTS (
          SELECT 1 FROM "Rating" r 
          WHERE r.rater_id = :userId 
            AND r.sell_id = s.sell_id
            AND r.rated_id = CASE 
              WHEN s.user_id_seller = :userId THEN s.user_id_buyer
              ELSE s.user_id_seller
            END
        )
    `, {
      replacements: { userId: user_id },
      type: sequelize.QueryTypes.SELECT
    });

    const pendingRatings = [...pendingFromExchanges, ...pendingFromSells];

    return res.json(
      createResponse(
        200,
        "Calificaciones pendientes obtenidas exitosamente",
        pendingRatings,
        null,
        { total: pendingRatings.length }
      )
    );
  } catch (error) {
    console.error("Error al obtener calificaciones pendientes:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
}; 