import User, { IUser } from '../models/User';
import { AuthTokens, TokenPayload } from '../types/auth.types';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { AppError } from '../middlewares/error.middleware';

export class AuthService {
    async register(email: string, password: string): Promise<{ user: IUser; tokens: AuthTokens }> {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('Unable to complete registration. Please try again or contact support.', 400);
        }

        const user = new User({
            email,
            password,
            role: 'user',
            isVerified: false,
        });

        await user.save();

        const tokens = this.generateTokens(user);

        const userWithTokens = await User.findById(user._id).select('+refreshTokens');
        if (userWithTokens) {
            userWithTokens.refreshTokens.push(tokens.refreshToken);
            await userWithTokens.save();
        }

        return { user, tokens };
    }

    async login(email: string, password: string): Promise<{ user: IUser; tokens: AuthTokens }> {
        const user = await User.findOne({ email }).select('+password +refreshTokens');
        
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        const tokens = this.generateTokens(user);

        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        return { user, tokens };
    }

    async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
        try {
            const payload = verifyRefreshToken(refreshToken);

            const user = await User.findById(payload.userId).select('+refreshTokens');
            if (!user) {
                throw new AppError('Invalid or expired refresh token', 401);
            }

            if (!user.refreshTokens.includes(refreshToken)) {
                throw new AppError('Invalid or expired refresh token', 401);
            }

            user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);

            const tokens = this.generateTokens(user);

            user.refreshTokens.push(tokens.refreshToken);
            await user.save();

            return tokens;
        } catch (error) {
            throw new AppError('Invalid or expired refresh token', 401);
        }
    }

    async logout(userId: string, refreshToken: string): Promise<void> {
        const user = await User.findById(userId).select('+refreshTokens');
        if (!user) {
            throw new AppError('User not found', 404);
        }

        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        await user.save();
    }

    async logoutAll(userId: string): Promise<void> {
        const user = await User.findById(userId).select('+refreshTokens');
        if (!user) {
            throw new AppError('User not found', 404);
        }

        user.refreshTokens = [];
        await user.save();
    }

    private generateTokens(user: IUser & { _id: any }): AuthTokens {
        const payload: TokenPayload = {
            userId: (user._id as string).toString(),
            email: user.email,
            role: user.role,
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        return { accessToken, refreshToken };
    }
}

export default new AuthService();
