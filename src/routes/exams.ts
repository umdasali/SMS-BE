import { Router } from 'express';
import {
  getExams, createExam, updateExam, deleteExam,
  bulkSaveMarks, getStudentMarks, getExamMarks, getExamMarksByQuery,
} from '../controllers/examController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);

router.get('/', getExams);
router.post('/', authorize('saas_admin', 'management'), createExam);
router.put('/:id', authorize('saas_admin', 'management'), updateExam);
router.delete('/:id', authorize('saas_admin', 'management'), deleteExam);

// Marks
router.get('/marks', authorize('saas_admin', 'management', 'teacher'), getExamMarksByQuery);
router.post('/marks/bulk', authorize('saas_admin', 'management', 'teacher'), bulkSaveMarks);
router.get('/marks/student/:id', getStudentMarks);
router.get('/:id/marks', authorize('saas_admin', 'management', 'teacher'), getExamMarks);

export default router;
