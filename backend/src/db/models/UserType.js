import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const UserType = sequelize.define(
  "UserType",
  {
    user_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "UserType",
    timestamps: false,
  }
);

export default UserType;
