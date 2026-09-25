import express from 'express';
import {
  getTemplates,
  getTemplateById,
  resolveTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/measurementTemplateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/resolve', resolveTemplate);

router.route('/')
  .get(getTemplates)
  .post(authorize('super_admin', 'admin'), createTemplate);

router.route('/:id')
  .get(getTemplateById)
  .put(authorize('super_admin', 'admin'), updateTemplate)
  .delete(authorize('super_admin', 'admin'), deleteTemplate);

export default router;
