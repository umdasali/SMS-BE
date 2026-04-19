import { Request, Response } from 'express';
import Tenant from '../models/Tenant';
import { sendSuccess, sendError } from '../utils/response';

export const getAllTenants = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    sendSuccess(res, tenants, 'Tenants fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch tenants', 500, err);
  }
};

export const getTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await Tenant.findById(req.params['id']);
    if (!tenant) { sendError(res, 'Tenant not found', 404); return; }
    sendSuccess(res, tenant, 'Tenant fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch tenant', 500, err);
  }
};

export const updateTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params['id'], req.body, {
      new: true, runValidators: true,
    });
    if (!tenant) { sendError(res, 'Tenant not found', 404); return; }
    sendSuccess(res, tenant, 'Tenant updated');
  } catch (err) {
    sendError(res, 'Failed to update tenant', 500, err);
  }
};

export const updateBranding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { primaryColor, schoolName, marksheetTemplate, certificateTemplate } = req.body as any;
    const tenantId = req.params['id'] || req.tenantId;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) { sendError(res, 'Tenant not found', 404); return; }

    if (primaryColor) tenant.branding.primaryColor = primaryColor as any;
    if (schoolName) tenant.branding.schoolName = schoolName;
    if (marksheetTemplate) tenant.branding.marksheetTemplate = marksheetTemplate;
    if (certificateTemplate) tenant.branding.certificateTemplate = certificateTemplate;

    tenant.markModified('branding');

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.['logo']?.[0]) {
      tenant.branding.logo = (files['logo'][0] as unknown as { path: string }).path;
    }
    if (files?.['favicon']?.[0]) {
      tenant.branding.favicon = (files['favicon'][0] as unknown as { path: string }).path;
    }

    await tenant.save();
    sendSuccess(res, tenant, 'Branding updated');
  } catch (err) {
    sendError(res, 'Failed to update branding', 500, err);
  }
};

export const deleteTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params['id']);
    if (!tenant) { sendError(res, 'Tenant not found', 404); return; }
    sendSuccess(res, null, 'Tenant deleted');
  } catch (err) {
    sendError(res, 'Failed to delete tenant', 500, err);
  }
};

export const getMyTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) { sendError(res, 'Tenant not found', 404); return; }
    sendSuccess(res, tenant, 'Tenant fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch tenant', 500, err);
  }
};

export const getTenantStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params['id'];
    const [
      Student, Teacher, Class, Exam, FeeSlip,
    ] = await Promise.all([
      import('../models/Student').then(m => m.default),
      import('../models/Teacher').then(m => m.default),
      import('../models/Class').then(m => m.default),
      import('../models/Exam').then(m => m.default),
      import('../models/FeeSlip').then(m => m.default),
    ]);
    const [students, teachers, classes, exams, feeSlips] = await Promise.all([
      Student.countDocuments({ tenantId, status: 'active' }),
      Teacher.countDocuments({ tenantId, status: 'active' }),
      Class.countDocuments({ tenantId }),
      Exam.countDocuments({ tenantId }),
      FeeSlip.find({ tenantId, status: 'paid' }).lean(),
    ]);
    const totalFeesCollected = (feeSlips as { netAmount: number }[]).reduce((s, f) => s + (f.netAmount || 0), 0);
    sendSuccess(res, { students, teachers, classes, exams, totalFeesCollected }, 'Tenant stats fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch tenant stats', 500, err);
  }
};

/**
 * SaaS admin–only: update subscription plan, status, expiry, pricing, and notes.
 * Activating resets lastPaymentDate to now.
 */
export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await Tenant.findById(req.params['id']);
    if (!tenant) { sendError(res, 'Tenant not found', 404); return; }

    const {
      plan, status, expiresAt, pricePerStudent, notes,
    } = req.body as {
      plan?: 'free' | 'basic' | 'pro' | 'enterprise';
      status?: 'active' | 'suspended' | 'expired';
      expiresAt?: string;
      pricePerStudent?: number;
      notes?: string;
    };

    if (plan) tenant.subscription.plan = plan;
    if (status) {
      tenant.subscription.status = status;
      // Restore institution access when admin explicitly activates
      if (status === 'active') {
        tenant.subscription.lastPaymentDate = new Date();
        if (tenant.status === 'inactive') tenant.status = 'active';
      }
    }
    if (expiresAt) tenant.subscription.expiresAt = new Date(expiresAt);
    if (pricePerStudent !== undefined) tenant.subscription.pricePerStudent = pricePerStudent;
    if (notes !== undefined) tenant.subscription.notes = notes;

    tenant.markModified('subscription');
    await tenant.save();
    sendSuccess(res, tenant, 'Subscription updated');
  } catch (err) {
    sendError(res, 'Failed to update subscription', 500, err);
  }
};
