/** Standard envelope returned by every API handler. */
export interface ApiResponse<T = Record<string, unknown>> {
  status: number;
  data: T;
}
