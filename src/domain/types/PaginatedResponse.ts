/**
 * Generic paginated response type
 * @template T The type of items in the data array
 */
export interface PaginatedResponse<T> {
  /**
   * The array of items for the current page
   */
  data: T[];

  /**
   * Current page number (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of pages available
   */
  totalPages: number;

  /**
   * Total number of items across all pages
   */
  totalItems: number;

  /**
   * Number of items per page
   */
  pageSize: number;
}
