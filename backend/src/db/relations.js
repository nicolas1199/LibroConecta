export default ({
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
}) => {
  //  UserType 1:N User
  UserType.hasMany(User, { foreignKey: "user_type_id" })
  User.belongsTo(UserType, { foreignKey: "user_type_id" })

  // Book N:M Category
  Book.belongsToMany(Category, {
    through: BookCategory,
    foreignKey: "book_id",
    otherKey: "category_id",
    as: "Categories",
  })
  Category.belongsToMany(Book, {
    through: BookCategory,
    foreignKey: "category_id",
    otherKey: "book_id",
    as: "Books",
  })

  //  User 1:N UserBook
  User.hasMany(UserBook, { foreignKey: "user_id" })
  UserBook.belongsTo(User, { foreignKey: "user_id" })

  //  Book 1:N UserBook
  Book.hasMany(UserBook, { foreignKey: "book_id" })
  UserBook.belongsTo(Book, { foreignKey: "book_id" })

  //  User 1:N UserLibrary (biblioteca personal)
  User.hasMany(UserLibrary, { foreignKey: "user_id" })
  UserLibrary.belongsTo(User, { foreignKey: "user_id" })

  //  Book 1:N UserLibrary (biblioteca personal)
  Book.hasMany(UserLibrary, { foreignKey: "book_id" })
  UserLibrary.belongsTo(Book, { foreignKey: "book_id" })

  //  UserBook 1:1 Sell
  UserBook.hasOne(Sell, { foreignKey: "user_book_id" })
  Sell.belongsTo(UserBook, { foreignKey: "user_book_id" })

  // User (seller/buyer) 1:N Sell
  User.hasMany(Sell, { as: "Sales", foreignKey: "user_id_seller" })
  User.hasMany(Sell, { as: "Purchases", foreignKey: "user_id_buyer" })
  Sell.belongsTo(User, { as: "Seller", foreignKey: "user_id_seller" })
  Sell.belongsTo(User, { as: "Buyer", foreignKey: "user_id_buyer" })

  // State 1:N Sell
  State.hasMany(Sell, { foreignKey: "state_id" })
  Sell.belongsTo(State, { foreignKey: "state_id" })

  //  Exchange 1:1 con cada UserBook
  UserBook.hasOne(Exchange, { as: "AsBook1", foreignKey: "user_book_id_1" })
  UserBook.hasOne(Exchange, { as: "AsBook2", foreignKey: "user_book_id_2" })
  Exchange.belongsTo(UserBook, { as: "Book1", foreignKey: "user_book_id_1" })
  Exchange.belongsTo(UserBook, { as: "Book2", foreignKey: "user_book_id_2" })

  //  State 1:N Exchange
  State.hasMany(Exchange, { foreignKey: "state_id" })
  Exchange.belongsTo(State, { foreignKey: "state_id" })

  //  Match N:N con User (doble belongsTo por compatibilidad)
  User.hasMany(Match, { as: "MatchesInitiated", foreignKey: "user_id_1" })
  User.hasMany(Match, { as: "MatchesReceived", foreignKey: "user_id_2" })
  Match.belongsTo(User, { as: "User1", foreignKey: "user_id_1" })
  Match.belongsTo(User, { as: "User2", foreignKey: "user_id_2" })

  // Agregar las nuevas relaciones al final de la función, antes del cierre
  // TransactionType 1:N PublishedBooks
  TransactionType.hasMany(PublishedBooks, { foreignKey: "transaction_type_id" })
  PublishedBooks.belongsTo(TransactionType, { foreignKey: "transaction_type_id" })

  // BookCondition 1:N PublishedBooks
  BookCondition.hasMany(PublishedBooks, { foreignKey: "condition_id" })
  PublishedBooks.belongsTo(BookCondition, { foreignKey: "condition_id" })

  // LocationBook 1:N PublishedBooks
  LocationBook.hasMany(PublishedBooks, { foreignKey: "location_id" })
  PublishedBooks.belongsTo(LocationBook, { foreignKey: "location_id" })

  // User 1:N PublishedBooks
  User.hasMany(PublishedBooks, { foreignKey: "user_id" })
  PublishedBooks.belongsTo(User, { foreignKey: "user_id" })

  // Book 1:N PublishedBooks
  Book.hasMany(PublishedBooks, { foreignKey: "book_id" })
  PublishedBooks.belongsTo(Book, { foreignKey: "book_id" })

  // PublishedBooks 1:N PublishedBookImage
  PublishedBooks.hasMany(PublishedBookImage, { foreignKey: "published_book_id" })
  PublishedBookImage.belongsTo(PublishedBooks, { foreignKey: "published_book_id" })
}
