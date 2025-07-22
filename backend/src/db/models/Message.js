import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const Message = sequelize.define(
  "Message",
  {
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image'),
      defaultValue: 'text',
      allowNull: false,
    },
    image_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Imagen codificada en base64 (data:image/type;base64,...)",
    },
    image_filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Nombre original del archivo de imagen",
    },
    image_mimetype: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Tipo MIME de la imagen",
    },
    image_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Tamaño del archivo en bytes",
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "Message",
    timestamps: false,
  }
);

export default Message;
