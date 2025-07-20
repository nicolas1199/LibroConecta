import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const Payment = sequelize.define(
  "Payment",
  {
    payment_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    published_book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID del libro publicado que se está comprando",
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Usuario que compra el libro",
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Usuario que vende el libro",
    },
    // Información de MercadoPago
    mp_payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID del pago en MercadoPago",
    },
    mp_preference_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID de la preferencia en MercadoPago",
    },
    mp_collection_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID de la colección en MercadoPago",
    },
    mp_collection_status: {
      type: DataTypes.ENUM(
        "approved",
        "pending",
        "authorized",
        "in_process",
        "in_mediation", 
        "rejected",
        "cancelled",
        "refunded",
        "charged_back"
      ),
      allowNull: true,
      comment: "Estado del pago en MercadoPago",
    },
    // Información del pago
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Monto del pago",
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "CLP",
      allowNull: false,
      comment: "Moneda del pago",
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Método de pago utilizado",
    },
    // Estados internos
    status: {
      type: DataTypes.ENUM(
        "pending",    // Pendiente de pago
        "paid",       // Pagado exitosamente
        "failed",     // Pago falló
        "cancelled",  // Pago cancelado
        "refunded",   // Pago reembolsado
        "disputed"    // Pago en disputa
      ),
      defaultValue: "pending",
      allowNull: false,
    },
    // Metadatos adicionales
    mp_external_reference: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Referencia externa para identificar el pago",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Descripción del pago",
    },
    notification_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL de notificación webhook",
    },
    // URLs de redirect
    success_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL de éxito",
    },
    failure_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL de fallo",
    },
    pending_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL de pendiente",
    },
    // Timestamps automáticos
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha y hora del pago",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    }
  },
  {
    tableName: "Payment",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Payment; 