"use strict";
import { DataSource } from "typeorm";
import { DB_CONFIG } from "./configEnv.js"; // Importa el objeto DB_CONFIG

// Configuración de la conexión a la base de datos usando TypeORM
export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_CONFIG.host,
  port: DB_CONFIG.port,
  username: DB_CONFIG.user,
  password: DB_CONFIG.password,
  database: DB_CONFIG.database,
  entities: ["src/entity/**/*.js"], // o "dist/entity/**/*.js" si usas compilación
  synchronize: true, // cuidado en producción
  logging: false,
});

// Función para inicializar la conexión a la base de datos
export async function connectDB() {
  try {
    await AppDataSource.initialize();
    console.log("=> Conexión exitosa a la base de datos!");
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    process.exit(1);
  }
}
