import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getOrders)
  .post(authorize('super_admin', 'admin', 'measurement_user'), createOrder);

router.patch('/:id/status', authorize('super_admin', 'admin', 'production_user'), updateOrderStatus);

router.route('/:id')
  .get(getOrderById)
  .put(authorize('super_admin', 'admin', 'production_user'), updateOrder)
  .delete(authorize('super_admin', 'admin'), deleteOrder);

export default router;
