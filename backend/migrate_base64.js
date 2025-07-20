// Script temporal para migrar la base de datos
// Ejecutar: node migrate_base64.js
// Eliminar este archivo después de usar

import { sequelize } from './src/config/configDb.js';

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración para soporte de imágenes base64...');
    
    // 1. Agregar campo para datos base64 de la imagen
    console.log('📝 1. Agregando campo image_data...');
    await sequelize.query(`
      ALTER TABLE "PublishedBookImage" 
      ADD COLUMN IF NOT EXISTS image_data TEXT;
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN "PublishedBookImage".image_data IS 'Imagen codificada en base64';
    `);
    
    // 2. Modificar image_url para ser opcional
    console.log('📝 2. Modificando image_url para ser opcional...');
    try {
      await sequelize.query(`
        ALTER TABLE "PublishedBookImage" 
        ALTER COLUMN image_url DROP NOT NULL;
      `);
    } catch (error) {
      if (!error.message.includes('does not have a NOT NULL constraint')) {
        console.log('⚠️  image_url ya permite NULL o no existe restricción');
      }
    }
    
    await sequelize.query(`
      COMMENT ON COLUMN "PublishedBookImage".image_url IS 'URL de imagen externa (opcional para compatibilidad)';
    `);
    
    // 3. Agregar metadatos adicionales
    console.log('📝 3. Agregando campos de metadatos...');
    await sequelize.query(`
      ALTER TABLE "PublishedBookImage" 
      ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255),
      ADD COLUMN IF NOT EXISTS image_mimetype VARCHAR(100),
      ADD COLUMN IF NOT EXISTS image_size INTEGER;
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN "PublishedBookImage".image_filename IS 'Nombre original del archivo';
    `);
    await sequelize.query(`
      COMMENT ON COLUMN "PublishedBookImage".image_mimetype IS 'Tipo MIME de la imagen';
    `);
    await sequelize.query(`
      COMMENT ON COLUMN "PublishedBookImage".image_size IS 'Tamaño del archivo en bytes';
    `);
    
    // 4. Agregar índice
    console.log('📝 4. Agregando índice...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_published_book_images_book_primary 
      ON "PublishedBookImage"(published_book_id, is_primary);
    `);
    
    // 5. Verificar la estructura
    console.log('🔍 5. Verificando estructura actualizada...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'PublishedBookImage'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Estructura de la tabla PublishedBookImage:');
    results.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('✅ Migración completada exitosamente!');
    console.log('');
    console.log('🎉 Ahora puedes:');
    console.log('  1. Reiniciar tu servidor backend');
    console.log('  2. Usar la funcionalidad de imágenes base64');
    console.log('  3. Eliminar este archivo migrate_base64.js');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.log('');
    console.log('🔧 Posibles soluciones:');
    console.log('  1. Verifica que tu base de datos esté corriendo');
    console.log('  2. Revisa las credenciales en tu archivo .env');
    console.log('  3. Ejecuta manualmente el SQL desde sql/migrate_base64_images.sql');
  } finally {
    await sequelize.close();
    process.exit();
  }
}

// Ejecutar la migración
runMigration(); 