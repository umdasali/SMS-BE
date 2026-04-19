import { Router } from 'express';
import {
  getTeachers, createTeacher, getTeacher, updateTeacher,
  deleteTeacher, getMyTeacherProfile, updateTeacherPassword, updateTeacherStatus,
} from '../controllers/teacherController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../utils/cloudinary';

const router = Router();

router.use(protect);

router.get('/me', authorize('teacher'), getMyTeacherProfile);
router.get('/', authorize('saas_admin', 'management'), getTeachers);
router.post('/', authorize('saas_admin', 'management'), upload.single('photo'), createTeacher);
router.get('/:id', authorize('saas_admin', 'management'), getTeacher);
router.put('/:id', authorize('saas_admin', 'management'), upload.single('photo'), updateTeacher);
router.patch('/:id/status', authorize('saas_admin', 'management'), updateTeacherStatus);
router.put('/:id/password', authorize('saas_admin', 'management'), updateTeacherPassword);
router.delete('/:id', authorize('saas_admin', 'management'), deleteTeacher);

export default router;
