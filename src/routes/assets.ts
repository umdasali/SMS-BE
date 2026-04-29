import { Router } from 'express';
import {
  getAssets, createAsset, updateAsset, deleteAsset,
  getAssignments, createAssignment, deleteAssignment,
  getAssetStats,
} from '../controllers/assetController';
import { protect, authorize } from '../middleware/auth';

const router = Router();
router.use(protect);
router.use(authorize('saas_admin', 'management'));

router.get('/stats', getAssetStats);
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.delete('/assignments/:id', deleteAssignment);

router.get('/', getAssets);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
