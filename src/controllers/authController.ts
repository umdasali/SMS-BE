import crypto from 'crypto';
import { Request, Response } from 'express';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { sendPasswordResetEmail } from '../utils/mailer';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: identifier, password } = req.body as { email: string; password: string };

    if (!identifier || !password) {
      sendError(res, 'Username/Email and password are required', 400);
      return;
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    }).select('+password +refreshToken');

    if (!user || !(await user.comparePassword(password))) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account is deactivated. Contact admin.', 403);
      return;
    }

    const payload = { id: user._id.toString(), role: user.role, tenantId: user.tenantId?.toString() };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    sendSuccess(res, { user, accessToken }, 'Login successful');
  } catch (err) {
    sendError(res, 'Login failed', 500, err);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.cookies?.refreshToken || req.body?.refreshToken) as string;

    if (!token) {
      sendError(res, 'No refresh token', 401);
      return;
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      sendError(res, 'Invalid refresh token', 401);
      return;
    }

    const payload = { id: user._id.toString(), role: user.role, tenantId: user.tenantId?.toString() };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch {
    sendError(res, 'Invalid or expired refresh token', 401);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: '' });
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    sendError(res, 'Logout failed', 500, err);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    sendSuccess(res, req.user, 'User profile fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch profile', 500, err);
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    if (!email) { sendError(res, 'Email is required', 400); return; }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond with success to avoid email enumeration
    if (!user) { sendSuccess(res, null, 'If that email exists, a reset link has been sent'); return; }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      sendError(res, 'Failed to send reset email. Try again later.', 500);
      return;
    }

    sendSuccess(res, null, 'If that email exists, a reset link has been sent');
  } catch (err) {
    sendError(res, 'Failed to process request', 500, err);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    if (!token || !password) { sendError(res, 'Token and new password are required', 400); return; }
    if (password.length < 6) { sendError(res, 'Password must be at least 6 characters', 400); return; }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) { sendError(res, 'Invalid or expired reset token', 400); return; }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = '';
    await user.save();

    sendSuccess(res, null, 'Password reset successful. Please log in.');
  } catch (err) {
    sendError(res, 'Failed to reset password', 500, err);
  }
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, avatar } = req.body as { name: string; phone: string; avatar: string };
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    sendSuccess(res, user, 'Profile updated');
  } catch (err) {
    sendError(res, 'Failed to update profile', 500, err);
  }
};
