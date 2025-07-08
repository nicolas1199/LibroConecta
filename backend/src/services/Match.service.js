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

// Servicio para calcular compatibilidad entre usuarios
export async function calculateCompatibilityService(userId, targetUserId) {
  try {
    // Obtener libros y categorías del usuario actual
    const userBooks = await PublishedBooks.findAll({
      where: { user_id: userId },
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

    // Obtener libros y categorías del usuario objetivo
    const targetUserBooks = await PublishedBooks.findAll({
      where: { user_id: targetUserId },
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

    // Extraer categorías de cada usuario
    const userCategories = new Set();
    const userLocations = new Set();
    
    userBooks.forEach((publishedBook) => {
      publishedBook.Book.Categories.forEach((category) => {
        userCategories.add(category.category_id);
      });
      if (publishedBook.LocationBook) {
        userLocations.add(`${publishedBook.LocationBook.region}-${publishedBook.LocationBook.comuna}`);
      }
    });

    const targetCategories = new Set();
    const targetLocations = new Set();
    
    targetUserBooks.forEach((publishedBook) => {
      publishedBook.Book.Categories.forEach((category) => {
        targetCategories.add(category.category_id);
      });
      if (publishedBook.LocationBook) {
        targetLocations.add(`${publishedBook.LocationBook.region}-${publishedBook.LocationBook.comuna}`);
      }
    });

    // Calcular compatibilidad
    let score = 0;
    let commonCategories = 0;
    let locationMatch = false;

    // Verificar categorías comunes
    for (const categoryId of userCategories) {
      if (targetCategories.has(categoryId)) {
        commonCategories++;
      }
    }

    // Verificar ubicaciones comunes
    for (const location of userLocations) {
      if (targetLocations.has(location)) {
        locationMatch = true;
        break;
      }
    }

    // Calcular score
    score = commonCategories * 10; // 10 puntos por categoría común
    if (locationMatch) score += 50; // 50 puntos por ubicación común

    return {
      score,
      commonCategories,
      locationMatch,
      userBooksCount: userBooks.length,
      targetBooksCount: targetUserBooks.length,
    };
  } catch (error) {
    console.error("Error al calcular compatibilidad:", error);
    throw error;
  }
}

// Servicio para obtener matches sugeridos
export async function getSuggestedMatchesService(userId, options = {}) {
  try {
    const { limit = 10, radius = 50, minScore = 1 } = options;

    // Obtener usuarios que ya son matches
    const existingMatches = await Match.findAll({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
      attributes: ["user_id_1", "user_id_2"],
    });

    const matchedUserIds = new Set();
    existingMatches.forEach((match) => {
      matchedUserIds.add(match.user_id_1);
      matchedUserIds.add(match.user_id_2);
    });
    matchedUserIds.add(userId); // Excluir al usuario actual

    // Obtener usuarios potenciales
    const potentialUsers = await User.findAll({
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
      attributes: ["user_id", "first_name", "last_name", "email"],
    });

    // Calcular compatibilidad con cada usuario
    const suggestedMatches = [];
    
    for (const user of potentialUsers) {
      const compatibility = await calculateCompatibilityService(userId, user.user_id);
      
      if (compatibility.score >= minScore) {
        suggestedMatches.push({
          user: {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
          },
          compatibility,
        });
      }
    }

    // Ordenar por score y limitar resultados
    return suggestedMatches
      .sort((a, b) => b.compatibility.score - a.compatibility.score)
      .slice(0, parseInt(limit));
  } catch (error) {
    console.error("Error al obtener matches sugeridos:", error);
    throw error;
  }
}

// Servicio para obtener matches existentes
export async function getMatchesService(userId, options = {}) {
  try {
    const { limit = 10, offset = 0 } = options;

    const matches = await Match.findAll({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["date_match", "DESC"]],
    });

    // Formatear respuesta
    const formattedMatches = matches.map((match) => {
      const otherUser = match.user_id_1 === userId ? match.User2 : match.User1;
      return {
        match_id: match.match_id,
        date_match: match.date_match,
        user: otherUser,
      };
    });

    return {
      matches: formattedMatches,
      total: matches.length,
    };
  } catch (error) {
    console.error("Error al obtener matches:", error);
    throw error;
  }
}

// Servicio para crear un nuevo match
export async function createMatchService(userId, targetUserId) {
  try {
    // Verificar que los usuarios existen
    const [user1, user2] = await Promise.all([
      User.findByPk(userId),
      User.findByPk(targetUserId),
    ]);

    if (!user1 || !user2) {
      throw new Error("Uno o ambos usuarios no existen");
    }

    // Verificar que no existe ya un match
    const existingMatch = await Match.findOne({
      where: {
        [Op.or]: [
          { user_id_1: userId, user_id_2: targetUserId },
          { user_id_1: targetUserId, user_id_2: userId },
        ],
      },
    });

    if (existingMatch) {
      throw new Error("Ya existe un match entre estos usuarios");
    }

    // Crear el match
    const newMatch = await Match.create({
      user_id_1: userId,
      user_id_2: targetUserId,
      date_match: new Date(),
    });

    return newMatch;
  } catch (error) {
    console.error("Error al crear match:", error);
    throw error;
  }
}

// Servicio para eliminar un match
export async function deleteMatchService(matchId, userId) {
  try {
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    if (!match) {
      throw new Error("Match no encontrado o no autorizado");
    }

    await match.destroy();
    return { deleted: true };
  } catch (error) {
    console.error("Error al eliminar match:", error);
    throw error;
  }
}

// Servicio para obtener estadísticas de matches
export async function getMatchStatsService(userId) {
  try {
    const totalMatches = await Match.count({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    const recentMatches = await Match.count({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
        date_match: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
        },
      },
    });

    return {
      totalMatches,
      recentMatches,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de matches:", error);
    throw error;
  }
} 