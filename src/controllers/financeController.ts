import { Request, Response } from 'express';
import Payslip from '../models/Payslip';
import FeeSlip from '../models/FeeSlip';
import FeeStructure from '../models/FeeStructure';
import Teacher from '../models/Teacher';
import Student from '../models/Student';
import Class from '../models/Class';
import { sendSuccess, sendError } from '../utils/response';

// ─────────────────────────────────────────────────────────────────────────────
// FEE STRUCTURES
// ─────────────────────────────────────────────────────────────────────────────

/** GET /finance/fee-structures */
export const getFeeStructures = async (req: Request, res: Response): Promise<void> => {
  try {
    const structures = await FeeStructure.find({ tenantId: req.tenantId })
      .populate('classId', 'name academicYear')
      .sort({ academicYear: -1 });
    sendSuccess(res, structures, 'Fee structures fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch fee structures', 500, err);
  }
};

/** POST /finance/fee-structures */
export const saveFeeStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, academicYear, monthlyFee, admissionFee, examFee, lateFinePerDay, dueDay, remarks } = req.body;

    const cls = await Class.findOne({ _id: classId, tenantId: req.tenantId });
    if (!cls) { sendError(res, 'Class not found', 404); return; }

    const structure = await FeeStructure.findOneAndUpdate(
      { tenantId: req.tenantId, classId, academicYear },
      {
        tenantId: req.tenantId,
        classId,
        academicYear,
        monthlyFee:     monthlyFee     ?? 0,
        admissionFee:   admissionFee   ?? 0,
        examFee:        examFee        ?? 0,
        lateFinePerDay: lateFinePerDay ?? 0,
        dueDay:         dueDay         ?? 10,
        remarks:        remarks        ?? '',
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('classId', 'name');

    sendSuccess(res, structure, 'Fee structure saved', 200);
  } catch (err: any) {
    sendError(res, 'Failed to save fee structure', 500, err);
  }
};

/** DELETE /finance/fee-structures/:id */
export const deleteFeeStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await FeeStructure.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!deleted) { sendError(res, 'Fee structure not found', 404); return; }
    sendSuccess(res, null, 'Fee structure deleted');
  } catch (err) {
    sendError(res, 'Failed to delete fee structure', 500, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE MONTHLY FEES  (one click → slips for every active student)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /finance/generate-monthly-fees
 * Body: { month, year, academicYear }
 *
 * For each class that has a FeeStructure:
 *   - Find all active students in that class
 *   - Build a FeeSlip (skip if one already exists for that student+month+year)
 *   - dueDate = 1st of next month up to dueDay
 */
export const generateMonthlyFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year, academicYear } = req.body;
    if (!month || !year || !academicYear) {
      sendError(res, 'month, year and academicYear are required', 400); return;
    }

    // Build a map of classId → fee structure for O(1) lookup
    const structures = await FeeStructure.find({ tenantId: req.tenantId, academicYear });
    const structureMap = new Map(structures.map(s => [String(s.classId), s]));

    if (structureMap.size === 0) {
      sendError(res, 'No fee structures found for this academic year. Set them up in Fee Setup first.', 404); return;
    }

    // Fetch ALL active students; only those whose class has a fee structure will get a slip
    const students = await Student.find({ tenantId: req.tenantId, status: 'active' });
    if (students.length === 0) {
      sendError(res, 'No active students found.', 404); return;
    }

    let created = 0;
    let skipped = 0;

    for (const student of students) {
      const structure = structureMap.get(String(student.classId));
      if (!structure) { skipped++; continue; } // no fee structure for this class — skip

      const dueDate = new Date(year, month - 1, structure.dueDay);

      try {
        await FeeSlip.create({
          tenantId:  req.tenantId,
          studentId: student._id,
          classId:   student.classId,
          month,
          year,
          dueDate,
          amount:    structure.monthlyFee,
          discount:  0,
          fine:      0,
          netAmount: structure.monthlyFee,
        });
        created++;
      } catch (err: any) {
        if (err.code === 11000) { skipped++; } // already exists — silent skip
      }
    }

    sendSuccess(res, { created, skipped }, `${created} fee slips created, ${skipped} already existed`);
  } catch (err) {
    sendError(res, 'Failed to generate monthly fees', 500, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RUN MONTHLY PAYROLL  (one click → payslips for every active teacher)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /finance/run-monthly-payroll
 * Body: { month, year }
 *
 * Creates a Payslip for every active teacher using their stored salary.
 * Teachers with salary=0 are skipped.
 * Duplicates (already generated) are silently skipped.
 */
export const runMonthlyPayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      sendError(res, 'month and year are required', 400); return;
    }

    const teachers = await Teacher.find({ tenantId: req.tenantId, status: 'active' });
    if (teachers.length === 0) {
      sendError(res, 'No active teachers found', 404); return;
    }

    let created = 0;
    let skipped = 0;

    for (const teacher of teachers) {
      const salary = teacher.salary ?? 0;
      try {
        await Payslip.create({
          tenantId:   req.tenantId,
          teacherId:  teacher._id,
          month,
          year,
          baseSalary: salary,
          allowances: 0,
          deductions: 0,
          netSalary:  salary,
          status:     'pending',
        });
        created++;
      } catch (err: any) {
        if (err.code === 11000) { skipped++; }
      }
    }

    sendSuccess(res, { created, skipped }, `${created} payslips generated, ${skipped} skipped`);
  } catch (err) {
    sendError(res, 'Failed to run payroll', 500, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYSLIPS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /finance/payslips */
export const getPayslips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId, month, year } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};

    if (req.user?.role !== 'saas_admin') {
      filter.tenantId = req.tenantId;
    } else if (req.query['tenantId']) {
      filter.tenantId = req.query['tenantId'];
    }

    if (req.user?.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user._id });
      if (!teacher) { sendError(res, 'Teacher profile not found', 404); return; }
      filter.teacherId = teacher._id;
    } else if (teacherId) {
      filter.teacherId = teacherId;
    }

    if (month) filter.month = parseInt(month);
    if (year)  filter.year  = parseInt(year);

    const payslips = await Payslip.find(filter)
      .populate('teacherId', 'name employeeId designation photo salary')
      .sort({ year: -1, month: -1 });

    sendSuccess(res, payslips, 'Payslips fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch payslips', 500, err);
  }
};

/** POST /finance/payslips  — manual single payslip (e.g. contract / adjustment) */
export const generateTeacherPayslip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId, month, year, allowances, deductions, remarks } = req.body;

    const teacher = await Teacher.findOne({ _id: teacherId, tenantId: req.tenantId });
    if (!teacher) { sendError(res, 'Teacher not found', 404); return; }

    const netSalary = (teacher.salary || 0) + (allowances || 0) - (deductions || 0);

    const payslip = await Payslip.create({
      tenantId:   req.tenantId,
      teacherId,
      month,
      year,
      baseSalary: teacher.salary || 0,
      allowances: allowances || 0,
      deductions: deductions || 0,
      netSalary,
      remarks:    remarks || '',
    });

    sendSuccess(res, payslip, 'Payslip generated', 201);
  } catch (err: any) {
    if (err.code === 11000) {
      sendError(res, 'Payslip already exists for this teacher, month and year', 400);
    } else {
      sendError(res, 'Failed to generate payslip', 500, err);
    }
  }
};

/**
 * PATCH /finance/payslips/:id/status
 * Body: { status, paymentDate?, allowances?, deductions?, remarks? }
 * Supports editing allowances/deductions (adjustments) and marking paid.
 */
export const updatePayslipStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentDate, allowances, deductions, remarks } = req.body;

    const payslip = await Payslip.findOne({ _id: id, tenantId: req.tenantId });
    if (!payslip) { sendError(res, 'Payslip not found', 404); return; }

    if (status !== undefined)      payslip.status      = status;
    if (allowances !== undefined)  payslip.allowances  = allowances;
    if (deductions !== undefined)  payslip.deductions  = deductions;
    if (remarks !== undefined)     payslip.remarks     = remarks;

    // Recalculate net if adjustments changed
    payslip.netSalary = payslip.baseSalary + (payslip.allowances || 0) - (payslip.deductions || 0);

    if (status === 'paid' && !payslip.paymentDate) {
      payslip.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    } else if (paymentDate) {
      payslip.paymentDate = new Date(paymentDate);
    }

    await payslip.save();
    sendSuccess(res, payslip, 'Payslip updated');
  } catch (err) {
    sendError(res, 'Failed to update payslip', 500, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FEE SLIPS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /finance/fee-slips */
export const getFeeSlips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, classId, month, year, status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};

    if (req.user?.role !== 'saas_admin') {
      filter.tenantId = req.tenantId;
    } else if (req.query['tenantId']) {
      filter.tenantId = req.query['tenantId'];
    }

    if (req.user?.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) { sendError(res, 'Student profile not found', 404); return; }
      filter.studentId = student._id;
    } else if (studentId) {
      filter.studentId = studentId;
    }

    if (classId) filter.classId = classId;
    if (month)   filter.month   = parseInt(month);
    if (year)    filter.year    = parseInt(year);
    if (status)  filter.status  = status;

    const feeSlips = await FeeSlip.find(filter)
      .populate('studentId', 'name admissionNo rollNo photo')
      .populate('classId', 'name')
      .sort({ year: -1, month: -1 });

    sendSuccess(res, feeSlips, 'Fee slips fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch fee slips', 500, err);
  }
};

/** POST /finance/fee-slips — manual single slip */
export const generateStudentFeeSlip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, month, year, amount, discount, fine, dueDate, remarks } = req.body;

    const student = await Student.findOne({ _id: studentId, tenantId: req.tenantId });
    if (!student) { sendError(res, 'Student not found', 404); return; }

    const netAmount = (amount || 0) - (discount || 0) + (fine || 0);

    const feeSlip = await FeeSlip.create({
      tenantId:  req.tenantId,
      studentId,
      classId:   student.classId,
      month,
      year,
      dueDate,
      amount,
      discount:  discount || 0,
      fine:      fine     || 0,
      netAmount,
      remarks:   remarks  || '',
    });

    sendSuccess(res, feeSlip, 'Fee slip generated', 201);
  } catch (err: any) {
    if (err.code === 11000) {
      sendError(res, 'Fee slip already exists for this student, month and year', 400);
    } else {
      sendError(res, 'Failed to generate fee slip', 500, err);
    }
  }
};

/** POST /finance/fee-slips/bulk — kept for backward compat / class-specific override */
export const bulkGenerateFeeSlips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId, month, year, amount, dueDate, remarks } = req.body;

    const students = await Student.find({ classId, tenantId: req.tenantId, status: 'active' });
    if (students.length === 0) { sendError(res, 'No active students in this class', 404); return; }

    let created = 0; let skipped = 0;
    for (const student of students) {
      try {
        await FeeSlip.create({
          tenantId:  req.tenantId,
          studentId: student._id,
          classId:   student.classId,
          month, year, dueDate,
          amount,
          netAmount: amount,
          remarks:   remarks || '',
        });
        created++;
      } catch (err: any) {
        if (err.code === 11000) { skipped++; }
      }
    }

    sendSuccess(res, { created, skipped }, `${created} fee slips created`);
  } catch (err) {
    sendError(res, 'Failed to generate fee slips', 500, err);
  }
};

/**
 * PATCH /finance/fee-slips/:id/status
 * Body: { status, paidAmount?, paymentDate?, discount?, fine?, remarks? }
 * Recalculates netAmount when discount/fine change.
 */
export const updateFeeSlipStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paidAmount, paymentDate, discount, fine, remarks } = req.body;

    const feeSlip = await FeeSlip.findOne({ _id: id, tenantId: req.tenantId });
    if (!feeSlip) { sendError(res, 'Fee slip not found', 404); return; }

    if (status      !== undefined) feeSlip.status      = status;
    if (paidAmount  !== undefined) feeSlip.paidAmount  = paidAmount;
    if (discount    !== undefined) feeSlip.discount    = discount;
    if (fine        !== undefined) feeSlip.fine        = fine;
    if (remarks     !== undefined) feeSlip.remarks     = remarks;

    // Recalculate net if adjustments changed
    feeSlip.netAmount = feeSlip.amount - (feeSlip.discount || 0) + (feeSlip.fine || 0);

    if (status === 'paid' && !feeSlip.paymentDate) {
      feeSlip.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    } else if (paymentDate) {
      feeSlip.paymentDate = new Date(paymentDate);
    }

    await feeSlip.save();
    sendSuccess(res, feeSlip, 'Fee slip updated');
  } catch (err) {
    sendError(res, 'Failed to update fee slip', 500, err);
  }
};
