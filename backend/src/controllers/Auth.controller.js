import User from "../db/models/User.js";
import UserType from "../db/models/UserType.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT } from "../config/configEnv.js";

export const register = async (req, res) => {
  const { fullname, location, email, username, password } = req.body;

  // Validar datos obligatorios
  if (!fullname || !email || !username || !password) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  // Desestructurar fullname en first_name y last_name de manera más robusta
  const nameParts = fullname.trim().split(" ");
  const first_name = nameParts[0];
  const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  if (!first_name || !last_name) {
    return res
      .status(400)
      .json({ message: "El nombre completo debe incluir nombre y apellido" });
  }
  try {
    // Asegurar que existan los tipos de usuario necesarios
    const regularUserType = await UserType.findOne({
      where: { user_type_id: 2 },
    });
    if (!regularUserType) {
      return res.status(500).json({
        message: "Tipo de usuario regular no encontrado en la base de datos",
      });
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
      location,
      user_type_id: 2, // Asignar tipo de usuario regular
      email,
      username,
      password: hashedPassword,
    });

    return res.status(201).json({
      username: newUser.dataValues.username,
      email: newUser.dataValues.email,
      first_name: newUser.dataValues.first_name,
      last_name: newUser.dataValues.last_name,
      user_type_id: newUser.dataValues.user_type_id,
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
    // Generar JWT
    const payload = {
      user_id: user.get("user_id"),
      username: user.get("username"),
      user_type_id: user.get("user_type_id"),
    };
    const token = jwt.sign(payload, JWT.ACCESS_TOKEN_SECRET, {
      expiresIn: Number(JWT.ACCESS_TOKEN_EXPIRES_IN) || 15 * 60,
    });
    return res.json({
      token,
      user: {
        user_id: user.get("user_id"),
        username: user.get("username"),
        email: user.get("email"),
        first_name: user.get("first_name"),
        last_name: user.get("last_name"),
        user_type_id: user.get("user_type_id"),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: err.message });
  }
};
