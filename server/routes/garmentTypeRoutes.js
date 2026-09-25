import express from 'express';
import {
  getGarments,
  getGarmentById,
  createGarment,
  updateGarment,
  deleteGarment,
} from '../controllers/garmentTypeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGarments)
  .post(authorize('super_admin', 'admin'), createGarment);

router.route('/:id')
  .get(getGarmentById)
  .put(authorize('super_admin', 'admin'), updateGarment)
  .delete(authorize('super_admin', 'admin'), deleteGarment);

export default router;
