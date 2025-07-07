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
