import { DataTypes } from "sequelize"
import { sequelize } from "../../config/configDb.js"

const PublishedBooks = sequelize.define(
  "PublishedBooks",
  {
    published_book_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    transaction_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Precio del libro si está a la venta",
    },
    look_for: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Libros que busca para intercambiar",
    },
    condition_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_published: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción adicional sobre la publicación",
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "PublishedBooks",
    timestamps: false,
  },
)

export default PublishedBooks
