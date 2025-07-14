import { sequelize } from "../config/configDb.js"
import setupRelations from "./relations.js"

import Book from "./models/Book.js"
import User from "./models/User.js"
import UserType from "./models/UserType.js"
import Category from "./models/Category.js"
import UserBook from "./models/UserBook.js"
import UserLibrary from "./models/UserLibrary.js"
import State from "./models/State.js"
import Sell from "./models/Sell.js"
import Exchange from "./models/Exchange.js"
import Match from "./models/Match.js"
import BookCategory from "./models/BookCategory.js"
import TransactionType from "./models/TransactionType.js"
import BookCondition from "./models/BookCondition.js"
import LocationBook from "./models/LocationBook.js"
import PublishedBooks from "./models/PublishedBooks.js"
import PublishedBookImage from "./models/PublishedBookImage.js"
import Message from "./models/Message.js"
import Rating from "./models/Rating.js"
import UserPublishedBookInteraction from "./models/UserPublishedBookInteraction.js"

// Configurar relaciones una sola vez
setupRelations({
  Book,
  User,
  UserType,
  Category,
  UserBook,
  UserLibrary,
  State,
  Sell,
  Exchange,
  Match,
  BookCategory,
  TransactionType,
  BookCondition,
  LocationBook,
  PublishedBooks,
  PublishedBookImage,
  Message,
  Rating,
  UserPublishedBookInteraction,
})

// Sincronizar modelos con la base de datos para crear tablas automáticamente
sequelize
  .sync()
  .then(() => {})
  .catch((error) => {
    console.error("Error al sincronizar las tablas:", error)
  })

// Exportar todos los modelos + conexión
export {
  Book,
  User,
  UserType,
  Category,
  UserBook,
  UserLibrary,
  State,
  Sell,
  Exchange,
  Match,
  BookCategory,
  TransactionType,
  BookCondition,
  LocationBook,
  PublishedBooks,
  PublishedBookImage,
  Message,
  Rating,
  UserPublishedBookInteraction,
  sequelize,
}
