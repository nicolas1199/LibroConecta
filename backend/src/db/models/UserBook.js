const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const UserBook = sequelize.define(
    "UserBook",
    {
      user_book_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
      },
      book_id: {
        type: DataTypes.INTEGER,
      },
      is_for_sale: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "UserBooks",
      timestamps: false,
    }
  );

  return UserBook;
};
