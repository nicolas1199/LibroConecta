import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const MatchBooks = sequelize.define(
  "MatchBooks",
  {
    match_book_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Match',
        key: 'match_id'
      }
    },
    published_book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'PublishedBooks',
        key: 'published_book_id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "ID del usuario que posee este libro en el intercambio"
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "Match_Books",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['match_id', 'published_book_id']
      }
    ]
  }
);

export default MatchBooks;