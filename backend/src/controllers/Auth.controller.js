import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import { User, LocationBook, UserType } from "../db/modelIndex.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.util.js";
import { createResponse } from "../utils/responses.util.js";
import { convertImageToBase64 } from "../middlewares/profileImage.middleware.js";

export const register = async (req, res) => {
  const { fullname, email, username, password } = req.body;

  // Validar datos obligatorios
  if (!fullname || !email || !username || !password) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  // Desestructurar fullname en first_name y last_name de manera más robusta
  const nameParts = fullname.trim().split(" ");
  const first_name = nameParts[0];
  const last_name =
    nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Usuario";

  if (!first_name || !last_name) {
    return res
      .status(400)
      .json({ message: "El nombre completo debe incluir nombre y apellido" });
  }
  try {
    // Asegurar que existan los tipos de usuario necesarios o crear uno por defecto
    let regularUserType = await UserType.findOne({
      where: { user_type_id: 2 },
    });

    if (!regularUserType) {
      // Intentar crear el tipo de usuario regular si no existe
      try {
        regularUserType = await UserType.create({
          user_type_id: 2,
          type_name: "regular",
          description: "Usuario regular del sistema",
        });
      } catch (error) {
        // Si falla, usar user_type_id = 1 o null
        console.warn(
          "No se pudo crear el tipo de usuario regular, usando valor por defecto"
        );
      }
    }

    // Validar email y username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/; // Al menos 3 caracteres, solo alfanuméricos y guiones bajos
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email inválido" });
    }

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Nombre de usuario inválido (3-30 caracteres, alfanuméricos y guiones bajos)",
      });
    }

    // Verificar si email o username ya existen
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Email o nombre de usuario ya registrados" });
    }
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    // Crear usuario
    const newUser = await User.create({
      first_name,
      last_name,
      user_type_id: regularUserType ? 2 : null, // Usar el tipo encontrado o null
      email,
      username,
      password: hashedPassword,
    });

    // Generar tokens para el usuario recién registrado
    const payload = {
      user_id: newUser.dataValues.user_id,
      username: newUser.dataValues.username,
      user_type_id: newUser.dataValues.user_type_id,
    };

    const { accessToken, refreshToken } = generateTokens(payload);

    // Guardar el refresh token en la base de datos
    await newUser.update({ refresh_token: refreshToken });

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      accessToken,
      refreshToken,
      user: {
        user_id: newUser.dataValues.user_id,
        username: newUser.dataValues.username,
        email: newUser.dataValues.email,
        first_name: newUser.dataValues.first_name,
        last_name: newUser.dataValues.last_name,
        user_type_id: newUser.dataValues.user_type_id,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  try {
    // Buscar por email
    const user = await User.findOne({
      where: {
        email: {
          [Op.iLike]: email,
        },
      },
      include: [
        {
          model: LocationBook,
          as: "userLocation",
          attributes: ["location_id", "comuna", "region"],
        },
      ],
    });
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    // Comparar contraseña
    const userPassword = user.get("password");
    const validPassword = await bcrypt.compare(password, String(userPassword));
    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    // Generar tokens
    const payload = {
      user_id: user.get("user_id"),
      username: user.get("username"),
      user_type_id: user.get("user_type_id"),
    };

    const { accessToken, refreshToken } = generateTokens(payload);

    // Guardar el refresh token en la base de datos
    await user.update({ refresh_token: refreshToken });

    return res.json({
      message: "Login exitoso",
      accessToken,
      refreshToken,
      user: {
        user_id: user.get("user_id"),
        username: user.get("username"),
        email: user.get("email"),
        first_name: user.get("first_name"),
        last_name: user.get("last_name"),
        location_id: user.get("location_id"),
        location: user.userLocation,
        user_type_id: user.get("user_type_id"),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: err.message });
  }
};

// Obtener perfil del usuario autenticado
export const getUserProfile = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await User.findByPk(user_id, {
      include: [
        {
          model: LocationBook,
          as: "userLocation",
          attributes: ["location_id", "comuna", "region"],
        },
      ],
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "email",
        "username",
        "location_id",
        "user_type_id",
        "profile_image_base64",
        "biography",
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      message: "Perfil obtenido exitosamente",
      data: {
        user_id: user.get("user_id"),
        first_name: user.get("first_name"),
        last_name: user.get("last_name"),
        email: user.get("email"),
        username: user.get("username"),
        location_id: user.get("location_id"),
        location: user.userLocation,
        user_type_id: user.get("user_type_id"),
        profile_image_base64: user.get("profile_image_base64"),
        biography: user.get("biography"),
      },
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar perfil del usuario autenticado
export const updateUserProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { first_name, last_name, email, username, location_id, biography } = req.body;

    // Validar datos obligatorios
    if (!first_name || !last_name || !email || !username) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    // Verificar si el usuario existe
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email !== user.get("email")) {
      const existingUser = await User.findOne({
        where: {
          email: email,
          user_id: { [Op.ne]: user_id },
        },
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "El email ya está en uso por otro usuario" });
      }
    }

    // Verificar si el username ya está en uso por otro usuario
    if (username !== user.get("username")) {
      const existingUsername = await User.findOne({
        where: {
          username: username,
          user_id: { [Op.ne]: user_id },
        },
      });

      if (existingUsername) {
        return res.status(400).json({
          message: "El nombre de usuario ya está en uso por otro usuario",
        });
      }
    }

    // Actualizar el usuario
    await user.update({
      first_name,
      last_name,
      email,
      username,
      location_id: location_id || null,
      biography: biography || null,
    });

    // Obtener el usuario actualizado con la información de ubicación
    const updatedUser = await User.findByPk(user_id, {
      include: [
        {
          model: LocationBook,
          as: "userLocation",
          attributes: ["location_id", "comuna", "region"],
        },
      ],
    });

    // Respuesta sin contraseña
    const userResponse = {
      user_id: updatedUser.get("user_id"),
      first_name: updatedUser.get("first_name"),
      last_name: updatedUser.get("last_name"),
      email: updatedUser.get("email"),
      username: updatedUser.get("username"),
      location_id: updatedUser.get("location_id"),
      location: updatedUser.userLocation,
      user_type_id: updatedUser.get("user_type_id"),
      profile_image_base64: updatedUser.get("profile_image_base64"),
      biography: updatedUser.get("biography"),
    };

    return res.status(200).json({
      message: "Perfil actualizado exitosamente",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Actualizar imagen de perfil del usuario
export const updateProfileImage = async (req, res) => {
  try {
    const { user_id } = req.user;

    // Verificar si se subió una imagen
    if (!req.file) {
      return res.status(400).json(
        createResponse(400, "No se ha subido ninguna imagen", null, null)
      );
    }

    console.log(`📸 Procesando imagen de perfil para usuario ${user_id}: ${req.file.originalname} (${req.file.size} bytes)`);

    // Validar tamaño de la imagen (igual que PublishedBooks)
    if (req.file.size > 8 * 1024 * 1024) { // 8MB
      return res.status(400).json(
        createResponse(400, "La imagen es demasiado grande. Máximo 8MB.", null, null)
      );
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json(
        createResponse(404, "Usuario no encontrado", null, null)
      );
    }

    // Convertir imagen a base64
    const base64Image = convertImageToBase64(req.file.buffer, req.file.mimetype);
    console.log(`✅ Imagen convertida a base64 (${base64Image.length} caracteres)`);

    // Actualizar la imagen en base64
    await user.update({
      profile_image_base64: base64Image
    });

    console.log(`💾 Imagen de perfil guardada en base de datos`);

    // Obtener el usuario actualizado
    const updatedUser = await User.findByPk(user_id, {
      include: [
        {
          model: LocationBook,
          as: "userLocation",
          attributes: ["location_id", "comuna", "region"],
        },
      ],
    });

    const userResponse = {
      user_id: updatedUser.get("user_id"),
      first_name: updatedUser.get("first_name"),
      last_name: updatedUser.get("last_name"),
      email: updatedUser.get("email"),
      username: updatedUser.get("username"),
      location_id: updatedUser.get("location_id"),
      location: updatedUser.userLocation,
      user_type_id: updatedUser.get("user_type_id"),
      profile_image_base64: updatedUser.get("profile_image_base64"),
      biography: updatedUser.get("biography"),
    };

    console.log(`🎉 Imagen de perfil actualizada exitosamente para usuario ${user_id}`);

    return res.status(200).json(
      createResponse(200, "Imagen de perfil actualizada exitosamente", userResponse, null)
    );
  } catch (error) {
    console.error("Error al actualizar imagen de perfil:", error.message);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

// Refresh del access token usando refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token requerido" });
    }

    // Verificar el refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res
        .status(403)
        .json({ message: "Refresh token inválido o expirado" });
    }

    // Verificar que el payload tenga la estructura esperada
    if (typeof payload === "string" || !payload.user_id) {
      return res.status(403).json({ message: "Refresh token malformado" });
    }

    // Buscar el usuario y verificar que el refresh token coincida
    const user = await User.findByPk(payload.user_id);
    if (!user || user.get("refresh_token") !== refreshToken) {
      return res.status(403).json({ message: "Refresh token inválido" });
    }

    // Generar nuevos tokens
    const newPayload = {
      user_id: user.get("user_id"),
      username: user.get("username"),
      user_type_id: user.get("user_type_id"),
    };

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(newPayload);

    // Actualizar el refresh token en la base de datos
    await user.update({ refresh_token: newRefreshToken });

    return res.json({
      message: "Tokens renovados exitosamente",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Error al renovar tokens:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

// Logout - Invalidar refresh token
export const logout = async (req, res) => {
  try {
    const { user_id } = req.user;

    // Encontrar el usuario y limpiar el refresh token
    const user = await User.findByPk(user_id);
    if (user) {
      await user.update({ refresh_token: null });
    }

    return res.json({ message: "Logout exitoso" });
  } catch (error) {
    console.error("Error en logout:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};
