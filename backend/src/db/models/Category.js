import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDB.js";

const Category = sequelize.define(
  "Category",
  {
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "Category",
    timestamps: false,
  }
);

export default Category;
