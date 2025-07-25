import { fileURLToPath } from "url"
import path from "path"
import dotenv from "dotenv"

// Obtener ruta absoluta del archivo actual
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ruta al archivo .env (en la raíz del backend)
const envPath = path.resolve(__dirname, "../../.env")

// Cargar variables de entorno
dotenv.config({ path: envPath })

export const PORT = process.env.PORT || 4000

export const DATABASE_URL = process.env.DATABASE_URL

export const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USERNAME || "postgres",
  password: (process.env.DB_PASSWORD || "").trim(),
  database: process.env.DB_NAME || "mydatabase",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
}

export const JWT = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "defaultAccessSecret",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "defaultRefreshSecret",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
}

export const COOKIE_KEY = process.env.COOKIE_KEY || "defaultCookieSecret"

export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173"

export const EMAIL_CONFIG = {
  service: "gmail",
  user: process.env.EMAIL_USER || "",
  pass: process.env.EMAIL_PASS || "",
}

// Variables de entorno de MercadoPago
export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
export const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY;
export const MP_CLIENT_ID = process.env.MP_CLIENT_ID;
export const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET;
export const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

// URLs de la aplicación para redirects
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
