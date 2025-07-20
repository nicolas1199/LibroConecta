import { DataTypes } from "sequelize"
import { sequelize } from "../../config/configDb.js"

const PublishedBookImage = sequelize.define(
  "PublishedBookImage",
  {
    published_book_image_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    published_book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Cambiado de image_url a image_data para almacenar base64
    image_data: {
      type: DataTypes.TEXT('long'), // Usar LONGTEXT para imágenes grandes
      allowNull: false,
      comment: "Imagen codificada en base64",
    },
    // Mantener compatibilidad con URLs (opcional)
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "URL de imagen externa (opcional para compatibilidad)",
    },
    // Metadatos adicionales de la imagen
    image_filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Nombre original del archivo",
    },
    image_mimetype: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Tipo MIME de la imagen (image/jpeg, image/png, etc.)",
    },
    image_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Tamaño del archivo en bytes",
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si es la imagen principal",
    },
  },
  {
    tableName: "PublishedBookImage",
    timestamps: false,
  },
)

export default PublishedBookImage
