import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import Student from '../models/Student';
import { sendSuccess, sendError } from '../utils/response';

export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, date, records } = req.body as {
      classId: string; sectionId: string; date: string; records: unknown;
    };

    const attendance = await Attendance.findOneAndUpdate(
      { tenantId: req.tenantId, classId, sectionId, date: new Date(date) },
      {
        tenantId: req.tenantId, classId, sectionId,
        date: new Date(date), records, takenBy: req.user?._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    sendSuccess(res, attendance, 'Attendance marked');
  } catch (err) {
    sendError(res, 'Failed to mark attendance', 500, err);
  }
};

export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, date, startDate, endDate } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.tenantId };
    if (classId) filter['classId'] = classId;
    if (sectionId) filter['sectionId'] = sectionId;
    if (date) filter['date'] = new Date(date);
    if (startDate && endDate) {
      filter['date'] = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendance = await Attendance.find(filter)
      .populate('records.studentId', 'name admissionNo')
      .sort({ date: -1 });
    sendSuccess(res, attendance, 'Attendance fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch attendance', 500, err);
  }
};

export const getStudentAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const studentId = req.params['id'];

    const filter: Record<string, unknown> = {
      tenantId: req.tenantId,
      'records.studentId': studentId,
    };
    if (startDate && endDate) {
      filter['date'] = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendances = await Attendance.find(filter).sort({ date: -1 });
    const stats = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };

    attendances.forEach((a) => {
      const record = a.records.find((r) => r.studentId.toString() === studentId);
      if (record) {
        stats.total++;
        if (record.status === 'present') stats.present++;
        else if (record.status === 'absent') stats.absent++;
        else if (record.status === 'late') stats.late++;
        else if (record.status === 'half-day') stats.halfDay++;
      }
    });

    sendSuccess(res, { attendances, stats }, 'Student attendance fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch student attendance', 500, err);
  }
};

export const getAttendanceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, startDate, endDate } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.tenantId };
    if (classId) filter['classId'] = classId;
    if (startDate && endDate) {
      filter['date'] = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendances = await Attendance.find(filter);
    const statsMap: Record<string, { present: number; absent: number; late: number; halfDay: number }> = {};

    attendances.forEach((a) => {
      a.records.forEach((r) => {
        const sid = r.studentId.toString();
        if (!statsMap[sid]) statsMap[sid] = { present: 0, absent: 0, late: 0, halfDay: 0 };
        if (r.status === 'present') statsMap[sid]!.present++;
        else if (r.status === 'absent') statsMap[sid]!.absent++;
        else if (r.status === 'late') statsMap[sid]!.late++;
        else if (r.status === 'half-day') statsMap[sid]!.halfDay++;
      });
    });

    sendSuccess(res, statsMap, 'Attendance stats fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch stats', 500, err);
  }
};
