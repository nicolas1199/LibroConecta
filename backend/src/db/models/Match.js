const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Match = sequelize.define(
    "Match",
    {
      match_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id_1: {
        type: DataTypes.INTEGER,
      },
      user_id_2: {
        type: DataTypes.INTEGER,
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

  return Match;
};
