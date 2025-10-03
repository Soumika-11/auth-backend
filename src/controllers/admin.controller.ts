import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { ApiResponse } from '../utils/response.utils';
import User from '../models/User';

class AdminController {
    async getAllUsers(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const users = await User.find().select('-password -refreshTokens');
            
            return ApiResponse.success(res, {
                users,
                count: users.length,
            }, 'Users retrieved successfully');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    async getUserById(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { userId } = req.params;
            
            const user = await User.findById(userId).select('-password -refreshTokens');
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }

            return ApiResponse.success(res, { user }, 'User retrieved successfully');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    async updateUserRole(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            if (!['user', 'admin'].includes(role)) {
                return ApiResponse.error(res, 'Invalid role. Must be "user" or "admin"', 400);
            }

            const user = await User.findById(userId);
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }

            if ((user._id as any).toString() === ((req.user as { _id: string })?._id).toString() && role === 'user') {
                return ApiResponse.error(res, 'Cannot demote yourself', 403);
            }

            user.role = role;
            await user.save();

            return ApiResponse.success(
                res,
                { 
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                    }
                },
                'User role updated successfully'
            );
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    async deleteUser(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                return ApiResponse.error(res, 'User not found', 404);
            }

            if ((user._id as string).toString() === ((req.user as { _id: string })?._id).toString()) {
                return ApiResponse.error(res, 'Cannot delete yourself', 403);
            }

            await User.findByIdAndDelete(userId);

            return ApiResponse.success(
                res,
                { userId },
                'User deleted successfully'
            );
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }

    async getDashboardStats(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const totalUsers = await User.countDocuments();
            const totalAdmins = await User.countDocuments({ role: 'admin' });
            const totalRegularUsers = await User.countDocuments({ role: 'user' });
            const verifiedUsers = await User.countDocuments({ isVerified: true });

            const stats = {
                totalUsers,
                totalAdmins,
                totalRegularUsers,
                verifiedUsers,
                unverifiedUsers: totalUsers - verifiedUsers,
            };

            return ApiResponse.success(res, stats, 'Dashboard stats retrieved successfully');
        } catch (error: any) {
            return ApiResponse.error(res, error.message, 500);
        }
    }
}

export default new AdminController();
