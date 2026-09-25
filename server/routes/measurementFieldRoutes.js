import express from 'express';
import {
  getFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
} from '../controllers/measurementFieldController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFields)
  .post(authorize('super_admin', 'admin'), createField);

router.route('/:id')
  .get(getFieldById)
  .put(authorize('super_admin', 'admin'), updateField)
  .delete(authorize('super_admin', 'admin'), deleteField);

export default router;
