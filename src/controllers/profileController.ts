import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

// GET /profile/me
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('-password -refreshToken');
    if (!user) { sendError(res, 'User not found', 404); return; }
    sendSuccess(res, user);
  } catch (err) {
    sendError(res, 'Server error', 500);
  }
};

// PUT /profile/me
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates: Partial<IUser> = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.file) {
      const file = req.file as Express.Multer.File & { path: string };
      updates.avatar = file.path;
    }
    const user = await User.findByIdAndUpdate(req.user!._id, updates, { new: true }).select('-password -refreshToken');
    if (!user) { sendError(res, 'User not found', 404); return; }
    sendSuccess(res, user, 'Profile updated');
  } catch (err) {
    sendError(res, 'Server error', 500);
  }
};

// PUT /profile/me/password
export const changeMyPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) { sendError(res, 'Current and new password required', 400); return; }
    if (newPassword.length < 8) { sendError(res, 'Password must be at least 8 characters', 400); return; }

    const user = await User.findById(req.user!._id);
    if (!user) { sendError(res, 'User not found', 404); return; }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) { sendError(res, 'Current password is incorrect', 401); return; }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    sendSuccess(res, {}, 'Password changed successfully');
  } catch (err) {
    sendError(res, 'Server error', 500);
  }
};
