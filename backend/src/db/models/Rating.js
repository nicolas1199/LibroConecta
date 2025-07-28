import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const Rating = sequelize.define(
  "Rating",
  {
    rating_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rater_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rated_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    exchange_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del match asociado a esta calificación"
    },
    sell_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID de la transacción (Payment) asociada a esta calificación"
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Rating",
    timestamps: false,
  }
);

export default Rating;
