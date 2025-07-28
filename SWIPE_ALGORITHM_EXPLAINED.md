# 📚 ALGORITMO DE RECOMENDACIONES PARA SWIPE

## 🎯 **RESUMEN EJECUTIVO**

El sistema de swipe usa un **algoritmo simple pero efectivo** que se ejecuta en el backend (`PublishedBooks.controller.js`) para entregar libros personalizados al usuario.

---

## 🔄 **FLUJO COMPLETO DEL ALGORITMO**

### **1. 📞 Llamada desde Frontend**

```javascript
// frontend/src/api/publishedBooks.js
export const getRecommendations = async (params = {}) => {
  const res = await api.get("/published-books/recommendations/swipe", {
    params,
  });
  return res.data;
};
```

### **2. 🎯 Endpoint Backend**

```javascript
// Route: GET /published-books/recommendations/swipe
// Controller: PublishedBooks.controller.js → getRecommendations()
```

---

## 🧠 **LÓGICA DEL ALGORITMO DE RECOMENDACIONES**

### **Paso 1: 📋 Identificar Usuario y Parámetros**

```javascript
const { user_id } = req.user; // Usuario autenticado
const { limit = 20 } = req.query; // Cantidad de libros (default: 20)
```

### **Paso 2: 🚫 Excluir Libros Ya Evaluados**

```javascript
// Buscar libros que el usuario ya swipeó (like/dislike)
const interactedBooks = await UserPublishedBookInteraction.findAll({
  where: { user_id },
  attributes: ["published_book_id"],
});

const interactedBookIds = interactedBooks.map((book) => book.published_book_id);
```

### **Paso 3: 🎨 Construir Filtros de Exclusión**

```javascript
const whereConditions = {
  user_id: { [Op.ne]: user_id }, // ❌ NO mostrar propios libros
};

if (interactedBookIds.length > 0) {
  whereConditions.published_book_id = {
    [Op.notIn]: interactedBookIds, // ❌ NO mostrar ya swipeados
  };
}
```

### **Paso 4: 📚 Consulta Principal con Joins**

```javascript
const recommendations = await PublishedBooks.findAll({
  where: whereConditions,
  include: [
    { model: Book, include: [{ model: Category }] }, // Datos del libro
    { model: User }, // Datos del dueño
    { model: TransactionType }, // Venta/Intercambio
    { model: BookCondition }, // Estado del libro
    { model: LocationBook }, // Ubicación
    { model: PublishedBookImage }, // Imágenes
  ],
  order: [
    ["date_published", "DESC"], // 🆕 Priori libros recientes
    [fn("RANDOM")], // 🎲 Orden aleatorio para diversidad
  ],
  limit: Number.parseInt(limit), // 📊 Limitar resultados
});
```

### **Paso 5: ✅ Retornar Resultados**

```javascript
if (recommendations.length === 0) {
  return success(res, [], "Has revisado todos los libros disponibles");
}

return success(
  res,
  recommendations,
  `${recommendations.length} recomendaciones encontradas`
);
```

---

## 🔍 **CARACTERÍSTICAS DEL ALGORITMO**

### **✅ Lo que SÍ hace:**

1. **🚫 Filtrado inteligente**: Excluye libros propios y ya evaluados
2. **🔄 Sin repeticiones**: Nunca muestra el mismo libro dos veces
3. **🆕 Prioriza recientes**: Libros recién publicados aparecen primero
4. **🎲 Diversidad**: Orden aleatorio para variedad
5. **📊 Control de cantidad**: Limit configurable (default: 20)
6. **📋 Datos completos**: Incluye toda la información necesaria

### **❌ Lo que NO hace:**

- **No hay análisis de preferencias** por género/autor
- **No hay scoring** de compatibilidad
- **No considera ubicación** geográfica
- **No analiza historial** de likes para personalizar
- **No usa machine learning** o IA

---

## 📊 **EJEMPLO DE EJECUCIÓN**

### **Escenario: Usuario Juan hace su primer swipe**

```javascript
// Paso 1: Obtener libros ya evaluados
interactedBooks = []  // Vacío (primera vez)

// Paso 2: Construir filtros
whereConditions = {
  user_id: { ne: "juan-uuid" }  // Solo excluir sus propios libros
}

// Paso 3: Consulta
SELECT * FROM PublishedBooks
WHERE user_id != 'juan-uuid'
ORDER BY date_published DESC, RANDOM()
LIMIT 20

// Resultado: 20 libros aleatorios (excluyendo los suyos)
```

### **Escenario: Usuario Juan después de 10 swipes**

```javascript
// Paso 1: Obtener libros ya evaluados
interactedBooks = [1, 5, 12, 8, 9, 15, 22, 18, 7, 3]  // 10 libros

// Paso 2: Construir filtros
whereConditions = {
  user_id: { ne: "juan-uuid" },
  published_book_id: { notIn: [1, 5, 12, 8, 9, 15, 22, 18, 7, 3] }
}

// Paso 3: Consulta
SELECT * FROM PublishedBooks
WHERE user_id != 'juan-uuid'
  AND published_book_id NOT IN (1,5,12,8,9,15,22,18,7,3)
ORDER BY date_published DESC, RANDOM()
LIMIT 20

// Resultado: 20 libros nuevos (excluyendo propios y ya evaluados)
```

---

## 🚀 **VENTAJAS DEL ALGORITMO ACTUAL**

1. **⚡ Simple y rápido**: Sin cálculos complejos
2. **🔒 Consistente**: Nunca repite libros
3. **📊 Escalable**: Funciona con cualquier cantidad de datos
4. **🛠️ Mantenible**: Fácil de entender y modificar
5. **💾 Eficiente**: Consultas optimizadas con índices

---

## 📈 **POSIBLES MEJORAS FUTURAS**

### **🎯 Personalización Básica:**

```javascript
// Agregar filtros por ubicación
WHERE location.city = user.city

// Priorizar por tipo de transacción preferida
ORDER BY CASE WHEN transaction_type = user.preferred_type THEN 0 ELSE 1 END
```

### **🧠 Personalización Avanzada:**

```javascript
// Analizar géneros de libros que el usuario dio "like"
// Calcular score de compatibilidad
// Usar machine learning para predicciones
```

---

## 🔚 **CONCLUSIÓN**

**El algoritmo actual es simple pero efectivo:**

- ✅ Evita repeticiones
- ✅ Mantiene diversidad
- ✅ Es rápido y escalable
- ✅ Cumple perfectamente su propósito

**Es ideal para un MVP** y puede evolucionar hacia personalización más sofisticada en futuras versiones.
