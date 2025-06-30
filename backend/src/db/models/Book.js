import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Book = sequelize.define(
    "Book",
    {
      book_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      author: {
        type: DataTypes.STRING(150),
      },
      date_of_pub: {
        type: DataTypes.DATE,
      },
      location: {
        type: DataTypes.STRING(100),
      },
      category_id: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "Books",
      timestamps: false,
    }
  );

  return Book;
};
