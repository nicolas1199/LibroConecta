import { DataTypes } from "sequelize";
import { sequelize } from "../../config/configDb.js";

const Transaction = sequelize.define(
  "Transaction",
  {
    transaction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    published_book_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Libro involucrado en la transacción",
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Usuario que ofrece el libro",
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Usuario que recibe el libro",
    },
    transaction_type: {
      type: DataTypes.ENUM("sale", "exchange", "gift"),
      allowNull: false,
      comment: "Tipo de transacción",
    },
    // Para ventas
    payment_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "ID del pago asociado (solo para ventas)",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Monto de la venta",
    },
    // Para intercambios
    exchange_book_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Libro que se ofrece a cambio (intercambios)",
    },
    // Estados de la transacción
    status: {
      type: DataTypes.ENUM(
        "initiated",    // Transacción iniciada
        "pending",      // Pendiente (esperando pago/confirmación)
        "confirmed",    // Confirmada por ambas partes
        "in_progress",  // En progreso (entrega en curso)
        "completed",    // Completada exitosamente
        "cancelled",    // Cancelada
        "disputed"      // En disputa
      ),
      defaultValue: "initiated",
      allowNull: false,
    },
    // Información de entrega
    delivery_method: {
      type: DataTypes.ENUM("pickup", "shipping", "meet"),
      allowNull: true,
      comment: "Método de entrega: recogida, envío, encuentro",
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Dirección de entrega",
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha acordada de entrega",
    },
    // Notas y comentarios
    seller_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Notas del vendedor",
    },
    buyer_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Notas del comprador",
    },
    // Confirmaciones
    seller_confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Vendedor confirmó la transacción",
    },
    buyer_confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Comprador confirmó la transacción",
    },
    // Fechas de confirmación
    seller_confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    buyer_confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de completación de la transacción",
    },
    // Timestamps
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
    tableName: "Transaction",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Transaction; 