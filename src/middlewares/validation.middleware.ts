import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ApiResponse } from '../utils/response.utils';

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void | Response => {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                return ApiResponse.error(
                    res, 
                    'Request body is empty or invalid. Make sure Content-Type header is set to application/json', 
                    400,
                    [{
                        path: 'body',
                        message: 'Request body is required'
                    }]
                );
            }

            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));
                return ApiResponse.error(res, 'Validation failed', 400, errors);
            }
            return ApiResponse.error(res, 'Validation failed', 400);
        }
    };
};

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const strongPasswordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
        passwordStrengthRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    );

export const basicPasswordSchema = z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password must not exceed 128 characters');

export const emailSchema = z
    .string()
    .email('Invalid email format')
    .min(3, 'Email must be at least 3 characters')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()
    .trim();

export const registerSchema = z.object({
    email: emailSchema,
    password: strongPasswordSchema,
});

export const registerSchemaBasic = z.object({
    email: emailSchema,
    password: basicPasswordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateRoleSchema = z.object({
    role: z.enum(['user', 'admin']).refine((val) => ['user', 'admin'].includes(val), {
        message: 'Role must be either "user" or "admin"',
    }),
});

export const updateProfileSchema = z.object({
    email: emailSchema.optional(),
    currentPassword: z.string().min(1, 'Current password is required').optional(),
    newPassword: strongPasswordSchema.optional(),
}).refine(
    (data) => {
        if (data.newPassword && !data.currentPassword) {
            return false;
        }
        return true;
    },
    {
        message: 'Current password is required when changing password',
        path: ['currentPassword'],
    }
);
