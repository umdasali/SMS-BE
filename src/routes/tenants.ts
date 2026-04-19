import { Router } from 'express';
import {
  getAllTenants, getTenant, updateTenant, updateBranding,
  deleteTenant, getMyTenant, getTenantStats, updateSubscription,
} from '../controllers/tenantController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../utils/cloudinary';

const router = Router();

router.use(protect);

router.get('/my', getMyTenant);
router.put('/my/branding', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), updateBranding);

// SaaS admin only
router.get('/', authorize('saas_admin'), getAllTenants);
router.get('/:id', authorize('saas_admin'), getTenant);
router.get('/:id/stats', authorize('saas_admin'), getTenantStats);
router.put('/:id/subscription', authorize('saas_admin'), updateSubscription);
router.put('/:id', authorize('saas_admin'), updateTenant);
router.put('/:id/branding', authorize('saas_admin'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), updateBranding);
router.delete('/:id', authorize('saas_admin'), deleteTenant);

export default router;
