import { Op } from "sequelize";
import {
  User,
  Match,
  PublishedBooks,
  Book,
  BookCategory,
  Category,
  LocationBook,
  sequelize,
} from "../db/modelIndex.js";
import { createResponse } from "../utils/responses.util.js";
import { getUserSpecificMatchesService, migrateExistingMatchesToSpecificService } from "../services/SpecificMatch.service.js";

export const getMatches = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { limit = 10, offset = 0 } = req.query;

    // Obtener matches existentes del usuario
    const matches = await Match.findAll({
      where: {
        [Op.or]: [{ user_id_1: user_id }, { user_id_2: user_id }],
      },
      include: [
        {
          model: User,
          as: "User1",
          attributes: ["user_id", "first_name", "last_name", "email", "profile_image_base64"],
        },
        {
          model: User,
          as: "User2",
          attributes: ["user_id", "first_name", "last_name", "email", "profile_image_base64"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["date_match", "DESC"]],
    });

    // Formatear respuesta para mostrar el otro usuario
    const formattedMatches = matches.map((match) => {
      const otherUser =
        match.get("user_id_1") === user_id ? match.User2 : match.User1;
      return {
        match_id: match.get("match_id"),
        date_match: match.get("date_match"),
        user: otherUser,
      };
    });

    return res.json(
      createResponse(
        200,
        "Matches obtenidos exitosamente",
        formattedMatches,
        null,
        { total: matches.length }
      )
    );
  } catch (error) {
    console.error("Error al obtener matches:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

export const getSuggestedMatches = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { limit = 10, radius = 50 } = req.query;

    // Obtener información del usuario actual
    const currentUser = await User.findByPk(user_id);
    if (!currentUser) {
      return res
        .status(404)
        .json(createResponse(404, "Usuario no encontrado", null, null));
    }

    // Obtener los libros publicados por el usuario y sus categorías
    const userBooks = await PublishedBooks.findAll({
      where: { user_id },
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              attributes: ["category_id", "title"],
            },
          ],
        },
        {
          model: LocationBook,
          attributes: ["region", "comuna"],
        },
      ],
    });

    // Extraer categorías de interés del usuario
    const userCategories = new Set();
    userBooks.forEach((publishedBook) => {
      publishedBook.Book.Categories.forEach((category) => {
        userCategories.add(category.category_id);
      });
    });

    // Obtener ubicaciones del usuario
    const userLocations = userBooks
      .map((book) =>
        book.LocationBook
          ? `${book.LocationBook.region}-${book.LocationBook.comuna}`
          : null
      )
      .filter(Boolean);

    // Obtener usuarios que ya son matches
    const existingMatches = await Match.findAll({
      where: {
        [Op.or]: [{ user_id_1: user_id }, { user_id_2: user_id }],
      },
      attributes: ["user_id_1", "user_id_2"],
    });

    const matchedUserIds = new Set();
    existingMatches.forEach((match) => {
      matchedUserIds.add(match.get("user_id_1"));
      matchedUserIds.add(match.get("user_id_2"));
    });
    matchedUserIds.add(user_id); // Excluir al usuario actual

    // Buscar usuarios compatibles
    const potentialMatches = await User.findAll({
      where: {
        user_id: {
          [Op.notIn]: Array.from(matchedUserIds),
        },
      },
      include: [
        {
          model: PublishedBooks,
          include: [
            {
              model: Book,
              include: [
                {
                  model: Category,
                  as: "Categories",
                  attributes: ["category_id", "title"],
                },
              ],
            },
            {
              model: LocationBook,
              attributes: ["region", "comuna"],
            },
          ],
        },
      ],
      attributes: ["user_id", "first_name", "last_name", "email", "profile_image_base64"],
    });

    // Calcular compatibilidad
    const compatibilityScores = potentialMatches.map((user) => {
      let score = 0;
      let commonCategories = 0;
      let locationMatch = false;

      // Verificar categorías comunes
      user.PublishedBooks.forEach((publishedBook) => {
        publishedBook.Book.Categories.forEach((category) => {
          if (userCategories.has(category.category_id)) {
            commonCategories++;
          }
        });

        // Verificar ubicaciones comunes
        if (publishedBook.LocationBook) {
          const bookLocation = `${publishedBook.LocationBook.region}-${publishedBook.LocationBook.comuna}`;
          if (userLocations.includes(bookLocation)) {
            locationMatch = true;
          }
        }
      });

      // Calcular score basado en intereses comunes y ubicación
      score = commonCategories * 10; // 10 puntos por categoría común
      if (locationMatch) score += 50; // 50 puntos por ubicación común

      return {
        user: {
          user_id: user.get("user_id"),
          first_name: user.get("first_name"),
          last_name: user.get("last_name"),
          email: user.get("email"),
          profile_image_base64: user.get("profile_image_base64"),
        },
        score,
        commonCategories,
        locationMatch,
        booksCount: user.PublishedBooks.length,
      };
    });

    // Ordenar por score y filtrar usuarios con al menos alguna compatibilidad
    const suggestedMatches = compatibilityScores
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));

    return res.json(
      createResponse(
        200,
        "Matches sugeridos obtenidos exitosamente",
        suggestedMatches,
        null,
        { total: suggestedMatches.length }
      )
    );
  } catch (error) {
    console.error("Error al obtener matches sugeridos:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

export const createMatch = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { target_user_id } = req.body;

    if (!target_user_id) {
      return res
        .status(400)
        .json(
          createResponse(
            400,
            "El ID del usuario objetivo es requerido",
            null,
            null
          )
        );
    }

    if (user_id === target_user_id) {
      return res
        .status(400)
        .json(
          createResponse(400, "No puedes hacer match contigo mismo", null, null)
        );
    }

    // Verificar si ya existe un match
    const existingMatch = await Match.findOne({
      where: {
        [Op.or]: [
          { user_id_1: user_id, user_id_2: target_user_id },
          { user_id_1: target_user_id, user_id_2: user_id },
        ],
      },
    });

    if (existingMatch) {
      return res
        .status(409)
        .json(
          createResponse(
            409,
            "Ya existe un match entre estos usuarios",
            null,
            null
          )
        );
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await User.findByPk(target_user_id);
    if (!targetUser) {
      return res
        .status(404)
        .json(
          createResponse(404, "Usuario objetivo no encontrado", null, null)
        );
    }

    // Crear el match
    const newMatch = await Match.create({
      user_id_1: user_id,
      user_id_2: target_user_id,
      date_match: new Date(),
    });

    // Obtener el match creado con información de los usuarios
    const matchWithUsers = await Match.findByPk(newMatch.match_id, {
      include: [
        {
          model: User,
          as: "User1",
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
        {
          model: User,
          as: "User2",
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
      ],
    });

    return res
      .status(201)
      .json(
        createResponse(201, "Match creado exitosamente", matchWithUsers, null)
      );
  } catch (error) {
    console.error("Error al crear match:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

export const deleteMatch = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { match_id } = req.params;

    const match = await Match.findOne({
      where: {
        match_id,
        [Op.or]: [{ user_id_1: user_id }, { user_id_2: user_id }],
      },
    });

    if (!match) {
      return res
        .status(404)
        .json(createResponse(404, "Match no encontrado", null, null));
    }

    await match.destroy();

    return res.json(
      createResponse(200, "Match eliminado exitosamente", null, null)
    );
  } catch (error) {
    console.error("Error al eliminar match:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

// Nuevo endpoint para obtener matches específicos
export const getSpecificMatches = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const matches = await getUserSpecificMatchesService(userId);
    
    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error("Error fetching specific matches:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener matches específicos"
    });
  }
};

// Endpoint para migrar matches existentes
export const migrateMatches = async (req, res) => {
  try {
    const result = await migrateExistingMatchesToSpecificService();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error migrating matches:", error);
    res.status(500).json({
      success: false,
      message: "Error en la migración"
    });
  }
};
