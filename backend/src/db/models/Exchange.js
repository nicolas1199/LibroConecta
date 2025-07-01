import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDB.js";

const Exchange = sequelize.define(
  "Exchange",
  {
    exchange_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_book_id_1: {
      type: DataTypes.INTEGER,
    },
    user_book_id_2: {
      type: DataTypes.INTEGER,
    },
    date_exchange: {
      type: DataTypes.DATE,
    },
    state_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "Exchange",
    timestamps: false,
  }
);

export default Exchange;
