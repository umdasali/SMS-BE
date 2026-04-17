import { Router } from 'express';
import {
  // Fee structures
  getFeeStructures,
  saveFeeStructure,
  deleteFeeStructure,
  // One-click generators
  generateMonthlyFees,
  runMonthlyPayroll,
  // Payslips
  getPayslips,
  generateTeacherPayslip,
  updatePayslipStatus,
  // Fee slips
  getFeeSlips,
  generateStudentFeeSlip,
  bulkGenerateFeeSlips,
  updateFeeSlipStatus,
} from '../controllers/financeController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

// ── Fee Structures ────────────────────────────────────────────────────────────
router.get('/fee-structures',        authorize('saas_admin', 'management'), getFeeStructures);
router.post('/fee-structures',       authorize('saas_admin', 'management'), saveFeeStructure);
router.delete('/fee-structures/:id', authorize('saas_admin', 'management'), deleteFeeStructure);

// ── One-click bulk generators ─────────────────────────────────────────────────
router.post('/generate-monthly-fees',  authorize('saas_admin', 'management'), generateMonthlyFees);
router.post('/run-monthly-payroll',    authorize('saas_admin', 'management'), runMonthlyPayroll);

// ── Payslips ──────────────────────────────────────────────────────────────────
router.get('/payslips',           authorize('saas_admin', 'management', 'teacher'), getPayslips);
router.post('/payslips',          authorize('saas_admin', 'management'),            generateTeacherPayslip);
router.patch('/payslips/:id',     authorize('saas_admin', 'management'),            updatePayslipStatus);

// ── Fee Slips ─────────────────────────────────────────────────────────────────
router.get('/fee-slips',           authorize('saas_admin', 'management', 'student'), getFeeSlips);
router.post('/fee-slips',          authorize('saas_admin', 'management'),             generateStudentFeeSlip);
router.post('/fee-slips/bulk',     authorize('saas_admin', 'management'),             bulkGenerateFeeSlips);
router.patch('/fee-slips/:id',     authorize('saas_admin', 'management'),             updateFeeSlipStatus);

export default router;
