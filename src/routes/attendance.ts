import { Router } from 'express';
import {
  markAttendance, getAttendance, getStudentAttendance, getAttendanceStats,
} from '../controllers/attendanceController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.post('/', authorize('saas_admin', 'management', 'teacher'), markAttendance);
router.get('/', authorize('saas_admin', 'management', 'teacher'), getAttendance);
router.get('/stats', authorize('saas_admin', 'management', 'teacher'), getAttendanceStats);
router.get('/student/:id', getStudentAttendance);

export default router;
