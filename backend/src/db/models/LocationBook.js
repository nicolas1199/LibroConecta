import { DataTypes } from "sequelize"
import { sequelize } from "../../config/configDb.js"

const LocationBook = sequelize.define(
  "LocationBook",
  {
    location_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    comuna: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "LocationBook",
    timestamps: false,
  },
)

export default LocationBook
