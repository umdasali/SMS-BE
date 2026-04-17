import { Router } from 'express';
import {
  getClasses, createClass, getClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
} from '../controllers/classController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getClasses);
router.post('/', authorize('saas_admin', 'management'), createClass);
router.get('/:id', getClass);
router.put('/:id', authorize('saas_admin', 'management'), updateClass);
router.delete('/:id', authorize('saas_admin', 'management'), deleteClass);

// Subjects
router.get('/subjects/all', getSubjects);
router.post('/subjects/create', authorize('saas_admin', 'management'), createSubject);
router.put('/subjects/:id', authorize('saas_admin', 'management'), updateSubject);
router.delete('/subjects/:id', authorize('saas_admin', 'management'), deleteSubject);

export default router;
