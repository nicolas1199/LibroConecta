const { sequelize } = require("../../config/configDB");
import setupRelations from "./relations.js";

const Book = require("./Book")(sequelize);
const User = require("./User")(sequelize);
const UserType = require("./UserType")(sequelize);
const Category = require("./Category")(sequelize);
const UserBook = require("./UserBook")(sequelize);
const State = require("./State")(sequelize);
const Sell = require("./Sell")(sequelize);
const Exchange = require("./Exchange")(sequelize);
const Match = require("./Match")(sequelize);

// Importar y ejecutar relaciones
require("./relations")({
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

// Exportar todos listos
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
