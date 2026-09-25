import express from 'express';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBranches)
  .post(authorize('super_admin', 'admin'), createBranch);

router.route('/:id')
  .get(getBranchById)
  .put(authorize('super_admin', 'admin'), updateBranch)
  .delete(authorize('super_admin', 'admin'), deleteBranch);

export default router;
