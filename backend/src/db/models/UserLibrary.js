import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "Título del libro",
    },
    author: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: "Autor del libro",
    },
    isbn: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "ISBN del libro",
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "URL de la imagen de portada del libro",
    },
    date_of_pub: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de publicación del libro",
    },
    reading_status: {
      type: DataTypes.ENUM("por_leer", "leyendo", "leido", "abandonado"),
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
