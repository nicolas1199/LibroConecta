import "./config/configEnv.js"
import express from "express"
import { promises as fs } from 'fs'
import path from 'path'

import corsMiddleware from "./middlewares/cors.middleware.js"
import jsonParserMiddleware from "./middlewares/jsonParser.middleware.js"
import cookieParserMiddleware from "./middlewares/cookieParser.middleware.js"
import sessionMiddleware from "./middlewares/session.middleware.js"
import morganMiddleware from "./middlewares/morgan.middleware.js"

import { PORT } from "./config/configEnv.js"
import { connectDB } from "./config/configDb.js"
import indexRoutes from "./routes/index.routes.js"
import * as db from "./db/modelIndex.js"

async function setupServer() {
  const app = express()

  app.disable("x-powered-by")

  // Usamos middlewares separados importados
  app.use(corsMiddleware)

  // jsonParserMiddleware es un array de middlewares
  app.use(jsonParserMiddleware)

  app.use(cookieParserMiddleware)

  app.use(sessionMiddleware)

  app.use(morganMiddleware)

  // Crear directorio uploads si no existe
  const uploadsDir = path.join(process.cwd(), 'uploads', 'books')
  try {
    await fs.mkdir(uploadsDir, { recursive: true })
    console.log('=> Directorio uploads creado/verificado')
  } catch (error) {
    console.error('Error creando directorio uploads:', error)
  }

  // Servir archivos estáticos (imágenes)
  app.use('/uploads', express.static('uploads'))

  app.use("/api", indexRoutes)

  app.listen(PORT, () => {
    console.log(`=> Servidor corriendo en puerto ${PORT}`)
  })
}

async function setupAPI() {
  try {
    await connectDB()
    await db.sequelize.sync()
    console.log("=> Base de datos sincronizada correctamente")
    
    // Limpiar placeholders antiguos
    try {
      const { PublishedBookImage } = db
      const deleted = await PublishedBookImage.destroy({
        where: {
          image_url: {
            [db.Sequelize.Op.like]: 'placeholder_%'
          }
        }
      })
      if (deleted > 0) {
        console.log(`=> ${deleted} placeholders eliminados de la base de datos`)
      }
    } catch (error) {
      console.error('Error limpiando placeholders:', error)
    }
    
    await setupServer()
  } catch (error) {
    console.error("Error al iniciar backend:", error)
    process.exit(1)
  }
}

setupAPI()
  .then(() => console.log("=> Backend iniciado correctamente"))
  .catch((error) => console.error("Error en setupAPI:", error))
