import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // Agregar nuevos campos para información detallada de pagos
  await queryInterface.addColumn('Payment', 'payment_type', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Tipo de pago (credit_card, debit_card, bank_transfer, etc.)",
  });

  await queryInterface.addColumn('Payment', 'installments', {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: true,
    comment: "Número de cuotas del pago",
  });

  await queryInterface.addColumn('Payment', 'issuer_id', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "ID del emisor de la tarjeta",
  });

  await queryInterface.addColumn('Payment', 'transaction_amount', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: "Monto de la transacción desde MercadoPago",
  });

  await queryInterface.addColumn('Payment', 'net_received_amount', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: "Monto neto recibido después de comisiones",
  });

  await queryInterface.addColumn('Payment', 'total_paid_amount', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: "Monto total pagado por el comprador",
  });

  // Información del pagador
  await queryInterface.addColumn('Payment', 'payer_email', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Email del pagador desde MercadoPago",
  });

  await queryInterface.addColumn('Payment', 'payer_identification_type', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Tipo de identificación del pagador",
  });

  await queryInterface.addColumn('Payment', 'payer_identification_number', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Número de identificación del pagador",
  });

  // Información de la tarjeta
  await queryInterface.addColumn('Payment', 'card_last_four_digits', {
    type: DataTypes.STRING(4),
    allowNull: true,
    comment: "Últimos 4 dígitos de la tarjeta",
  });

  await queryInterface.addColumn('Payment', 'card_first_six_digits', {
    type: DataTypes.STRING(6),
    allowNull: true,
    comment: "Primeros 6 dígitos de la tarjeta",
  });

  // Timestamps de MercadoPago
  await queryInterface.addColumn('Payment', 'date_created', {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha de creación en MercadoPago",
  });

  await queryInterface.addColumn('Payment', 'date_last_updated', {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha de última actualización en MercadoPago",
  });

  // Detalles de la transacción
  await queryInterface.addColumn('Payment', 'transaction_details', {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Detalles de la transacción en formato JSON",
  });
};

export const down = async (queryInterface, Sequelize) => {
  // Remover las columnas en caso de rollback
  const columns = [
    'payment_type',
    'installments', 
    'issuer_id',
    'transaction_amount',
    'net_received_amount',
    'total_paid_amount',
    'payer_email',
    'payer_identification_type',
    'payer_identification_number',
    'card_last_four_digits',
    'card_first_six_digits',
    'date_created',
    'date_last_updated',
    'transaction_details'
  ];

  for (const column of columns) {
    await queryInterface.removeColumn('Payment', column);
  }
};