import { sequelize } from "./src/config/configDb.js";
import PublishedBooks from "./src/db/models/PublishedBooks.js";
import Book from "./src/db/models/Book.js";
import User from "./src/db/models/User.js";
import TransactionType from "./src/db/models/TransactionType.js";
import BookCondition from "./src/db/models/BookCondition.js";
import LocationBook from "./src/db/models/LocationBook.js";
import PublishedBookImage from "./src/db/models/PublishedBookImage.js";
import Category from "./src/db/models/Category.js";
import { Op, fn } from "sequelize";

// Script para probar la consulta de recomendaciones y detectar duplicados
async function testRecommendationsQuery() {
  try {
    console.log("🧪 Iniciando prueba de consulta de recomendaciones...");
    
    // Simular parámetros de la consulta
    const user_id = 1; // Usuario de prueba
    const limit = 10;
    const requestedLimit = Number.parseInt(limit);

    console.log(`📊 Parámetros de prueba:`);
    console.log(`   - Usuario: ${user_id}`);
    console.log(`   - Límite solicitado: ${requestedLimit}`);

    // PASO 1: Construir filtros de exclusión
    const whereConditions = {
      user_id: { [Op.ne]: user_id }, // Excluir propios libros
    };

    // PASO 2: Contar libros disponibles
    const availableCount = await PublishedBooks.count({
      where: whereConditions,
    });

    console.log(`📚 Libros disponibles: ${availableCount}`);

    if (availableCount === 0) {
      console.log("❌ No hay libros disponibles para la prueba");
      return;
    }

    // PASO 3: Calcular límite real
    const actualLimit = Math.min(requestedLimit, availableCount);
    const bufferMultiplier = 2;

    console.log(`🎯 Límite calculado: ${actualLimit}`);
    console.log(`📦 Buffer solicitado: ${actualLimit * bufferMultiplier}`);

    // PASO 4: Ejecutar consulta de recomendaciones
    console.log("\n🔍 Ejecutando consulta de recomendaciones...");
    
    const recommendations = await PublishedBooks.findAll({
      where: whereConditions,
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: User,
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "username",
            "email",
          ],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
        },
      ],
      order: [
        ["date_published", "DESC"],
        [fn("RANDOM")],
      ],
      limit: actualLimit * bufferMultiplier,
      distinct: true,
    });

    console.log(`📊 Resultados de la consulta:`);
    console.log(`   - Total encontrados: ${recommendations.length}`);

    // PASO 5: Analizar duplicados
    const duplicates = recommendations.filter(
      (book, index, self) =>
        self.findIndex(
          (b) => b.published_book_id === book.published_book_id
        ) !== index
    );

    console.log(`🔍 Análisis de duplicados:`);
    console.log(`   - Duplicados encontrados: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log(`⚠️ Detalles de duplicados:`);
      duplicates.forEach((book, index) => {
        console.log(`   ${index + 1}. ID: ${book.published_book_id}, Título: ${book.Book?.title || "N/A"}`);
      });
    } else {
      console.log(`✅ No se encontraron duplicados`);
    }

    // PASO 6: Aplicar filtrado
    const uniqueRecommendations = recommendations
      .filter(
        (book, index, self) =>
          index ===
          self.findIndex((b) => b.published_book_id === book.published_book_id)
      )
      .slice(0, actualLimit);

    console.log(`\n📈 Resultados finales:`);
    console.log(`   - Libros únicos después de filtrar: ${uniqueRecommendations.length}`);
    console.log(`   - Eficiencia: ${((uniqueRecommendations.length / (actualLimit * bufferMultiplier)) * 100).toFixed(1)}%`);

    // PASO 7: Mostrar detalles de libros únicos
    console.log(`\n📚 Libros únicos entregados:`);
    uniqueRecommendations.forEach((book, index) => {
      const imageCount = book.PublishedBookImages?.length || 0;
      console.log(`   ${index + 1}. ID: ${book.published_book_id}, Título: "${book.Book?.title}", Imágenes: ${imageCount}`);
    });

    // PASO 8: Verificar que no hay duplicados en el resultado final
    const finalDuplicates = uniqueRecommendations.filter(
      (book, index, self) =>
        self.findIndex(
          (b) => b.published_book_id === book.published_book_id
        ) !== index
    );

    if (finalDuplicates.length > 0) {
      console.log(`❌ ERROR: Se encontraron duplicados en el resultado final: ${finalDuplicates.length}`);
    } else {
      console.log(`✅ ÉXITO: No hay duplicados en el resultado final`);
    }

    console.log("\n🎉 Prueba completada exitosamente");

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar la prueba
testRecommendationsQuery(); 