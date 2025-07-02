import { Category, Book } from "../db/modelIndex.js";

// Obtener todas las categorías
export async function getAllCategories(req, res) {
  try {
    const categories = await Category.findAll({
      order: [["title", "ASC"]],
    });
    res.json(categories);
  } catch (error) {
    console.error("Error en getAllCategories:", error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
}

// Obtener categoría por ID
export async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error en getCategoryById:", error);
    res.status(500).json({ error: "Error al obtener categoría" });
  }
}

// Crear nueva categoría
export async function createCategory(req, res) {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    const newCategory = await Category.create({
      title,
      description,
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error en createCategory:", error);
    res.status(500).json({ error: "Error al crear categoría" });
  }
}

// Actualizar categoría
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    await category.update({
      title,
      description,
    });

    res.json(category);
  } catch (error) {
    console.error("Error en updateCategory:", error);
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
}

// Eliminar categoría
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    await category.destroy();
    res.json({ message: "Categoría eliminada correctamente" });
  } catch (error) {
    console.error("Error en deleteCategory:", error);
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
}

// Obtener libros de una categoría específica
export async function getBooksByCategory(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const offset = (page - 1) * limit;

    // Buscar libros que tengan esta categoría
    const { count, rows: books } = await Book.findAndCountAll({
      include: [
        {
          model: Category,
          as: "Categories",
          where: { category_id: parseInt(id) },
          through: { attributes: [] },
        },
      ],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
    });

    res.json({
      category: category.dataValues,
      books,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalBooks: count,
        hasNextPage: page * limit < count,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error en getBooksByCategory:", error);
    res.status(500).json({ error: "Error al obtener libros de la categoría" });
  }
}

// Obtener estadísticas de una categoría
export async function getCategoryStats(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const bookCount = await Book.count({
      include: [
        {
          model: Category,
          as: "Categories",
          where: { category_id: parseInt(id) },
          through: { attributes: [] },
        },
      ],
    });

    res.json({
      category: category.dataValues,
      bookCount,
    });
  } catch (error) {
    console.error("Error en getCategoryStats:", error);
    res
      .status(500)
      .json({ error: "Error al obtener estadísticas de la categoría" });
  }
}
