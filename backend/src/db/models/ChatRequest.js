import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const ChatRequest = sequelize.define(
  "ChatRequest",
  {
    request_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requester_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "user_id",
      },
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "user_id",
      },
    },
    book_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "PublishedBooks",
        key: "published_book_id",
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "ChatRequest",
    timestamps: false,
    indexes: [
      {
        fields: ["receiver_id", "status"],
      },
      {
        fields: ["requester_id"],
      },
      {
        fields: ["book_id"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

export default ChatRequest; 