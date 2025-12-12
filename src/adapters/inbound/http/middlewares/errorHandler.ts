import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
