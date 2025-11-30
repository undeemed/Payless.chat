import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Handle Supabase errors
  if ('code' in err && typeof (err as { code: unknown }).code === 'string') {
    const supabaseError = err as { code: string; message: string };
    res.status(400).json({
      error: supabaseError.message,
      code: supabaseError.code,
    });
    return;
  }

  // Generic error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

