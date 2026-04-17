import { Request, Response } from 'express';
import Tenant from '../models/Tenant';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export const checkSchoolCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params as { code: string };
    const exists = await Tenant.findOne({ schoolCode: code.toLowerCase() });
    sendSuccess(res, { available: !exists }, exists ? 'Code already taken' : 'Code available');
  } catch (err) {
    sendError(res, 'Failed to check code', 500, err);
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      // Institution details
      institutionName, type, address, city, state, country, phone, email, schoolCode,
      // Admin account
      adminName, adminEmail, adminPassword,
      // Branding
      primaryColor,
    } = req.body as {
      institutionName: string; type: string; address: string; city: string;
      state: string; country: string; phone: string; email: string; schoolCode: string;
      adminName: string; adminEmail: string; adminPassword: string;
      primaryColor: string;
    };

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const logo = files?.['logo']?.[0] ? (files['logo'][0] as unknown as { path: string }).path : '';
    const favicon = files?.['favicon']?.[0] ? (files['favicon'][0] as unknown as { path: string }).path : '';

    // Check if school code exists
    const codeExists = await Tenant.findOne({ schoolCode: schoolCode.toLowerCase() });
    if (codeExists) {
      sendError(res, 'School code already taken', 400);
      return;
    }

    // Check if admin email exists
    const emailExists = await User.findOne({ email: adminEmail.toLowerCase() });
    if (emailExists) {
      sendError(res, 'Admin email already registered', 400);
      return;
    }

    // Create tenant
    const tenant = await Tenant.create({
      name: institutionName,
      type,
      address,
      city,
      state,
      country: country || 'India',
      phone,
      email,
      schoolCode: schoolCode.toLowerCase(),
      branding: {
        primaryColor: primaryColor || 'blue',
        logo: logo || '',
        favicon: favicon || '',
        schoolName: institutionName,
        marksheetTemplate: (req.body as any).marksheetTemplate || 'standard',
        certificateTemplate: (req.body as any).certificateTemplate || 'classic',
      },
    });

    // Create management user
    const user = await User.create({
      tenantId: tenant._id,
      name: adminName,
      email: adminEmail.toLowerCase(),
      username: adminEmail.toLowerCase(),
      password: adminPassword,
      role: 'management',
    });

    const payload = { id: user._id.toString(), role: user.role, tenantId: tenant._id.toString() };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    sendSuccess(res, { tenant, user, accessToken }, 'Institution registered successfully', 201);
  } catch (err) {
    sendError(res, 'Registration failed', 500, err);
  }
};
