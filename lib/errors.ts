export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const NotFound = (entidad = 'Recurso') => new AppError(404, `${entidad} no encontrado`);
export const Forbidden = () => new AppError(403, 'No tienes permisos para realizar esta acción');
export const Unauthorized = () => new AppError(401, 'No autenticado');
