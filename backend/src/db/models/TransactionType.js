import { DataTypes } from "sequelize"
import { sequelize } from "../../config/configDb.js"

const TransactionType = sequelize.define(
  "TransactionType",
  {
    transaction_type_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    description: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "TransactionType",
    timestamps: false,
  },
)

export default TransactionType
