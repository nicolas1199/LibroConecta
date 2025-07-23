-- Crear tabla para solicitudes de chat
CREATE TABLE IF NOT EXISTS "ChatRequest" (
  request_id SERIAL PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES "PublishedBooks"(published_book_id) ON DELETE SET NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  
  -- Constraint para evitar solicitudes duplicadas pendientes
  CONSTRAINT unique_pending_request UNIQUE(requester_id, receiver_id, book_id, status)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_requests_receiver_status ON "ChatRequest"(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_requester ON "ChatRequest"(requester_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_book ON "ChatRequest"(book_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_created_at ON "ChatRequest"(created_at);

-- Comentarios para documentar la tabla
COMMENT ON TABLE "ChatRequest" IS 'Tabla para manejar solicitudes de chat entre usuarios que no han tenido match';
COMMENT ON COLUMN "ChatRequest".requester_id IS 'ID del usuario que envía la solicitud';
COMMENT ON COLUMN "ChatRequest".receiver_id IS 'ID del usuario que recibe la solicitud';
COMMENT ON COLUMN "ChatRequest".book_id IS 'ID del libro por el cual se solicita el chat (opcional)';
COMMENT ON COLUMN "ChatRequest".message IS 'Mensaje opcional que acompaña la solicitud';
COMMENT ON COLUMN "ChatRequest".status IS 'Estado de la solicitud: pending, accepted, rejected';
COMMENT ON COLUMN "ChatRequest".created_at IS 'Fecha y hora de creación de la solicitud';
COMMENT ON COLUMN "ChatRequest".responded_at IS 'Fecha y hora de respuesta (aceptar/rechazar)'; 