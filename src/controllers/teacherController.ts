import { Request, Response } from 'express';
import Teacher from '../models/Teacher';
import User from '../models/User';
import Tenant from '../models/Tenant';
import { sendSuccess, sendError } from '../utils/response';
import mongoose from 'mongoose';
import { unflatten } from '../utils/objectUtils';


const generateEmployeeId = async (tenantId: string): Promise<string> => {
  const count = await Teacher.countDocuments({ tenantId });
  const year = new Date().getFullYear();
  return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const getTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, designation, gender, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, any> = {};
    if (req.user?.role !== 'saas_admin') {
      filter.tenantId = req.tenantId;
    } else if (req.query['tenantId']) {
      filter.tenantId = req.query['tenantId'];
    }
    if (status) filter['status'] = status;
    if (designation) filter['designation'] = { $regex: designation, $options: 'i' };
    if (gender) filter['gender'] = gender;
    if (search) {
      filter['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [teachers, total] = await Promise.all([
      Teacher.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Teacher.countDocuments(filter),
    ]);

    sendSuccess(res, { teachers, total, page: parseInt(page), limit: parseInt(limit) }, 'Teachers fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch teachers', 500, err);
  }
};

export const createTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawData = req.body as Record<string, unknown>;
    const data = unflatten(rawData);

    const tenantId = req.tenantId!;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) { sendError(res, 'Tenant not found', 404); return; }

    const employeeId = await generateEmployeeId(tenantId);

    const userPassword = data['password'] as string || employeeId;
    const username = `${employeeId}_${tenant.schoolCode}`;

    const user = await User.create({
      tenantId,
      name: data['name'] as string,
      email: data['email'] as string,
      username,
      password: userPassword,
      role: 'teacher' as const,
      phone: (data['phone'] as string) || '',
    });

    const photoUrl = (req.file as unknown as { path: string } | undefined)?.path || '';

    const teacher = await Teacher.create({
      ...data,
      tenantId,
      userId: (user as mongoose.Document & { _id: mongoose.Types.ObjectId })._id,
      employeeId,
      photo: photoUrl,
    });

    sendSuccess(res, { teacher, username, tempPassword: userPassword }, 'Teacher created', 201);
  } catch (err) {
    sendError(res, 'Failed to create teacher', 500, err);
  }
};

export const getTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params['id'], tenantId: req.tenantId })
      .populate('subjectIds', 'name code')
      .populate('classIds', 'name')
      .populate('userId', 'email');
    if (!teacher) { sendError(res, 'Teacher not found', 404); return; }
    sendSuccess(res, teacher, 'Teacher fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch teacher', 500, err);
  }
};

export const updateTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawData = req.body as Record<string, unknown>;
    const data = unflatten(rawData);

    if (req.file) data['photo'] = (req.file as unknown as { path: string }).path;

    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      data,
      { new: true, runValidators: true }
    ).populate('subjectIds', 'name code').populate('classIds', 'name');
    if (!teacher) { sendError(res, 'Teacher not found', 404); return; }
    sendSuccess(res, teacher, 'Teacher updated');
  } catch (err) {
    sendError(res, 'Failed to update teacher', 500, err);
  }
};

export const deleteTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findOneAndDelete({ _id: req.params['id'], tenantId: req.tenantId });
    if (!teacher) { sendError(res, 'Teacher not found', 404); return; }
    if (teacher.userId) await User.findByIdAndDelete(teacher.userId);
    sendSuccess(res, null, 'Teacher deleted');
  } catch (err) {
    sendError(res, 'Failed to delete teacher', 500, err);
  }
};

export const getMyTeacherProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user?._id })
      .populate('subjectIds', 'name code')
      .populate('classIds', 'name');
    if (!teacher) { sendError(res, 'Teacher profile not found', 404); return; }
    sendSuccess(res, teacher, 'Profile fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch profile', 500, err);
  }
};

export const updateTeacherStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: string };
    const valid = ['active', 'inactive'];
    if (!valid.includes(status)) { sendError(res, 'Invalid status value', 400); return; }

    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      { status },
      { new: true }
    );
    if (!teacher) { sendError(res, 'Teacher not found', 404); return; }

    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, { isActive: status === 'active' });
    }

    sendSuccess(res, teacher, `Teacher marked as ${status}`);
  } catch (err) {
    sendError(res, 'Failed to update teacher status', 500, err);
  }
};

export const updateTeacherPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body as { password?: string };
    if (!password) { sendError(res, 'New password is required', 400); return; }

    const teacher = await Teacher.findOne({ _id: req.params['id'], tenantId: req.tenantId });
    if (!teacher) { sendError(res, 'Teacher not found', 404); return; }

    const user = await User.findById(teacher.userId);
    if (!user) { sendError(res, 'User associated with teacher not found', 404); return; }

    user.password = password;
    await user.save();

    sendSuccess(res, null, 'Teacher password updated successfully');
  } catch (err) {
    sendError(res, 'Failed to update teacher password', 500, err);
  }
};
