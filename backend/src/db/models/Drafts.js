import { DataTypes } from "sequelize";
import sequelize from "../../config/configDb.js";

const Drafts = sequelize.define(
  "Drafts",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    isbn: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    publisher: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    published_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    form_step: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    completion_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    last_edited: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    book_condition_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "book_conditions",
        key: "id",
      },
    },
    transaction_type_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "transaction_types",
        key: "id",
      },
    },
    location_book_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "location_books",
        key: "id",
      },
    },
  },
  {
    tableName: "drafts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Drafts;
