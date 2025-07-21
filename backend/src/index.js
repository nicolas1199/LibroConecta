import "./config/configEnv.js";
import express from "express";

console.log('🚀 SERVIDOR INICIANDO...');
console.log('🚀 PUERTO:', process.env.PORT);
console.log('🚀 NODE_ENV:', process.env.NODE_ENV);
console.log('🚀 MODO:', process.env.NODE_ENV || 'development');

// Remover la modificación de console.log que está causando el error

import corsMiddleware from "./middlewares/cors.middleware.js";
import jsonParserMiddleware from "./middlewares/jsonParser.middleware.js";
import cookieParserMiddleware from "./middlewares/cookieParser.middleware.js";
import sessionMiddleware from "./middlewares/session.middleware.js";
import morganMiddleware from "./middlewares/morgan.middleware.js";

import { PORT } from "./config/configEnv.js";
import { connectDB, syncDB } from "./config/configDb.js";
import indexRoutes from "./routes/index.routes.js";

async function setupServer() {
  const app = express();

  app.disable("x-powered-by");

  // Usamos middlewares separados importados
  app.use(corsMiddleware);

  // jsonParserMiddleware es un array de middlewares
  app.use(jsonParserMiddleware);

  app.use(cookieParserMiddleware);

  app.use(sessionMiddleware);

  app.use(morganMiddleware);

  // Verificar configuración de Cloudinary
  const hasCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (hasCloudinary) {
    console.log("☁️ Cloudinary configurado correctamente");
  } else {
    console.log(
      "⚠️ Cloudinary no configurado - Las imágenes no se podrán subir"
    );
  }

  app.use("/api", indexRoutes);

  app.listen(PORT, () => {
    console.log(`=> Servidor corriendo en puerto ${PORT}`);
  });
}

async function setupAPI() {
  try {
    await connectDB();
    await syncDB();
    await setupServer();
  } catch (error) {
    console.error("Error al iniciar backend:", error);
    process.exit(1);
  }
}

setupAPI()
  .then(() => console.log("=> Backend iniciado correctamente"))
  .catch((error) => console.error("Error en setupAPI:", error));
