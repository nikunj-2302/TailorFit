import express from 'express';
import {
  getDashboardStats,
  getOrganizationReport,
  getMeasurementReport,
  getOrderReport,
  getAuditLogs,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/organizations', getOrganizationReport);
router.get('/measurements', getMeasurementReport);
router.get('/orders', getOrderReport);
router.get('/audit-logs', authorize('super_admin', 'admin'), getAuditLogs);

export default router;
