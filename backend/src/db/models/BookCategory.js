import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const BookCategory = sequelize.define(
  "BookCategory",
  {
    book_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: "Books",
        key: "book_id",
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: "Category",
        key: "category_id",
      },
    },
  },
  {
    tableName: "BookCategories",
    timestamps: false,
  }
);

export default BookCategory;
