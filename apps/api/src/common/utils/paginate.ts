export function paginate(page: number = 1, perPage: number = 20) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number = 1,
  perPage: number = 20,
) {
  return {
    data,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}
