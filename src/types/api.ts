export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PackQuery extends PaginationQuery {
  category?: string;
  active?: string;
}
