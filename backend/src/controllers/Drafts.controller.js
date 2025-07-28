import {
  Drafts,
  User,
  BookCondition,
  TransactionType,
  LocationBook,
  PublishedBooks,
} from "../db/modelIndex.js";
import { Op } from "sequelize";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { validateUUID } from "../utils/uuid.util.js";

// POST /api/drafts - Crear o actualizar un borrador
export const saveDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const draftData = req.body;

    // Calcular porcentaje de completado
    const requiredFields = ['title', 'author', 'description', 'price', 'book_condition_id', 'transaction_type_id', 'location_book_id'];
    const completedFields = requiredFields.filter(field => 
      draftData[field] && draftData[field] !== '' && draftData[field] !== null
    );
    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);

    // Si ya existe un borrador con el mismo ID, lo actualizamos
    if (draftData.id) {
      const existingDraft = await Drafts.findOne({
        where: { id: draftData.id, user_id: userId }
      });

      if (existingDraft) {
        await existingDraft.update({
          ...draftData,
          completion_percentage: completionPercentage,
          last_edited: new Date(),
          user_id: userId,
        });

        return successResponse(res, "Borrador actualizado exitosamente", existingDraft);
      }
    }

    // Crear nuevo borrador
    const newDraft = await Drafts.create({
      ...draftData,
      user_id: userId,
      completion_percentage: completionPercentage,
      last_edited: new Date(),
    });

    return successResponse(res, "Borrador guardado exitosamente", newDraft);
  } catch (error) {
    console.error("Error saving draft:", error);
    return errorResponse(res, "Error interno del servidor", 500);
  }
};

// GET /api/drafts - Obtener todos los borradores del usuario
export const getUserDrafts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    let whereClause = { user_id: userId };

    // Si hay término de búsqueda, filtrar por título o autor
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { author: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const drafts = await Drafts.findAll({
      where: whereClause,
      include: [
        {
          model: BookCondition,
          attributes: ['id', 'condition_name']
        },
        {
          model: TransactionType,
          attributes: ['id', 'name']
        },
        {
          model: LocationBook,
          attributes: ['id', 'location_name']
        }
      ],
      order: [['last_edited', 'DESC']]
    });

    return successResponse(res, "Borradores obtenidos exitosamente", drafts);
  } catch (error) {
    console.error("Error getting drafts:", error);
    return errorResponse(res, "Error interno del servidor", 500);
  }
};

// GET /api/drafts/:id - Obtener un borrador específico
export const getDraftById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validar UUID
    if (!validateUUID(id)) {
      return errorResponse(res, "ID de borrador inválido", 400);
    }

    const draft = await Drafts.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: BookCondition,
          attributes: ['id', 'condition_name']
        },
        {
          model: TransactionType,
          attributes: ['id', 'name']
        },
        {
          model: LocationBook,
          attributes: ['id', 'location_name']
        }
      ]
    });

    if (!draft) {
      return errorResponse(res, "Borrador no encontrado", 404);
    }

    return successResponse(res, "Borrador obtenido exitosamente", draft);
  } catch (error) {
    console.error("Error getting draft:", error);
    return errorResponse(res, "Error interno del servidor", 500);
  }
};

// PUT /api/drafts/:id - Actualizar un borrador
export const updateDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Validar UUID
    if (!validateUUID(id)) {
      return errorResponse(res, "ID de borrador inválido", 400);
    }

    const draft = await Drafts.findOne({
      where: { id, user_id: userId }
    });

    if (!draft) {
      return errorResponse(res, "Borrador no encontrado", 404);
    }

    // Calcular porcentaje de completado
    const requiredFields = ['title', 'author', 'description', 'price', 'book_condition_id', 'transaction_type_id', 'location_book_id'];
    const completedFields = requiredFields.filter(field => 
      (updateData[field] || draft[field]) && 
      (updateData[field] || draft[field]) !== '' && 
      (updateData[field] || draft[field]) !== null
    );
    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);

    await draft.update({
      ...updateData,
      completion_percentage: completionPercentage,
      last_edited: new Date(),
    });

    return successResponse(res, "Borrador actualizado exitosamente", draft);
  } catch (error) {
    console.error("Error updating draft:", error);
    return errorResponse(res, "Error interno del servidor", 500);
  }
};

// DELETE /api/drafts/:id - Eliminar un borrador
export const deleteDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validar UUID
    if (!validateUUID(id)) {
      return errorResponse(res, "ID de borrador inválido", 400);
    }

    const draft = await Drafts.findOne({
      where: { id, user_id: userId }
    });

    if (!draft) {
      return errorResponse(res, "Borrador no encontrado", 404);
    }

    await draft.destroy();

    return successResponse(res, "Borrador eliminado exitosamente");
  } catch (error) {
    console.error("Error deleting draft:", error);
    return errorResponse(res, "Error interno del servidor", 500);
  }
};

// POST /api/drafts/:id/publish - Publicar un borrador
export const publishFromDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validar UUID
    if (!validateUUID(id)) {
      return errorResponse(res, "ID de borrador inválido", 400);
    }

    const draft = await Drafts.findOne({
      where: { id, user_id: userId }
    });

    if (!draft) {
      return errorResponse(res, "Borrador no encontrado", 404);
    }

    // Validar que el borrador esté completo
    const requiredFields = ['title', 'author', 'description', 'price', 'book_condition_id', 'transaction_type_id', 'location_book_id'];
    const missingFields = requiredFields.filter(field => 
      !draft[field] || draft[field] === '' || draft[field] === null
    );

    if (missingFields.length > 0) {
      return errorResponse(res, `Faltan campos requeridos: ${missingFields.join(', ')}`, 400);
    }

    // Crear el libro publicado
    const publishedBookData = {
      title: draft.title,
      author: draft.author,
      description: draft.description,
      price: draft.price,
      isbn: draft.isbn,
      publisher: draft.publisher,
      published_year: draft.published_year,
      image_url: draft.image_url,
      images: draft.images,
      user_id: draft.user_id,
      condition_id: draft.book_condition_id,
      transaction_type_id: draft.transaction_type_id,
      location_id: draft.location_book_id,
      is_available: true,
      status: 'active',
    };

    const publishedBook = await PublishedBooks.create(publishedBookData);

    // Eliminar el borrador después de publicar
    await draft.destroy();

    return successResponse(res, "Libro publicado exitosamente", publishedBook);
  } catch (error) {
    console.error("Error publishing from draft:", error);
    return errorResponse(res, "Error interno del servidor", 500);
  }
};
