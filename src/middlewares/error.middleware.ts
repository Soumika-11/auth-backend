import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response.utils';
import config from '../config';

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public details?: any;

    constructor(message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    if (config.NODE_ENV === 'development') {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        });
    } else {
        console.error('Error:', {
            message: err.message,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString(),
        });
    }

    if (err instanceof AppError && err.isOperational) {
        return ApiResponse.error(res, err.message, err.statusCode, err.details);
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e: any) => ({
            path: e.path,
            message: e.message,
        }));
        return ApiResponse.error(res, 'Validation failed', 400, errors);
    }

    if (err.code === 11000) {
        return ApiResponse.error(res, 'A resource with this information already exists', 409);
    }

    if (err.name === 'CastError') {
        return ApiResponse.error(res, 'Invalid resource ID format', 400);
    }

    if (err.name === 'JsonWebTokenError') {
        return ApiResponse.error(res, 'Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        return ApiResponse.error(res, 'Token has expired', 401);
    }

    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        return ApiResponse.error(res, 'Database operation failed', 503);
    }

    const statusCode = err.statusCode || 500;
    const message = config.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : (err.message || 'Internal Server Error');

    return ApiResponse.error(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response): Response => {
    return ApiResponse.error(res, `Route ${req.originalUrl} not found`, 404);
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
