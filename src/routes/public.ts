import { Router } from 'express';
import Student from '../models/Student';
import Mark from '../models/Mark';
import Tenant from '../models/Tenant';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

/**
 * GET /public/marksheet?schoolCode=&rollNo=&academicYear=
 * No auth required. Looks up a student by schoolCode + rollNo, returns their marks.
 */
router.get('/marksheet', async (req, res) => {
  try {
    const { schoolCode, rollNo, academicYear } = req.query as Record<string, string>;
    if (!schoolCode || !rollNo) {
      sendError(res, 'schoolCode and rollNo are required', 400); return;
    }

    const tenant = await Tenant.findOne({ schoolCode: schoolCode.toUpperCase() });
    if (!tenant) { sendError(res, 'Institution not found', 404); return; }

    const student = await Student.findOne({ tenantId: tenant._id, rollNo, status: 'active' })
      .populate('classId', 'name');
    if (!student) { sendError(res, 'Student not found. Check roll number.', 404); return; }

    const filter: Record<string, unknown> = { tenantId: tenant._id, studentId: student._id };

    const marks = await Mark.find(filter)
      .populate({ path: 'examId', select: 'name type academicYear term startDate', ...(academicYear ? { match: { academicYear } } : {}) })
      .populate('subjectId', 'name code fullMarks passMarks');

    // Filter out marks where examId didn't match the academicYear populate match
    const filteredMarks = academicYear ? marks.filter(m => m.examId !== null) : marks;

    const byExam = filteredMarks.reduce((acc: Record<string, unknown[]>, mark) => {
      const eid = (mark.examId as { _id: { toString(): string } })._id.toString();
      if (!acc[eid]) acc[eid] = [];
      acc[eid]!.push(mark);
      return acc;
    }, {});

    sendSuccess(res, {
      student: {
        name: student.name,
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        classId: student.classId,
        sectionId: student.sectionId,
      },
      institution: { name: tenant.name, schoolCode: tenant.schoolCode },
      byExam,
    }, 'Marksheet fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch marksheet', 500, err);
  }
});

export default router;
