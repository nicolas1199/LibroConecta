import { Match, MatchBooks, PublishedBooks, UserBook, sequelize } from "./src/db/modelIndex.js";

async function debugMatchBooks() {
  try {
    console.log("🔍 Debugging MatchBooks structure...");
    
    // Buscar un match con libros
    const match = await Match.findOne({
      include: [
        {
          model: PublishedBooks,
          as: "User1Book",
          required: false
        }
      ]
    });

    if (!match) {
      console.log("❌ No se encontró ningún match");
      return;
    }

    console.log(`✅ Match encontrado: ID ${match.match_id}`);
    
    // Obtener los libros del match con datos completos
    const matchBooks = await MatchBooks.findAll({
      where: { match_id: match.match_id },
      include: [
        {
          model: PublishedBooks,
          include: [
            {
              model: sequelize.models.Book,
              attributes: ["title", "author"]
            }
          ]
        }
      ]
    });

    console.log(`📚 Encontrados ${matchBooks.length} libros en el match`);
    
    // Verificar datos directamente de la base de datos
    console.log("\n🔍 Verificando datos directamente...");
    for (const mb of matchBooks) {
      console.log(`\n📖 MatchBook ID: ${mb.match_book_id}`);
      console.log(`   PublishedBook ID: ${mb.published_book_id}`);
      console.log(`   User ID: ${mb.user_id}`);
      
      // Obtener PublishedBook directamente
      const publishedBook = await PublishedBooks.findByPk(mb.published_book_id, {
        include: [
          {
            model: sequelize.models.Book,
            attributes: ["title", "author"]
          }
        ]
      });
      
      if (publishedBook) {
        console.log(`   ✅ PublishedBook encontrado:`);
        console.log(`      - published_book_id: ${publishedBook.published_book_id}`);
        console.log(`      - book_id: ${publishedBook.book_id}`);
        console.log(`      - user_id: ${publishedBook.user_id}`);
        console.log(`      - title: ${publishedBook.Book?.title}`);
        console.log(`      - author: ${publishedBook.Book?.author}`);
        
        // Verificar UserBook
        const userBook = await UserBook.findOne({
          where: {
            user_id: publishedBook.user_id,
            book_id: publishedBook.book_id
          }
        });
        
        console.log(`      - UserBook encontrado: ${userBook ? `ID ${userBook.user_book_id}` : 'No encontrado'}`);
      } else {
        console.log(`   ❌ PublishedBook no encontrado`);
      }
    }

  } catch (error) {
    console.error("❌ Error en debug:", error);
  } finally {
    process.exit(0);
  }
}

debugMatchBooks(); 