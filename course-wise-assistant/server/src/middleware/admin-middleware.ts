import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

// Admin verification middleware
// TODO: Update this when user roles are implemented in the database
// Currently uses a simple check - replace with proper role-based verification
export const verifyAdmin = asyncHandler(
  async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json(new ApiResponse(401, null, 'User not authenticated'));
      }

      // TODO: Replace with actual role check from database
      // For now, we'll allow all authenticated users (development mode)
      // In production, check: if (user.role !== 'admin')
      
      // Placeholder admin check - remove this in production
      // const isAdmin = user.role === 'admin' || user.email?.includes('admin');
      // if (!isAdmin) {
      //   return res
      //     .status(403)
      //     .json(new ApiResponse(403, null, 'Admin access required'));
      // }

      next();
    } catch (error) {
      console.error('Admin verification error:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
