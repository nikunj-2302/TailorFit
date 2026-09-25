import express from 'express';
import {
  getPersons,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
} from '../controllers/personController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPersons)
  .post(authorize('super_admin', 'admin', 'measurement_user'), createPerson);

router.route('/:id')
  .get(getPersonById)
  .put(authorize('super_admin', 'admin', 'measurement_user'), updatePerson)
  .delete(authorize('super_admin', 'admin'), deletePerson);

export default router;
