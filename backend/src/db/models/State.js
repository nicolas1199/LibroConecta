import { DataTypes } from "sequelize";

export default (sequelize) => {
  const State = sequelize.define(
    "State",
    {
      state_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: "State",
      timestamps: false,
    }
  );

  return State;
};
