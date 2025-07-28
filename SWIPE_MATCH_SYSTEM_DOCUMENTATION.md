# Documentación del Sistema de Swipe y Match - LibroConecta

## Resumen del Sistema

El sistema de swipe y match de LibroConecta permite a los usuarios descubrir libros mediante un sistema de cartas deslizables similar a aplicaciones de citas, con detección automática de matches cuando hay likes mutuos entre usuarios.

## Arquitectura General

### Frontend (React)

- **Página principal**: `Swipe.jsx` - Interfaz principal de swipe
- **Componente de tarjeta**: `SwipeCard.jsx` - Tarjeta individual interactiva
- **Historial**: `SwipeHistory.jsx` - Gestión de interacciones pasadas
- **Notificaciones**: `AutoMatchNotification.jsx` - Alertas de matches automáticos
- **Página de pruebas**: `SwipeTestPage.jsx` - Testing sin múltiples cuentas

### Backend (Node.js + Sequelize)

- **Controlador principal**: `PublishedBooks.controller.js` - Lógica de recomendaciones e interacciones
- **Servicio de auto-match**: `AutoMatch.service.js` - Detección de matches mutuos
- **Modelo de datos**: `UserPublishedBookInteraction.js` - Registro de swipes
- **Utilidades**: `match.util.js` - Funciones auxiliares

## Flujo de Datos Completo

### 1. Carga de Recomendaciones (`getRecommendations`)

**Backend - PublishedBooks.controller.js:**

```javascript
// FLUJO:
// 1. Recibe solicitud del frontend con cantidad de libros deseados
// 2. Consulta UserPublishedBookInteraction para obtener libros ya evaluados
// 3. Construye filtros para excluir: propios libros + libros ya swipeados
// 4. Cuenta cuántos libros están realmente disponibles
// 5. Calcula límite real (menor entre solicitado y disponible)
// 6. Obtiene libros con joins completos para información rica
// 7. Filtra duplicados por seguridad
// 8. Retorna libros únicos con metadata de paginación
```

**Frontend - Swipe.jsx:**

```javascript
// FLUJO:
// 1. Solicita 20 libros al backend via getRecommendations
// 2. Actualiza estado con libros recibidos
// 3. Maneja casos especiales (sin libros, errores)
// 4. Carga automática cuando quedan pocos libros (<= 3)
```

### 2. Registro de Interacciones (`recordInteraction`)

**Frontend - SwipeCard.jsx:**

```javascript
// DETECCIÓN DE SWIPE:
// 1. Detecta arrastre horizontal > 75px O velocidad > 500px/s
// 2. Determina dirección: derecha = like, izquierda = dislike
// 3. Ejecuta callback onSwipe con book_id y dirección
// 4. Soporta teclado: flechas o H/L para accesibilidad
```

**Frontend - Swipe.jsx:**

```javascript
// MANEJO DEL SWIPE:
// 1. Recibe evento de swipe desde SwipeCard
// 2. Envía datos al backend via recordSwipeInteraction
// 3. Verifica respuesta por auto-matches
// 4. Avanza al siguiente libro
// 5. Actualiza estadísticas locales
```

**Backend - PublishedBooks.controller.js:**

```javascript
// REGISTRO DE INTERACCIÓN:
// 1. Valida datos de entrada (published_book_id, interaction_type)
// 2. Verifica que el libro existe y no es propio
// 3. Busca/crea/actualiza registro en UserPublishedBookInteraction
// 4. Si es LIKE: verifica automáticamente si hay match mutuo
// 5. Retorna resultado con información de auto-match si aplicable
```

### 3. Sistema de Auto-Match (`checkAndCreateAutoMatch`)

**Backend - AutoMatch.service.js:**

```javascript
// DETECCIÓN DE RECIPROCIDAD:
// 1. Recibe user_id del usuario que hizo LIKE y published_book_id del libro
// 2. Obtiene información del libro y su propietario
// 3. Busca si ya existe match entre estos usuarios
// 4. Verifica si hay reciprocidad de likes entre los usuarios
// 5. Si hay reciprocidad: crea Match automático en base de datos
// 6. Retorna información del match para notificación en frontend

// LÓGICA DE RECIPROCIDAD:
// - Usuario A le da like al libro de Usuario B
// - Se busca: ¿Usuario B le dio like a algún libro de Usuario A?
// - Si SÍ: hay reciprocidad → crear match automático
```

**Frontend - AutoMatchNotification.jsx:**

```javascript
// NOTIFICACIÓN DE MATCH:
// 1. Recibe datos del match desde Swipe.jsx
// 2. Muestra notificación animada con información del match
// 3. Permite cerrar o navegar a página de matches
// 4. Se auto-cierra después de 8 segundos
// 5. Limpia estado en componente padre al cerrar
```

### 4. Historial de Interacciones (`getUserSwipeHistory`)

**Backend - PublishedBooks.controller.js:**

```javascript
// HISTORIAL PAGINADO:
// 1. Recibe parámetros de paginación y filtros desde frontend
// 2. Construye consulta con joins para información completa
// 3. Aplica filtros por tipo de interacción si se especifica
// 4. Calcula estadísticas globales por separado
// 5. Retorna datos paginados + estadísticas + metadata
```

**Frontend - SwipeHistory.jsx:**

```javascript
// GESTIÓN DE HISTORIAL:
// 1. Carga historial paginado desde backend
// 2. Muestra tarjetas con información de cada interacción
// 3. Permite modificar interacciones (cambiar like ↔ dislike)
// 4. Permite eliminar interacciones completamente
// 5. Maneja filtros por tipo y paginación
```

## Modelos de Base de Datos

### UserPublishedBookInteraction

```sql
CREATE TABLE "UserPublishedBookInteractions" (
    interaction_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    published_book_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) CHECK (interaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_user_book_interaction
        UNIQUE (user_id, published_book_id)
);
```

### Match (Modificaciones)

```sql
-- Nuevas columnas agregadas:
ALTER TABLE "Match" ADD COLUMN match_type VARCHAR(20); -- 'manual' o 'automatic'
ALTER TABLE "Match" ADD COLUMN triggered_by_books TEXT; -- JSON con info de libros
```

## Estados y Animaciones

### SwipeCard.jsx

- **x**: Posición horizontal durante arrastre
- **rotate**: Rotación basada en posición (-15° a +15°)
- **opacity**: Fade out en extremos
- **likeOpacity/dislikeOpacity**: Indicadores visuales de acción

### AutoMatchNotification.jsx

- **Entrada**: opacity 0→1, escala 0.8→1
- **Salida**: opacity 1→0, escala 1→0.8
- **Auto-cierre**: 8 segundos

### SwipeHistory.jsx

- **HistoryCard**: Animación de entrada desde abajo
- **Filtros**: Transiciones suaves entre estados
- **Paginación**: Carga con loading states

## API Endpoints

### GET `/published-books/recommendations/swipe`

- **Parámetros**: `limit` (default: 20)
- **Respuesta**: Array de libros con información completa
- **Filtros aplicados**: Excluye propios libros y ya evaluados

### POST `/published-books/interactions`

- **Body**: `{published_book_id, interaction_type}`
- **Respuesta**: `{interaction, autoMatch: {created, match?, trigger_info?}}`

### GET `/published-books/interactions/history`

- **Parámetros**: `page`, `limit`, `interaction_type?`
- **Respuesta**: `{interactions[], stats, pagination}`

### PUT `/published-books/interactions/:id`

- **Body**: `{interaction_type}`
- **Función**: Cambiar like ↔ dislike

### DELETE `/published-books/interactions/:id`

- **Función**: Eliminar interacción completamente

## Manejo de Errores y Edge Cases

### Frontend

- **Sin libros disponibles**: Pantalla "Has revisado todos los libros"
- **Error de conexión**: Mensaje de error con opción de retry
- **Imágenes faltantes**: Fallback a placeholder
- **Swipes fallidos**: Continuar al siguiente libro sin bloquear UX

### Backend

- **Libros duplicados**: Filtrado adicional por published_book_id
- **Auto-match fallido**: No afecta registro de swipe principal
- **Validaciones**: Verificar existencia de libro y que no sea propio
- **Concurrencia**: Unique constraint previene duplicados

## Optimizaciones Implementadas

### Performance

- **Carga proactiva**: Cargar más libros cuando quedan ≤ 3
- **Consultas optimizadas**: Incluir solo joins necesarios
- **Paginación inteligente**: Límite basado en disponibilidad real
- **Estados locales**: Optimistic updates en modificaciones

### UX

- **Navegación por teclado**: Soporte para flechas y H/L
- **Animaciones suaves**: Framer Motion para transiciones
- **Feedback visual**: Indicadores de like/dislike durante arrastre
- **Auto-cierre**: Notificaciones se cierran automáticamente

### Algoritmo de Recomendaciones

- **Filtrado inteligente**: Excluye libros ya evaluados y propios
- **Ordenamiento híbrido**: Recientes + aleatoriedad para diversidad
- **Conteo previo**: Verificar disponibilidad antes de consultar
- **Manejo de límites**: Solicitar solo lo que se puede entregar

## Testing

### SwipeTestPage.jsx

- **4 escenarios de prueba**: Simula diferentes situaciones de match
- **Datos realistas**: Usa información de libros reales
- **Feedback educativo**: Explica qué está sucediendo en cada caso
- **Navegación integrada**: Conecta con sistema de notificaciones real

## Flujo de Datos Resumido

```
Usuario hace swipe → SwipeCard detecta → Swipe.jsx recibe →
API recordInteraction → Backend valida → Registra en BD →
Verifica auto-match → Retorna resultado → Frontend actualiza →
Si hay match: muestra notificación → Usuario puede navegar a matches
```

Este sistema proporciona una experiencia fluida de descubrimiento de libros con matches automáticos, manteniendo un registro completo de interacciones y permitiendo gestión granular del historial de usuario.
