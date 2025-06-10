-- Tabla de tipos de usuario
CREATE TABLE UserType (
    user_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL, -- Ej: 'admin', 'regular'
    description TEXT
);

-- Tabla de usuarios
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    user_type_id INTEGER REFERENCES UserType(user_type_id)
);

-- Tabla de categorías de libros
CREATE TABLE Category (
    category_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT
);

-- Tabla de libros
CREATE TABLE Books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(150),
    date_of_pub DATE,
    location VARCHAR(100),
    category_id INTEGER REFERENCES Category(category_id)
);

-- Relación entre usuarios y libros, con estado de disponibilidad
CREATE TABLE UserBooks (
    user_book_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(user_id),
    book_id INTEGER REFERENCES Books(book_id),
    is_for_sale BOOLEAN DEFAULT FALSE
);

-- Tabla de estados (para ventas e intercambios)
CREATE TABLE State (
    state_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL -- Ej: 'pendiente', 'completado', 'cancelado'
);

-- Tabla de ventas de libros
CREATE TABLE Sells (
    sell_id SERIAL PRIMARY KEY,
    user_id_seller INTEGER REFERENCES Users(user_id),
    user_id_buyer INTEGER REFERENCES Users(user_id),
    user_book_id INTEGER REFERENCES UserBooks(user_book_id),
    payment_method VARCHAR(50),
    date_sell DATE,
    state_id INTEGER REFERENCES State(state_id)
);

-- Tabla de intercambios de libros
CREATE TABLE Exchange (
    exchange_id SERIAL PRIMARY KEY,
    user_book_id_1 INTEGER REFERENCES UserBooks(user_book_id),
    user_book_id_2 INTEGER REFERENCES UserBooks(user_book_id),
    date_exchange DATE,
    state_id INTEGER REFERENCES State(state_id)
);

-- Tabla de matches entre usuarios
CREATE TABLE Match (
    match_id SERIAL PRIMARY KEY,
    user_id_1 INTEGER REFERENCES Users(user_id),
    user_id_2 INTEGER REFERENCES Users(user_id),
    date_match DATE
);