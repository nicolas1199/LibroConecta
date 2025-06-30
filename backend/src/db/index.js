import { sequelize } from "../../config/configDB.js";
import setupRelations from "./relations.js";

import Book from "./Book.js";
import User from "./User.js";
import UserType from "./UserType.js";
import Category from "./Category.js";
import UserBook from "./UserBook.js";
import State from "./State.js";
import Sell from "./Sell.js";
import Exchange from "./Exchange.js";
import Match from "./Match.js";

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
  sequelize,
};
