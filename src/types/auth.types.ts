import { Request } from 'express';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
    user?: IUser;
}

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface RegisterDTO {
    email: string;
    password: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface RefreshTokenDTO {
    refreshToken: string;
}
