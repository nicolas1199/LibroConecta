import {
  Drafts,
  User,
  BookCondition,
  TransactionType,
  LocationBook,
  PublishedBooks,
} from "../db/modelIndex.js";
import { Op } from "sequelize";
import { success, error } from "../utils/responses.util.js";
import { isValidUUID } from "../utils/uuid.util.js";

// POST /api/drafts - Crear o actualizar un borrador
export const saveDraft = async (req, res) => {
  try {
    const userId = req.user.user_id;
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

        return success(res, existingDraft, "Borrador actualizado exitosamente");
      }
    }

    // Crear nuevo borrador
    const newDraft = await Drafts.create({
      ...draftData,
      user_id: userId,
      completion_percentage: completionPercentage,
      last_edited: new Date(),
    });

    return success(res, newDraft, "Borrador guardado exitosamente");
  } catch (err) {
    console.error("Error saving draft:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// GET /api/drafts - Obtener todos los borradores del usuario
export const getUserDrafts = async (req, res) => {
  try {
    const userId = req.user.user_id;
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

    return success(res, drafts, "Borradores obtenidos exitosamente");
  } catch (err) {
    console.error("Error getting drafts:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// GET /api/drafts/:id - Obtener un borrador específico
export const getDraftById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Validar UUID
    if (!isValidUUID(id)) {
      return error(res, "ID de borrador inválido", 400);
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
      return error(res, "Borrador no encontrado", 404);
    }

    return success(res, draft, "Borrador obtenido exitosamente");
  } catch (err) {
    console.error("Error getting draft:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// PUT /api/drafts/:id - Actualizar un borrador
export const updateDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const updateData = req.body;

    // Validar UUID
    if (!isValidUUID(id)) {
      return error(res, "ID de borrador inválido", 400);
    }

    const draft = await Drafts.findOne({
      where: { id, user_id: userId }
    });

    if (!draft) {
      return error(res, "Borrador no encontrado", 404);
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

    return success(res, draft, "Borrador actualizado exitosamente");
  } catch (err) {
    console.error("Error updating draft:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// DELETE /api/drafts/:id - Eliminar un borrador
export const deleteDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Validar UUID
    if (!isValidUUID(id)) {
      return error(res, "ID de borrador inválido", 400);
    }

    const draft = await Drafts.findOne({
      where: { id, user_id: userId }
    });

    if (!draft) {
      return error(res, "Borrador no encontrado", 404);
    }

    await draft.destroy();

    return success(res, null, "Borrador eliminado exitosamente");
  } catch (err) {
    console.error("Error deleting draft:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// POST /api/drafts/:id/publish - Publicar un borrador
export const publishFromDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Validar UUID
    if (!isValidUUID(id)) {
      return error(res, "ID de borrador inválido", 400);
    }

    const draft = await Drafts.findOne({
      where: { id, user_id: userId }
    });

    if (!draft) {
      return error(res, "Borrador no encontrado", 404);
    }

    // Validar que el borrador esté completo
    const requiredFields = ['title', 'author', 'description', 'price', 'book_condition_id', 'transaction_type_id', 'location_book_id'];
    const missingFields = requiredFields.filter(field => 
      !draft[field] || draft[field] === '' || draft[field] === null
    );

    if (missingFields.length > 0) {
      return error(res, `Faltan campos requeridos: ${missingFields.join(', ')}`, 400);
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

    return success(res, publishedBook, "Libro publicado exitosamente");
  } catch (err) {
    console.error("Error publishing from draft:", err);
    return error(res, "Error interno del servidor", 500);
  }
};
