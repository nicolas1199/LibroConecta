import { Sequelize } from "sequelize"
import { DB_CONFIG, DATABASE_URL } from "./configEnv.js"

// Configuración de la conexión a la base de datos usando Sequelize
export const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: "postgres",
      logging: false,
    })
  : new Sequelize(DB_CONFIG.database, DB_CONFIG.user, DB_CONFIG.password, {
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      dialect: "postgres",
      logging: false,
    })

// Función para inicializar la conexión a la base de datos
export async function connectDB() {
  try {
    // Intenta autenticar la conexión
    await sequelize.authenticate()
    console.log("=> Conexión a la base de datos establecida correctamente.")
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error)
    process.exit(1)
  }
}
