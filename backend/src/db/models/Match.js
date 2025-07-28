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
    },
    user_id_2: {
      type: DataTypes.UUID,
    },
    user_1_book_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'PublishedBooks',
        key: 'published_book_id'
      }
    },
    user_2_book_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'PublishedBooks',
        key: 'published_book_id'
      }
    },
    date_match: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "Match",
    timestamps: false,
  }
);

export default Match;
