"use strict";
import { Sequelize } from "sequelize";
import { DB_CONFIG } from "./configEnv.js"; // Importa el objeto DB_CONFIG

// Configuración de la conexión a la base de datos usando Sequelize
const sequelize = new Sequelize(
  DB_CONFIG.database,
  DB_CONFIG.user,
  DB_CONFIG.password,

  {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    dialect: "postgres",
    logging: console.log,
  }
);

// Función para inicializar la conexión a la base de datos
export async function connectDB() {
  try {
    // Intenta autenticar la conexión
    await sequelize.authenticate();
    console.log("=> Conexión exitosa a la base de datos!");
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    process.exit(1);
  }
}

// Exportar la instancia de Sequelize y la función de conexión
export { sequelize };
