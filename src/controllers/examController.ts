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

function calculateGrade(obtained: number, total: number): string {
  const pct = (obtained / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
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

export const getExam = async (req: Request, res: Response): Promise<void> => {
  try {
    const exam = await Exam.findOne({ _id: req.params['id'], tenantId: req.tenantId })
      .populate('classId', 'name sections');
    if (!exam) { sendError(res, 'Exam not found', 404); return; }
    sendSuccess(res, exam, 'Exam fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch exam', 500, err);
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

    // bulkWrite bypasses Mongoose pre('save') hooks, so compute grade manually
    const ops = marks.map((m) => ({
      updateOne: {
        filter: { tenantId: req.tenantId, examId, studentId: m.studentId, subjectId: m.subjectId },
        update: {
          ...m,
          grade: calculateGrade(m.obtained, m.total),
          tenantId: req.tenantId,
          examId,
          enteredBy: req.user?._id,
        },
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
    const role = req.user?.role;

    if (role === 'student') {
      const student = await Student.findOne({ tenantId: req.tenantId, userId: req.user!._id })
        .select('_id').lean();
      if (!student || student._id.toString() !== studentId) {
        sendError(res, 'Access denied', 403); return;
      }
    } else if (role === 'teacher') {
      const [teacher, student] = await Promise.all([
        getTeacherProfile(req.tenantId!, req.user!._id.toString()),
        Student.findOne({ _id: studentId, tenantId: req.tenantId }).select('classId').lean(),
      ]);
      if (!teacher) { sendError(res, 'Teacher profile not found', 404); return; }
      if (!student) { sendError(res, 'Student not found', 404); return; }
      if (!teacher.classIds.map(id => id.toString()).includes(student.classId.toString())) {
        sendError(res, 'Access denied', 403); return;
      }
    }

    const filter: Record<string, unknown> = { tenantId: req.tenantId, studentId };
    if (examId) filter['examId'] = examId;

    // academicYear lives on Exam, so resolve exam IDs first
    if (academicYear) {
      const exams = await Exam.find({ tenantId: req.tenantId, academicYear }).select('_id').lean();
      filter['examId'] = { $in: exams.map(e => e._id) };
    }

    const marks = await Mark.find(filter)
      .populate({ path: 'examId', select: 'name type academicYear term classId', populate: { path: 'classId', select: 'name' } })
      .populate('subjectId', 'name code fullMarks passMarks');

    // Skip marks whose exam or subject was deleted (populate returns null for broken refs)
    const validMarks = marks.filter((m) => m.examId != null && m.subjectId != null);

    const byExam = validMarks.reduce((acc: Record<string, unknown[]>, mark) => {
      const eid = (mark.examId as { _id: { toString(): string } })._id.toString();
      if (!acc[eid]) acc[eid] = [];
      acc[eid]!.push(mark);
      return acc;
    }, {});

    sendSuccess(res, { marks: validMarks, byExam }, 'Student marks fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch marks', 500, err);
  }
};

export const getExamMarks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'teacher') {
      const [teacher, exam] = await Promise.all([
        getTeacherProfile(req.tenantId!, req.user._id.toString()),
        Exam.findOne({ _id: req.params['id'], tenantId: req.tenantId }).select('classId').lean(),
      ]);
      if (!teacher) { sendError(res, 'Teacher profile not found', 404); return; }
      if (!exam) { sendError(res, 'Exam not found', 404); return; }
      if (!teacher.classIds.map(id => id.toString()).includes(exam.classId.toString())) {
        sendError(res, 'Access denied', 403); return;
      }
    }

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

    if (req.user?.role === 'teacher') {
      const [teacher, exam] = await Promise.all([
        getTeacherProfile(req.tenantId!, req.user._id.toString()),
        Exam.findOne({ _id: examId, tenantId: req.tenantId }).select('classId').lean(),
      ]);
      if (!teacher) { sendError(res, 'Teacher profile not found', 404); return; }
      if (!exam) { sendError(res, 'Exam not found', 404); return; }
      if (!teacher.classIds.map(id => id.toString()).includes(exam.classId.toString())) {
        sendError(res, 'Access denied', 403); return;
      }
    }

    const marks = await Mark.find({ tenantId: req.tenantId, examId })
      .populate('studentId', 'name admissionNo rollNo')
      .populate('subjectId', 'name code');
    sendSuccess(res, marks, 'Exam marks fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch exam marks', 500, err);
  }
};
