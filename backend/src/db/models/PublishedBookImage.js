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
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
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
