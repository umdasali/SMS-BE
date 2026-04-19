import { Request, Response } from 'express';
import Student from '../models/Student';
import User, { IUser } from '../models/User';
import Tenant from '../models/Tenant';
import { sendSuccess, sendError } from '../utils/response';
import mongoose from 'mongoose';
import { unflatten } from '../utils/objectUtils';


const generateAdmissionNo = async (tenantId: string): Promise<string> => {
  const count = await Student.countDocuments({ tenantId });
  const year = new Date().getFullYear();
  return `ADM-${year}-${String(count + 1).padStart(4, '0')}`;
};



export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, any> = {};
    if (req.user?.role !== 'saas_admin') {
      filter.tenantId = req.tenantId;
    } else if (req.query['tenantId']) {
      // Allow saas_admin to filter by a specific tenantId
      filter.tenantId = req.query['tenantId'];
    }
    if (classId) filter['classId'] = classId;
    if (status) filter['status'] = status;
    if (search) filter['name'] = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([
      Student.find(filter).populate('classId', 'name').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Student.countDocuments(filter),
    ]);

    sendSuccess(res, { students, total, page: parseInt(page), limit: parseInt(limit) }, 'Students fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch students', 500, err);
  }
};

export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawData = req.body as Record<string, unknown>;
    const data = unflatten(rawData);
    const tenantId = req.tenantId!;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) { sendError(res, 'Tenant not found', 404); return; }

    const admissionNo = await generateAdmissionNo(tenantId);

    // Create user account for student
    const userEmail = (data['email'] as string) || `${admissionNo.toLowerCase().replace(/-/g, '.')}@student.local`;
    const userPassword = (data['password'] as string) || admissionNo;
    const username = `${admissionNo}_${tenant.schoolCode}`;

    const user = await User.create({
      tenantId,
      name: data['name'] as string,
      email: userEmail,
      username,
      password: userPassword,
      role: 'student' as const,
    });

    const photoUrl = (req.file as unknown as { path: string } | undefined)?.path || '';

    const student = await Student.create({
      ...data,
      tenantId,
      userId: (user as IUser & { _id: mongoose.Types.ObjectId })._id,
      admissionNo,
      photo: photoUrl,
    });

    sendSuccess(res, { student, userEmail, username, tempPassword: userPassword }, 'Student created', 201);
  } catch (err) {
    sendError(res, 'Failed to create student', 500, err);
  }
};

export const getStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findOne({ _id: req.params['id'], tenantId: req.tenantId })
      .populate('classId', 'name sections')
      .populate('userId', 'email');
    if (!student) { sendError(res, 'Student not found', 404); return; }
    sendSuccess(res, student, 'Student fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch student', 500, err);
  }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawData = req.body as Record<string, unknown>;
    const data = unflatten(rawData);
    if (req.file) data['photo'] = (req.file as unknown as { path: string }).path;

    const student = await Student.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      data,
      { new: true, runValidators: true }
    ).populate('classId', 'name sections');
    if (!student) { sendError(res, 'Student not found', 404); return; }
    sendSuccess(res, student, 'Student updated');
  } catch (err) {
    sendError(res, 'Failed to update student', 500, err);
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params['id'], tenantId: req.tenantId });
    if (!student) { sendError(res, 'Student not found', 404); return; }
    if (student.userId) await User.findByIdAndDelete(student.userId);
    sendSuccess(res, null, 'Student deleted');
  } catch (err) {
    sendError(res, 'Failed to delete student', 500, err);
  }
};

export const getMyStudentProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findOne({ userId: req.user?._id })
      .populate('classId', 'name sections');
    if (!student) { sendError(res, 'Student profile not found', 404); return; }
    sendSuccess(res, student, 'Profile fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch profile', 500, err);
  }
};

export const updateStudentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: string };
    const valid = ['active', 'inactive', 'graduated', 'transferred'];
    if (!valid.includes(status)) { sendError(res, 'Invalid status value', 400); return; }

    const student = await Student.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      { status },
      { new: true }
    );
    if (!student) { sendError(res, 'Student not found', 404); return; }

    if (student.userId) {
      await User.findByIdAndUpdate(student.userId, { isActive: status === 'active' });
    }

    sendSuccess(res, student, `Student marked as ${status}`);
  } catch (err) {
    sendError(res, 'Failed to update student status', 500, err);
  }
};

export const updateStudentPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body as { password?: string };
    if (!password) { sendError(res, 'New password is required', 400); return; }

    const student = await Student.findOne({ _id: req.params['id'], tenantId: req.tenantId });
    if (!student) { sendError(res, 'Student not found', 404); return; }

    const user = await User.findById(student.userId);
    if (!user) { sendError(res, 'User associated with student not found', 404); return; }

    user.password = password;
    await user.save();

    sendSuccess(res, null, 'Student password updated successfully');
  } catch (err) {
    sendError(res, 'Failed to update student password', 500, err);
  }
};
