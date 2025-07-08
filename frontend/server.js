const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 1235;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// Manejar SPA routing - todas las rutas devuelven index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
}); 