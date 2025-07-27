import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const Match = sequelize.define(
  "Match",
  {
    match_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id_1: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Primer usuario del match",
    },
    user_id_2: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Segundo usuario del match",
    },
    date_match: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Fecha en que se creó el match",
    },
    match_type: {
      type: DataTypes.ENUM('manual', 'automatic'),
      defaultValue: 'manual',
      comment: "Tipo de match: manual (creado por usuario) o automatic (por likes mutuos)",
    },
    triggered_by_books: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Información de los libros que generaron el match automático",
    },
  },
  {
    tableName: "Match",
    timestamps: false,
  }
);

export default Match;
