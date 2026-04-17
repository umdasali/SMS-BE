import { Router } from 'express';
import {
  getStudents, createStudent, getStudent, updateStudent,
  deleteStudent, getMyStudentProfile, updateStudentPassword,
} from '../controllers/studentController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../utils/cloudinary';

const router = Router();

router.use(protect);

router.get('/me', authorize('student'), getMyStudentProfile);
router.get('/', authorize('saas_admin', 'management', 'teacher'), getStudents);
router.post('/', authorize('saas_admin', 'management'), upload.single('photo'), createStudent);
router.get('/:id', authorize('saas_admin', 'management', 'teacher'), getStudent);
router.put('/:id', authorize('saas_admin', 'management'), upload.single('photo'), updateStudent);
router.put('/:id/password', authorize('saas_admin', 'management'), updateStudentPassword);
router.delete('/:id', authorize('saas_admin', 'management'), deleteStudent);

export default router;
