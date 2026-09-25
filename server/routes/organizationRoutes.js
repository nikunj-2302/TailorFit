import express from 'express';
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '../controllers/organizationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getOrganizations)
  .post(authorize('super_admin', 'admin'), createOrganization);

router.route('/:id')
  .get(getOrganizationById)
  .put(authorize('super_admin', 'admin'), updateOrganization)
  .delete(authorize('super_admin', 'admin'), deleteOrganization);

export default router;
