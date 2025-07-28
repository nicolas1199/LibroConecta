import { User, LocationBook } from "../db/modelIndex.js";
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
        "email",
        "biography",
        "profile_image_base64",
      ],
      include: [
        {
          model: LocationBook,
          as: "userLocation",
          attributes: ["region", "comuna"],
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Formatear la ubicación
    const location = user.userLocation 
      ? { region: user.userLocation.region, comuna: user.userLocation.comuna }
      : null;

    return res.status(200).json({
      message: "Perfil público obtenido exitosamente",
      data: {
        user_id: user.get("user_id"),
        first_name: user.get("first_name"),
        last_name: user.get("last_name"),
        username: user.get("username"),
        email: user.get("email"),
        location: location,
        biography: user.get("biography"),
        profile_image_base64: user.get("profile_image_base64"),
      },
    });
  } catch (error) {
    console.error("Error al obtener perfil público:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
