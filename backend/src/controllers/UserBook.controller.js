import { UserBook } from "../db/modelIndex.js";

// Registrar like o dislike
export async function swipeBook(req, res) {
  try {
    // Extraemos los datos enviados desde el frontend
    const { book_id, liked } = req.body;

    // Obtener el ID del usuario autenticado
    const user_id = req.user.user_id;

    // Buscamos si ya existe una entrada en UserBooks para este usuario y libro
    const [userBook, created] = await UserBook.findOrCreate({
      where: { user_id, book_id },
      defaults: { liked },
    });

    // Si ya existía, actualizamos el campo liked
    if (!created) {
      await userBook.update({ liked });
    }

    // Respondemos que todo fue bien
    res.status(200).json({ message: "Swipe registrado" });
  } catch (error) {
    console.error("Error en swipeBook:", error);
    res.status(500).json({ error: "Error al registrar swipe" });
  }
}

// Resetear todos los swipes de un usuario
export async function resetUserSwipes(req, res) {
  try {
    const user_id = req.user.user_id;

    await UserBook.destroy({
      where: { user_id },
    });
    res.json({ message: "Swipes del usuario eliminados" });
  } catch (error) {
    console.error("Error en resetUserSwipes:", error);
    res.status(500).json({ error: "Error al resetear swipes" });
  }
}

// Crear manualmente un UserBook (mantenemos para flexibilidad)
export async function createUserBook(req, res) {
  try {
    const { user_id, book_id, liked, is_for_sale } = req.body;
    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBook = await UserBook.create({
      user_id,
      book_id,
      liked,
      is_for_sale,
    });

    res.status(201).json(userBook);
  } catch (error) {
    console.error("Error en createUserBook:", error);
    res.status(500).json({ error: "Error al crear UserBook" });
  }
}

// Obtener todos los UserBooks (solo para admin)
export async function getAllUserBooks(req, res) {
  try {
    const currentUserId = req.user?.user_id;
    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBooks = await UserBook.findAll();
    res.json(userBooks);
  } catch (error) {
    console.error("Error en getAllUserBooks:", error);
    res.status(500).json({ error: "Error al obtener UserBooks" });
  }
}

// Obtener un UserBook por ID
export async function getUserBookById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBook = await UserBook.findByPk(id);
    if (!userBook) {
      return res.status(404).json({ error: "UserBook no encontrado" });
    }

    res.json(userBook);
  } catch (error) {
    console.error("Error en getUserBookById:", error);
    res.status(500).json({ error: "Error al obtener UserBook" });
  }
}

// Actualizar un UserBook
export async function updateUserBook(req, res) {
  try {
    const { id } = req.params;
    const { liked, is_for_sale } = req.body;
    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBook = await UserBook.findByPk(id);
    if (!userBook) {
      return res.status(404).json({ error: "UserBook no encontrado" });
    }

    await userBook.update({ liked, is_for_sale });
    res.json(userBook);
  } catch (error) {
    console.error("Error en updateUserBook:", error);
    res.status(500).json({ error: "Error al actualizar UserBook" });
  }
}

// Eliminar un UserBook
export async function deleteUserBook(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBook = await UserBook.findByPk(id);
    if (!userBook) {
      return res.status(404).json({ error: "UserBook no encontrado" });
    }

    await userBook.destroy();
    res.json({ message: "UserBook eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteUserBook:", error);
    res.status(500).json({ error: "Error al eliminar UserBook" });
  }
}
