import { Request, Response } from 'express';
import Routine from '../models/Routine';
import { sendSuccess, sendError } from '../utils/response';

export const getRoutine = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, sectionId, academicYear } = req.query as Record<string, string>;
    if (!classId) { sendSuccess(res, null, 'Routine fetched'); return; }

    const base: Record<string, unknown> = { tenantId: req.tenantId, classId };

    const populateAndFind = (filter: Record<string, unknown>) =>
      Routine.findOne(filter)
        .sort({ academicYear: -1 })
        .populate('classId', 'name')
        .populate('schedule.periods.subjectId', 'name code')
        .populate('schedule.periods.teacherId', 'name');

    // Fallback chain: most specific → least specific
    // 1. Exact section + exact year
    // 2. No section (class-wide) + exact year
    // 3. Exact section + any year (most recent)
    // 4. No section (class-wide) + any year (most recent)
    const attempts: Record<string, unknown>[] = [];
    if (sectionId && academicYear) attempts.push({ ...base, sectionId, academicYear });
    if (academicYear)              attempts.push({ ...base, sectionId: '', academicYear });
    if (sectionId)                 attempts.push({ ...base, sectionId });
    attempts.push({ ...base, sectionId: '' });
    attempts.push(base);

    let routine = null;
    for (const filter of attempts) {
      routine = await populateAndFind(filter);
      if (routine) break;
    }

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
