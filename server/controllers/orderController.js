import Order from '../models/Order.js';
import Person from '../models/Person.js';
import { logAudit } from '../utils/auditLogger.js';

// Helper to generate order number
const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  return `ORD-${String(count + 1).padStart(6, '0')}`;
};

// @desc Get orders with search, filters, pagination
// @route GET /api/orders
export const getOrders = async (req, res, next) => {
  try {
    const {
      status,
      organization,
      branch,
      person,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    let query = { isActive: true };

    if (status && status !== 'All') query.status = status;
    if (organization) query.organization = organization;
    if (branch) query.branch = branch;
    if (person) query.person = person;

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('organization', 'name code')
      .populate('branch', 'name code')
      .populate('person', 'fullName personId mobileNumber department professionType')
      .populate('items.garment', 'name code category')
      .populate('items.measurement', 'measurementNumber values version')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single order by ID
// @route GET /api/orders/:id
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isActive: true })
      .populate('organization', 'name code address city contactPerson contactNumber')
      .populate('branch', 'name code address city')
      .populate('person', 'fullName personId mobileNumber email department designation professionType gender')
      .populate('items.garment', 'name code category applicableGenders')
      .populate('items.measurement')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new order
// @route POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const {
      organization,
      branch,
      person,
      items,
      orderDate,
      deliveryDate,
      status,
      notes,
    } = req.body;

    if (!person || !organization || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Organization, Person, and at least one order item are required.',
      });
    }

    const orderNumber = await generateOrderNumber();

    // Calculate item totals and overall total
    let totalAmount = 0;
    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const discount = Number(item.discount) || 0;
      const itemTotal = (price * qty) - discount;
      totalAmount += itemTotal > 0 ? itemTotal : 0;

      return {
        ...item,
        quantity: qty,
        price,
        discount,
        total: itemTotal > 0 ? itemTotal : 0,
      };
    });

    const order = await Order.create({
      orderNumber,
      organization,
      branch: branch || null,
      person,
      items: processedItems,
      orderDate: orderDate || new Date(),
      deliveryDate,
      status: status || 'Measurement',
      totalAmount,
      notes,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    await order.populate('organization', 'name code');
    await order.populate('person', 'fullName personId');
    await order.populate('items.garment', 'name code');

    await logAudit({
      req,
      action: 'CREATE',
      module: 'Order',
      recordId: order._id,
      description: `Created order ${order.orderNumber} for ${order.person?.fullName} (${order.items.length} items)`,
      newValues: order.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update order status (Production user workflow)
// @route PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order || !order.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const previousStatus = order.status;
    order.status = status;
    order.updatedBy = req.user?._id;
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n[${new Date().toLocaleDateString()} - Status: ${status}]: ${notes}` : `[Status: ${status}]: ${notes}`;
    }

    await order.save();
    await order.populate('person', 'fullName personId');

    await logAudit({
      req,
      action: 'STATUS_CHANGE',
      module: 'Order',
      recordId: order._id,
      description: `Updated order ${order.orderNumber} status from '${previousStatus}' to '${status}'`,
      prevValues: { status: previousStatus },
      newValues: { status },
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update order
// @route PUT /api/orders/:id
export const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || !order.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const prevValues = order.toObject();

    Object.assign(order, req.body);
    order.updatedBy = req.user?._id;

    // Recalculate total if items updated
    if (req.body.items) {
      let totalAmount = 0;
      order.items = req.body.items.map((item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const discount = Number(item.discount) || 0;
        const itemTotal = (price * qty) - discount;
        totalAmount += itemTotal > 0 ? itemTotal : 0;
        return {
          ...item,
          quantity: qty,
          price,
          discount,
          total: itemTotal > 0 ? itemTotal : 0,
        };
      });
      order.totalAmount = totalAmount;
    }

    await order.save();
    await order.populate('organization', 'name code');
    await order.populate('person', 'fullName personId');
    await order.populate('items.garment', 'name code');

    await logAudit({
      req,
      action: 'UPDATE',
      module: 'Order',
      recordId: order._id,
      description: `Updated order ${order.orderNumber}`,
      prevValues,
      newValues: order.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete / Archive order
// @route DELETE /api/orders/:id
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || !order.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.isActive = false;
    await order.save();

    await logAudit({
      req,
      action: 'DELETE',
      module: 'Order',
      recordId: order._id,
      description: `Deactivated order ${order.orderNumber}`,
    });

    res.status(200).json({
      success: true,
      message: 'Order archived successfully',
    });
  } catch (error) {
    next(error);
  }
};
