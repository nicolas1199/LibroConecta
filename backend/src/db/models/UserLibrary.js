import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDB.js";

const UserLibrary = sequelize.define(
  "UserLibrary",
  {
    user_library_id: {
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
    reading_status: {
      type: DataTypes.ENUM("por_leer", "leyendo", "leido"),
      allowNull: true,
      comment: "Estado de lectura del libro",
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
      comment: "Calificación del libro del 1 al 5",
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Reseña personal del libro",
    },
    date_started: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha en que comenzó a leer el libro",
    },
    date_finished: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha en que terminó de leer el libro",
    },
  },
  {
    tableName: "UserLibraries",
    timestamps: true,
  }
);

export default UserLibrary;
