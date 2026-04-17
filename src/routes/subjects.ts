import { Router } from 'express';
import {
  getSubjects, createSubject, getSubject, updateSubject, deleteSubject,
} from '../controllers/classController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getSubjects);
router.post('/', authorize('saas_admin', 'management'), createSubject);
router.get('/:id', getSubject);
router.put('/:id', authorize('saas_admin', 'management'), updateSubject);
router.delete('/:id', authorize('saas_admin', 'management'), deleteSubject);

export default router;
