export type ApiResponse<T> = {
  data: T;
  status: "ok";
};

export type ApiError = {
  error: string;
  status: "error";
  code: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
