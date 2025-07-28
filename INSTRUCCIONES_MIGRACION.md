# Instrucciones para completar la migración de Payment

## 1. Ejecutar el script SQL
Ejecuta este comando en tu servidor PostgreSQL:
```bash
psql -U tu_usuario -d tu_base_de_datos -f add_payment_fields.sql
```

## 2. Después de ejecutar el script, actualizar el código

### A. Actualizar `createPaymentPreference` en Payment.controller.js línea 167:
```javascript
// Cambiar de:
const paymentRecord = await Payment.create({
  published_book_id: publishedBookId,
  buyer_id: userId,
  seller_id: publishedBook.user_id,
  amount: publishedBook.price,
  currency: 'CLP',
  mp_external_reference: externalReference,
  description: `Compra de libro: ${publishedBook.Book.title}`,
  status: 'pending'
  // TODO: Agregar nuevos campos después de ejecutar migración
});

// A:
const paymentRecord = await Payment.create({
  published_book_id: publishedBookId,
  buyer_id: userId,
  seller_id: publishedBook.user_id,
  amount: publishedBook.price,
  currency: 'CLP',
  mp_external_reference: externalReference,
  description: `Compra de libro: ${publishedBook.Book.title}`,
  status: 'pending',
  installments: 1 // Ahora sí incluir el campo
});
```

### B. Actualizar `updatePaymentFromWebhook` en Payment.controller.js línea 502:
```javascript
// Reemplazar toda la función con la versión completa que extrae todos los datos
async function updatePaymentFromWebhook(paymentRecord, mpPaymentInfo, mpPaymentId) {
  const paymentDetails = {
    mp_payment_id: mpPaymentId.toString(),
    mp_collection_id: mpPaymentInfo.collection_id,
    mp_collection_status: mpPaymentInfo.status,
    payment_method: mpPaymentInfo.payment_method_id,
    payment_date: mpPaymentInfo.date_approved || new Date(),
    status: mapMercadoPagoStatus(mpPaymentInfo.status),
    
    // Campos adicionales ahora disponibles
    payment_type: mpPaymentInfo.payment_type_id,
    installments: mpPaymentInfo.installments || 1,
    issuer_id: mpPaymentInfo.issuer_id,
    transaction_amount: mpPaymentInfo.transaction_amount,
    net_received_amount: mpPaymentInfo.net_received_amount,
    total_paid_amount: mpPaymentInfo.total_paid_amount,
    payer_email: mpPaymentInfo.payer?.email,
    payer_identification_type: mpPaymentInfo.payer?.identification?.type,
    payer_identification_number: mpPaymentInfo.payer?.identification?.number,
    card_last_four_digits: mpPaymentInfo.card?.last_four_digits,
    card_first_six_digits: mpPaymentInfo.card?.first_six_digits,
    date_created: mpPaymentInfo.date_created,
    date_last_updated: mpPaymentInfo.date_last_updated,
    transaction_details: JSON.stringify({
      financial_institution: mpPaymentInfo.transaction_details?.financial_institution,
      net_received_amount: mpPaymentInfo.transaction_details?.net_received_amount,
      total_paid_amount: mpPaymentInfo.transaction_details?.total_paid_amount,
      installment_amount: mpPaymentInfo.transaction_details?.installment_amount,
      overpaid_amount: mpPaymentInfo.transaction_details?.overpaid_amount
    })
  };

  await paymentRecord.update(paymentDetails);
}
```

## 3. Verificar funcionamiento
Después de los cambios, el webhook capturará todos los datos del pago y el sistema popup funcionará correctamente.

## 4. Uso del popup
```jsx
<PaymentButton 
  publishedBookId={bookId}
  price={price}
  usePopup={true} // Para ventana popup
  onPaymentStart={() => console.log('Pago iniciado')}
/>
```