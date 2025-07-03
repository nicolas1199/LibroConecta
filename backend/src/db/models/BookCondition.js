import { DataTypes } from "sequelize"
import { sequelize } from "../../config/configDb.js"

const BookCondition = sequelize.define(
  "BookCondition",
  {
    condition_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    condition: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "BookCondition",
    timestamps: false,
  },
)

export default BookCondition
