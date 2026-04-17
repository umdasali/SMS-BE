import { Request, Response } from 'express';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import Attendance from '../models/Attendance';
import Exam from '../models/Exam';
import Class from '../models/Class';
import { sendSuccess, sendError } from '../utils/response';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalStudents, totalTeachers, totalClasses,
      activeStudents, todayAttendance, upcomingExams,
    ] = await Promise.all([
      Student.countDocuments({ tenantId }),
      Teacher.countDocuments({ tenantId }),
      Class.countDocuments({ tenantId }),
      Student.countDocuments({ tenantId, status: 'active' }),
      Attendance.findOne({ tenantId, date: { $gte: today, $lt: tomorrow } }),
      Exam.find({ tenantId, startDate: { $gte: today } }).limit(5).sort({ startDate: 1 }),
    ]);

    // Today's attendance percentage
    let attendancePercentage = 0;
    if (todayAttendance) {
      const presentCount = todayAttendance.records.filter(
        (r) => r.status === 'present' || r.status === 'late'
      ).length;
      attendancePercentage = todayAttendance.records.length > 0
        ? Math.round((presentCount / todayAttendance.records.length) * 100)
        : 0;
    }

    // Monthly attendance trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const trendData = await Promise.all(
      last7Days.map(async (day) => {
        const next = new Date(day);
        next.setDate(next.getDate() + 1);
        const att = await Attendance.findOne({ tenantId, date: { $gte: day, $lt: next } });
        if (!att) return { date: day.toISOString().split('T')[0], percentage: 0 };
        const present = att.records.filter((r) => r.status === 'present').length;
        const pct = att.records.length > 0 ? Math.round((present / att.records.length) * 100) : 0;
        return { date: day.toISOString().split('T')[0], percentage: pct };
      })
    );

    sendSuccess(res, {
      counts: { totalStudents, totalTeachers, totalClasses, activeStudents },
      attendance: { todayPercentage: attendancePercentage, trend: trendData },
      upcomingExams,
    }, 'Dashboard stats fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch dashboard stats', 500, err);
  }
};
