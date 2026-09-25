import express from 'express';
import {
  getMeasurements,
  getMeasurementById,
  getPersonMeasurementHistory,
  createMeasurementsBatch,
  createNewVersion,
  duplicateMeasurement,
  deleteMeasurement,
} from '../controllers/measurementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMeasurements);

router.post('/batch', authorize('super_admin', 'admin', 'measurement_user'), createMeasurementsBatch);
router.get('/person/:personId', getPersonMeasurementHistory);
router.post('/:id/new-version', authorize('super_admin', 'admin', 'measurement_user'), createNewVersion);
router.post('/:id/duplicate', authorize('super_admin', 'admin', 'measurement_user'), duplicateMeasurement);

router.route('/:id')
  .get(getMeasurementById)
  .delete(authorize('super_admin', 'admin'), deleteMeasurement);

export default router;
