import { Request, Response } from 'express';
import Routine from '../models/Routine';
import { sendSuccess, sendError } from '../utils/response';

export const getRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, academicYear } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.tenantId };
    if (classId) filter['classId'] = classId;
    if (sectionId) filter['sectionId'] = sectionId;
    if (academicYear) filter['academicYear'] = academicYear;

    const routine = await Routine.findOne(filter)
      .populate('classId', 'name')
      .populate('schedule.periods.subjectId', 'name code')
      .populate('schedule.periods.teacherId', 'name');
    sendSuccess(res, routine, 'Routine fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch routine', 500, err);
  }
};

export const upsertRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, academicYear, schedule } = req.body as {
      classId: string; sectionId: string; academicYear: string;
      schedule: Array<{ day: string; periods: Array<Record<string, unknown>> }>;
    };

    // Strip empty-string ObjectId fields so Mongoose cast doesn't fail
    const cleanSchedule = (schedule ?? []).map((day) => ({
      ...day,
      periods: (day.periods ?? []).map((period) => {
        const p = { ...period };
        if (!p['subjectId']) delete p['subjectId'];
        if (!p['teacherId']) delete p['teacherId'];
        return p;
      }),
    }));

    const routine = await Routine.findOneAndUpdate(
      { tenantId: req.tenantId, classId, sectionId, academicYear },
      { tenantId: req.tenantId, classId, sectionId, academicYear, schedule: cleanSchedule },
      { upsert: true, new: true, runValidators: true }
    );
    sendSuccess(res, routine, 'Routine saved', 200);
  } catch (err) {
    sendError(res, 'Failed to save routine', 500, err);
  }
};
