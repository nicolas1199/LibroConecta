// Verifica si un libro ya fue swipeado por un usuario
export function wasSwiped(userBookList, bookId) {
  return userBookList.some(ub => ub.book_id === bookId);
}

// Filtra libros que aún no han sido swipeados
export function filterUnswipedBooks(allBooks, swipedBookList) {
  const swipedIds = new Set(swipedBookList.map(ub => ub.book_id));
  return allBooks.filter(book => !swipedIds.has(book.book_id));
}

// Filtra solo los libros que el usuario marcó con like
export function getLikedBooks(userBookList) {
  return userBookList.filter(ub => ub.liked === true);
}

// Verifica si hay match en un libro entre dos usuarios (like recíproco)
export function hasMutualLike(user1Likes, user2Likes) {
  const user1LikedIds = new Set(user1Likes.map(ub => ub.book_id));
  const user2LikedIds = new Set(user2Likes.map(ub => ub.book_id));

  return [...user1LikedIds].filter(bookId => user2LikedIds.has(bookId));
}
// Filtra los libros que están disponibles para la venta
export function filterBooksForSale(userBookList) {
  return userBookList.filter(ub => ub.is_for_sale === true);
}