-- Tabla para almacenar borradores de libros
CREATE TABLE IF NOT EXISTS drafts (
    draft_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255),
    author VARCHAR(255),
    description TEXT,
    date_of_pub INT,
    category_ids JSON,
    condition_id INT,
    transaction_type_id INT,
    price DECIMAL(10,2),
    look_for TEXT,
    location_id INT,
    current_step INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES book_conditions(condition_id),
    FOREIGN KEY (transaction_type_id) REFERENCES transaction_types(transaction_type_id),
    FOREIGN KEY (location_id) REFERENCES location_books(location_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_drafts_user_id ON drafts(user_id);
CREATE INDEX idx_drafts_created_at ON drafts(created_at);
CREATE INDEX idx_drafts_updated_at ON drafts(updated_at);
