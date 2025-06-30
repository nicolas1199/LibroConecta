import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDB.js";

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(100),
    },
    user_type_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "Users",
    timestamps: false,
  }
);

export default User;
