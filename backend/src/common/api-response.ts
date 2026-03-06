export class ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta: { timestamp: string; version: string };

  static ok<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: { timestamp: new Date().toISOString(), version: '1.0' },
    };
  }

  static error(code: string, message: string): ApiResponse<null> {
    return {
      success: false,
      error: { code, message },
      meta: { timestamp: new Date().toISOString(), version: '1.0' },
    };
  }
}
