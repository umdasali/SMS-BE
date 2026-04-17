import { Request, Response } from 'express';
import Class from '../models/Class';
import Subject from '../models/Subject';
import { sendSuccess, sendError } from '../utils/response';

export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { academicYear, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.tenantId };
    if (academicYear) filter['academicYear'] = academicYear;
    if (search) filter['name'] = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [classes, total] = await Promise.all([
      Class.find(filter).skip(skip).limit(parseInt(limit)).sort({ name: 1 }),
      Class.countDocuments(filter),
    ]);

    sendSuccess(res, { classes, total, page: parseInt(page), limit: parseInt(limit) }, 'Classes fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch classes', 500, err);
  }
};

export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const cls = await Class.create({ ...req.body, tenantId: req.tenantId });
    sendSuccess(res, cls, 'Class created', 201);
  } catch (err) {
    sendError(res, 'Failed to create class', 500, err);
  }
};

export const getClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const cls = await Class.findOne({ _id: req.params['id'], tenantId: req.tenantId });
    if (!cls) { sendError(res, 'Class not found', 404); return; }
    sendSuccess(res, cls, 'Class fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch class', 500, err);
  }
};

export const updateClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const cls = await Class.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!cls) { sendError(res, 'Class not found', 404); return; }
    sendSuccess(res, cls, 'Class updated');
  } catch (err) {
    sendError(res, 'Failed to update class', 500, err);
  }
};

export const deleteClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const cls = await Class.findOneAndDelete({ _id: req.params['id'], tenantId: req.tenantId });
    if (!cls) { sendError(res, 'Class not found', 404); return; }
    sendSuccess(res, null, 'Class deleted');
  } catch (err) {
    sendError(res, 'Failed to delete class', 500, err);
  }
};

// Subjects
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.tenantId };
    if (classId) filter['classId'] = classId;
    
    if (search) {
      filter['$or'] = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [subjects, total] = await Promise.all([
      Subject.find(filter).populate('classId', 'name').populate('teacherId', 'name').skip(skip).limit(parseInt(limit)).sort({ name: 1 }),
      Subject.countDocuments(filter),
    ]);

    sendSuccess(res, { subjects, total, page: parseInt(page), limit: parseInt(limit) }, 'Subjects fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch subjects', 500, err);
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.create({ ...req.body, tenantId: req.tenantId });
    sendSuccess(res, subject, 'Subject created', 201);
  } catch (err) {
    sendError(res, 'Failed to create subject', 500, err);
  }
};

export const updateSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) { sendError(res, 'Subject not found', 404); return; }
    sendSuccess(res, subject, 'Subject updated');
  } catch (err) {
    sendError(res, 'Failed to update subject', 500, err);
  }
};

export const getSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findOne({ _id: req.params['id'], tenantId: req.tenantId })
      .populate('classId', 'name')
      .populate('teacherId', 'name');
    if (!subject) { sendError(res, 'Subject not found', 404); return; }
    sendSuccess(res, subject, 'Subject fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch subject', 500, err);
  }
};

export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params['id'], tenantId: req.tenantId });
    if (!subject) { sendError(res, 'Subject not found', 404); return; }
    sendSuccess(res, null, 'Subject deleted');
  } catch (err) {
    sendError(res, 'Failed to delete subject', 500, err);
  }
};
