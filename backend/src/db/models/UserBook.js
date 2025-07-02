import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDB.js";

const UserBook = sequelize.define(
  "UserBook",
  {
    user_book_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.UUID,
    },
    book_id: {
      type: DataTypes.INTEGER,
    },
    is_for_sale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Si el libro está disponible para venta",
    },
    liked: {
      type: DataTypes.BOOLEAN,
      defaultValue: null, // null: no ha hecho swipe; true: like; false: dislike
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "UserBooks",
    timestamps: false,
  }
);

export default UserBook;
