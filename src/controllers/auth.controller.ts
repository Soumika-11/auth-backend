import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { ApiResponse } from '../utils/response.utils';
import { AuthRequest } from '../types/auth.types';
import config from '../config';
import { AppError, asyncHandler } from '../middlewares/error.middleware';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const { email, password } = req.body;

    const { user, tokens } = await authService.register(email, password);

    res.cookie(config.COOKIE.REFRESH_TOKEN_NAME, tokens.refreshToken, {
      httpOnly: config.COOKIE.HTTP_ONLY,
      secure: config.COOKIE.SECURE,
      sameSite: config.COOKIE.SAME_SITE as 'strict' | 'lax' | 'none',
      maxAge: config.COOKIE.MAX_AGE,
    });

    return ApiResponse.success(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      },
      'User registered successfully',
      201
    );
  });

  login = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const { email, password } = req.body;

    const { user, tokens } = await authService.login(email, password);

    res.cookie(config.COOKIE.REFRESH_TOKEN_NAME, tokens.refreshToken, {
      httpOnly: config.COOKIE.HTTP_ONLY,
      secure: config.COOKIE.SECURE,
      sameSite: config.COOKIE.SAME_SITE as 'strict' | 'lax' | 'none',
      maxAge: config.COOKIE.MAX_AGE,
    });

    return ApiResponse.success(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      },
      'Login successful'
    );
  });

  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const refreshToken = req.cookies[config.COOKIE.REFRESH_TOKEN_NAME] || req.body.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const tokens = await authService.refreshAccessToken(refreshToken);

    res.cookie(config.COOKIE.REFRESH_TOKEN_NAME, tokens.refreshToken, {
      httpOnly: config.COOKIE.HTTP_ONLY,
      secure: config.COOKIE.SECURE,
      sameSite: config.COOKIE.SAME_SITE as 'strict' | 'lax' | 'none',
      maxAge: config.COOKIE.MAX_AGE,
    });

    return ApiResponse.success(
      res,
      { 
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'Token refreshed successfully'
    );
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const refreshToken = req.cookies[config.COOKIE.REFRESH_TOKEN_NAME] || req.body.refreshToken;
    const userId = req.user?._id;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    await authService.logout(userId.toString(), refreshToken);

    res.clearCookie(config.COOKIE.REFRESH_TOKEN_NAME, {
      httpOnly: config.COOKIE.HTTP_ONLY,
      secure: config.COOKIE.SECURE,
      sameSite: config.COOKIE.SAME_SITE as 'strict' | 'lax' | 'none',
    });

    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  logoutAll = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    await authService.logoutAll(userId.toString());

    res.clearCookie(config.COOKIE.REFRESH_TOKEN_NAME, {
      httpOnly: config.COOKIE.HTTP_ONLY,
      secure: config.COOKIE.SECURE,
      sameSite: config.COOKIE.SAME_SITE as 'strict' | 'lax' | 'none',
    });

    return ApiResponse.success(res, null, 'Logged out from all devices successfully');
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response> => {
    const user = req.user;

    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    return ApiResponse.success(res, {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  });
}

export default new AuthController();
