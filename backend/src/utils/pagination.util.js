export function getPagination(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return { offset, limit };
}
export function getPagingData(data, page, limit) {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, items, totalPages, currentPage };
}