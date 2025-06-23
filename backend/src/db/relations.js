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
  //  User -> UserType
  User.belongsTo(UserType, { foreignKey: "user_type_id" });

  // Book -> Category
  Book.belongsTo(Category, { foreignKey: "category_id" });

  // UserBook -> User & Book
  UserBook.belongsTo(User, { foreignKey: "user_id" });
  UserBook.belongsTo(Book, { foreignKey: "book_id" });

  // Sell -> User (Seller & Buyer), UserBook, State
  Sell.belongsTo(User, { as: "Seller", foreignKey: "user_id_seller" });
  Sell.belongsTo(User, { as: "Buyer", foreignKey: "user_id_buyer" });
  Sell.belongsTo(UserBook, { foreignKey: "user_book_id" });
  Sell.belongsTo(State, { foreignKey: "state_id" });

  // Exchange -> UserBook (1 & 2), State
  Exchange.belongsTo(UserBook, { as: "Book1", foreignKey: "user_book_id_1" });
  Exchange.belongsTo(UserBook, { as: "Book2", foreignKey: "user_book_id_2" });
  Exchange.belongsTo(State, { foreignKey: "state_id" });

  // Match -> User (1 & 2)
  Match.belongsTo(User, { as: "User1", foreignKey: "user_id_1" });
  Match.belongsTo(User, { as: "User2", foreignKey: "user_id_2" });
};
