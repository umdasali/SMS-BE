import { Request, Response } from 'express';
import Exam from '../models/Exam';
import Mark from '../models/Mark';
import Student from '../models/Student';
import Subject from '../models/Subject';
import Teacher from '../models/Teacher';
import { sendSuccess, sendError } from '../utils/response';

async function getTeacherProfile(tenantId: string, userId: string) {
  return Teacher.findOne({ tenantId, userId }).select('classIds subjectIds').lean();
}

export const getExams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, academicYear, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.tenantId };
    if (classId) filter['classId'] = classId;
    if (academicYear) filter['academicYear'] = academicYear;
    if (search) filter['name'] = { $regex: search, $options: 'i' };

    if (req.user?.role === 'teacher') {
      const teacher = await getTeacherProfile(req.tenantId!, req.user._id.toString());
      if (!teacher) { sendError(res, 'Teacher profile not found', 404); return; }
      filter['classId'] = { $in: teacher.classIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [exams, total] = await Promise.all([
      Exam.find(filter).populate('classId', 'name').skip(skip).limit(parseInt(limit)).sort({ startDate: -1 }),
      Exam.countDocuments(filter)
    ]);
    sendSuccess(res, { exams, total, page: parseInt(page), limit: parseInt(limit) }, 'Exams fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch exams', 500, err);
  }
};

export const createExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await Exam.create({ ...req.body, tenantId: req.tenantId });
    sendSuccess(res, exam, 'Exam created', 201);
  } catch (err) {
    sendError(res, 'Failed to create exam', 500, err);
  }
};

export const updateExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      req.body, { new: true, runValidators: true }
    );
    if (!exam) { sendError(res, 'Exam not found', 404); return; }
    sendSuccess(res, exam, 'Exam updated');
  } catch (err) {
    sendError(res, 'Failed to update exam', 500, err);
  }
};

export const deleteExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params['id'], tenantId: req.tenantId });
    if (!exam) { sendError(res, 'Exam not found', 404); return; }
    sendSuccess(res, null, 'Exam deleted');
  } catch (err) {
    sendError(res, 'Failed to delete exam', 500, err);
  }
};

// Marks
export const bulkSaveMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examId, marks } = req.body as {
      examId: string;
      marks: Array<{ studentId: string; subjectId: string; obtained: number; total: number; remarks?: string }>;
    };

    if (req.user?.role === 'teacher') {
      const [teacher, exam] = await Promise.all([
        getTeacherProfile(req.tenantId!, req.user._id.toString()),
        Exam.findOne({ _id: examId, tenantId: req.tenantId }).select('classId').lean(),
      ]);
      if (!teacher) { sendError(res, 'Teacher profile not found', 404); return; }
      if (!exam) { sendError(res, 'Exam not found', 404); return; }

      const allowedClasses = teacher.classIds.map(id => id.toString());
      if (!allowedClasses.includes(exam.classId.toString())) {
        sendError(res, 'You are not assigned to this exam\'s class', 403); return;
      }

      const allowedSubjects = new Set(teacher.subjectIds.map(id => id.toString()));
      const unauthorizedSubject = marks.find(m => !allowedSubjects.has(m.subjectId));
      if (unauthorizedSubject) {
        sendError(res, 'You are not assigned to enter marks for one or more subjects', 403); return;
      }
    }

    const ops = marks.map((m) => ({
      updateOne: {
        filter: { tenantId: req.tenantId, examId, studentId: m.studentId, subjectId: m.subjectId },
        update: { ...m, tenantId: req.tenantId, examId, enteredBy: req.user?._id },
        upsert: true,
      },
    }));

    await Mark.bulkWrite(ops);
    sendSuccess(res, null, 'Marks saved');
  } catch (err) {
    sendError(res, 'Failed to save marks', 500, err);
  }
};

export const getStudentMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examId, academicYear } = req.query as Record<string, string>;
    const studentId = req.params['id'];

    const filter: Record<string, unknown> = { tenantId: req.tenantId, studentId };
    if (examId) filter['examId'] = examId;

    const marks = await Mark.find(filter)
      .populate('examId', 'name type academicYear term')
      .populate('subjectId', 'name code fullMarks passMarks');

    // Group by exam
    const byExam = marks.reduce((acc: Record<string, unknown[]>, mark) => {
      const eid = mark.examId._id.toString();
      if (!acc[eid]) acc[eid] = [];
      acc[eid]!.push(mark);
      return acc;
    }, {});

    sendSuccess(res, { marks, byExam }, 'Student marks fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch marks', 500, err);
  }
};

export const getExamMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const marks = await Mark.find({ tenantId: req.tenantId, examId: req.params['id'] })
      .populate('studentId', 'name admissionNo rollNo')
      .populate('subjectId', 'name code');
    sendSuccess(res, marks, 'Exam marks fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch exam marks', 500, err);
  }
};

export const getExamMarksByQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { examId } = req.query as Record<string, string>;
    if (!examId) { sendError(res, 'examId query param is required', 400); return; }
    const marks = await Mark.find({ tenantId: req.tenantId, examId })
      .populate('studentId', 'name admissionNo rollNo')
      .populate('subjectId', 'name code');
    sendSuccess(res, marks, 'Exam marks fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch exam marks', 500, err);
  }
};
