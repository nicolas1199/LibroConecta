import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const UserPublishedBookInteraction = sequelize.define(
  "UserPublishedBookInteraction",
  {
    interaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Usuario que hace la interacción",
    },
    published_book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Libro publicado con el que interactúa",
    },
    interaction_type: {
      type: DataTypes.ENUM('like', 'dislike'),
      allowNull: false,
      comment: "Tipo de interacción: like, dislike",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "UserPublishedBookInteractions",
    timestamps: false,
  }
);

export default UserPublishedBookInteraction;
