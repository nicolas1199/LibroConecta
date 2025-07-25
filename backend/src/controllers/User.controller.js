import User from "../db/models/User.js";
import { createResponse } from "../utils/responses.util.js";

// Obtener perfil público de un usuario por ID
export const getUserPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "username",
        "location",
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      message: "Perfil público obtenido exitosamente",
      data: {
        user_id: user.get("user_id"),
        first_name: user.get("first_name"),
        last_name: user.get("last_name"),
        username: user.get("username"),
        location: user.get("location"),
      },
    });
  } catch (error) {
    console.error("Error al obtener perfil público:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
