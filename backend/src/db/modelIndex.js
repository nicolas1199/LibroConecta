import { sequelize } from "../config/configDB.js";
import setupRelations from "./relations.js";

import Book from "./models/Book.js";
import User from "./models/User.js";
import UserType from "./models/UserType.js";
import Category from "./models/Category.js";
import UserBook from "./models/UserBook.js";
import State from "./models/State.js";
import Sell from "./models/Sell.js";
import Exchange from "./models/Exchange.js";
import Match from "./models/Match.js";
import BookCategory from "./models/BookCategory.js";

// Configurar relaciones una sola vez
setupRelations({
  Book,
  User,
  UserType,
  Category,
  UserBook,
  State,
  Sell,
  Exchange,
  Match,
  BookCategory,
});

// Sincronizar modelos con la base de datos para crear tablas automáticamente
sequelize
  .sync()
  .then(() => {})
  .catch((error) => {
    console.error("Error al sincronizar las tablas:", error);
  });

// Exportar todos los modelos + conexión
export {
  Book,
  User,
  UserType,
  Category,
  UserBook,
  State,
  Sell,
  Exchange,
  Match,
  BookCategory,
  sequelize,
};
