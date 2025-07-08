import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos a copiar de public/ a dist/
const filesToCopy = [
  '.htaccess',
  '_redirects'
];

const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

console.log('Copiando archivos de configuración del servidor...');

filesToCopy.forEach(file => {
  const srcPath = path.join(publicDir, file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copiado: ${file}`);
    } catch (error) {
      console.log(`❌ Error copiando ${file}:`, error.message);
    }
  }
});

console.log('Post-build completado.'); 