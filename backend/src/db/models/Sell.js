import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDB.js";

const Sell = sequelize.define(
  "Sell",
  {
    sell_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id_seller: {
      type: DataTypes.INTEGER,
    },
    user_id_buyer: {
      type: DataTypes.INTEGER,
    },
    user_book_id: {
      type: DataTypes.INTEGER,
    },
    payment_method: {
      type: DataTypes.STRING(50),
    },
    date_sell: {
      type: DataTypes.DATE,
    },
    state_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "Sells",
    timestamps: false,
  }
);

export default Sell;
