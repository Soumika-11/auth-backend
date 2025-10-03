import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import User from '../models/User';
import { ApiResponse } from '../utils/response.utils';
import { AuthRequest } from '../types/auth.types';

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void | Response> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.error(res, 'No token provided', 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const payload = verifyAccessToken(token);

        // Get user from database
        const user = await User.findById(payload.userId);
        if (!user) {
            return ApiResponse.error(res, 'User not found', 401);
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error: any) {
        return ApiResponse.error(res, 'Invalid or expired token', 401);
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
        if (!req.user) {
            return ApiResponse.error(res, 'Unauthorized', 401);
        }

        if (!roles.includes(req.user.role)) {
            return ApiResponse.error(res, 'Forbidden: Insufficient permissions', 403);
        }

        next();
    };
};
