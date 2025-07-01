import User from "../db/models/User.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT } from "../config/configEnv.js";

export const register = async (req, res) => {
  const { fullname, location, email, username, password } = req.body;
  // Desestructurar fullname en first_name y last_name
  console.log(req.body);
  const [first_name, last_name] = fullname.split(" ");
  console.log(req.body);
  if (!first_name || !last_name || !email || !username || !password) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }
  try {
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
      user_type_id: 2,
      email,
      username,
      password: hashedPassword,
    });
    return res.status(201).json({
      user_id: newUser.get("user_id"),
      username: newUser.get("username"),
      email: newUser.get("email"),
      first_name: newUser.get("first_name"),
      last_name: newUser.get("last_name"),
      user_type_id: newUser.get("user_type_id"),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: err.message });
  }
};

export const login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  try {
    // Buscar por email o username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { username: identifier }],
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
