export default ({
  Book,
  User,
  UserType,
  Category,
  UserBook,
  State,
  Sell,
  Exchange,
  Match,
}) => {
  //  UserType 1:N User
  UserType.hasMany(User, { foreignKey: "user_type_id" });
  User.belongsTo(UserType, { foreignKey: "user_type_id" });

  // Category 1:N Book
  Category.hasMany(Book, { foreignKey: "category_id" });
  Book.belongsTo(Category, { foreignKey: "category_id" });

  //  User 1:N UserBook
  User.hasMany(UserBook, { foreignKey: "user_id" });
  UserBook.belongsTo(User, { foreignKey: "user_id" });

  //  Book 1:N UserBook
  Book.hasMany(UserBook, { foreignKey: "book_id" });
  UserBook.belongsTo(Book, { foreignKey: "book_id" });

  //  UserBook 1:1 Sell
  UserBook.hasOne(Sell, { foreignKey: "user_book_id" });
  Sell.belongsTo(UserBook, { foreignKey: "user_book_id" });

  // User (seller/buyer) 1:N Sell
  User.hasMany(Sell, { as: "Sales", foreignKey: "user_id_seller" });
  User.hasMany(Sell, { as: "Purchases", foreignKey: "user_id_buyer" });
  Sell.belongsTo(User, { as: "Seller", foreignKey: "user_id_seller" });
  Sell.belongsTo(User, { as: "Buyer", foreignKey: "user_id_buyer" });

  // State 1:N Sell
  State.hasMany(Sell, { foreignKey: "state_id" });
  Sell.belongsTo(State, { foreignKey: "state_id" });

  //  Exchange 1:1 con cada UserBook
  UserBook.hasOne(Exchange, { as: "AsBook1", foreignKey: "user_book_id_1" });
  UserBook.hasOne(Exchange, { as: "AsBook2", foreignKey: "user_book_id_2" });
  Exchange.belongsTo(UserBook, { as: "Book1", foreignKey: "user_book_id_1" });
  Exchange.belongsTo(UserBook, { as: "Book2", foreignKey: "user_book_id_2" });

  //  State 1:N Exchange
  State.hasMany(Exchange, { foreignKey: "state_id" });
  Exchange.belongsTo(State, { foreignKey: "state_id" });

  //  Match N:N con User (doble belongsTo por compatibilidad)
  User.hasMany(Match, { as: "MatchesInitiated", foreignKey: "user_id_1" });
  User.hasMany(Match, { as: "MatchesReceived", foreignKey: "user_id_2" });
  Match.belongsTo(User, { as: "User1", foreignKey: "user_id_1" });
  Match.belongsTo(User, { as: "User2", foreignKey: "user_id_2" });
};
