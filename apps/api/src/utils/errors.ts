export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const NotFound      = (msg = "Tidak ditemukan")           => new AppError(msg, 404);
export const Unauthorized  = (msg = "Tidak terautentikasi")      => new AppError(msg, 401);
export const Forbidden     = (msg = "Akses ditolak")             => new AppError(msg, 403);
export const Conflict      = (msg = "Data sudah ada")            => new AppError(msg, 409);
export const BadRequest    = (msg = "Request tidak valid")       => new AppError(msg, 400);
