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
import AuthRoutes from "./routes/Auth.routes.js";
import UserRoutes from "./routes/User.routes.js";
import BookRoutes from "./routes/Book.routes.js";
import CategoryRoutes from "./routes/Category.routes.js";
import BookConditionRoutes from "./routes/BookCondition.routes.js";
import TransactionTypeRoutes from "./routes/TransactionType.routes.js";
import LocationBookRoutes from "./routes/LocationBook.routes.js";
import PublishedBooksRoutes from "./routes/PublishedBooks.routes.js";
import PublishedBookImageRoutes from "./routes/PublishedBookImage.routes.js";
import MatchRoutes from "./routes/Match.routes.js";
import MessageRoutes from "./routes/Message.routes.js";
import RatingRoutes from "./routes/Rating.routes.js";
import UserLibraryRoutes from "./routes/UserLibrary.routes.js";
import UserBookRoutes from "./routes/UserBook.routes.js";
import PaymentRoutes from "./routes/Payment.routes.js";
import ChatRequestRoutes from "./routes/ChatRequest.routes.js";

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

  // Rutas de la API
  app.use("/api/auth", AuthRoutes);
  app.use("/api/users", UserRoutes);
  app.use("/api/books", BookRoutes);
  app.use("/api/categories", CategoryRoutes);
  app.use("/api/book-conditions", BookConditionRoutes);
  app.use("/api/transaction-types", TransactionTypeRoutes);
  app.use("/api/locations", LocationBookRoutes);
  app.use("/api/published-books", PublishedBooksRoutes);
  app.use("/api/published-book-images", PublishedBookImageRoutes);
  app.use("/api/matches", MatchRoutes);
  app.use("/api/messages", MessageRoutes);
  app.use("/api/ratings", RatingRoutes);
  app.use("/api/user-library", UserLibraryRoutes);
  app.use("/api/user-books", UserBookRoutes);
  app.use("/api/payments", PaymentRoutes);
  app.use("/api/chat-requests", ChatRequestRoutes);

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
