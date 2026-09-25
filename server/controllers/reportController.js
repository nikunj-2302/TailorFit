import Organization from '../models/Organization.js';
import Branch from '../models/Branch.js';
import Person from '../models/Person.js';
import Measurement from '../models/Measurement.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';

// @desc Get dashboard aggregated statistics
// @route GET /api/reports/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalOrganizations,
      totalBranches,
      totalPersons,
      totalMeasurements,
      allOrders,
      recentPersons,
      recentMeasurements,
      recentOrders,
    ] = await Promise.all([
      Organization.countDocuments({ isActive: true }),
      Branch.countDocuments({ isActive: true }),
      Person.countDocuments({ isActive: true }),
      Measurement.countDocuments({ isLatest: true, isActive: true }),
      Order.find({ isActive: true }).select('status'),
      Person.find({ isActive: true })
        .populate('organization', 'name')
        .populate('branch', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Measurement.find({ isLatest: true, isActive: true })
        .populate('person', 'fullName personId')
        .populate('garment', 'name')
        .populate('organization', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Order.find({ isActive: true })
        .populate('person', 'fullName')
        .populate('organization', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Order status counts
    const activeOrders = allOrders.filter(
      (o) => !['Delivered', 'Cancelled'].includes(o.status)
    ).length;
    const pendingOrders = allOrders.filter((o) =>
      ['Measurement', 'Cutting', 'Stitching', 'Quality Check'].includes(o.status)
    ).length;
    const readyOrders = allOrders.filter((o) => o.status === 'Ready').length;
    const completedOrders = allOrders.filter((o) => o.status === 'Delivered').length;

    // Monthly orders distribution
    const ordersByStatus = {
      Measurement: allOrders.filter((o) => o.status === 'Measurement').length,
      Cutting: allOrders.filter((o) => o.status === 'Cutting').length,
      Stitching: allOrders.filter((o) => o.status === 'Stitching').length,
      QualityCheck: allOrders.filter((o) => o.status === 'Quality Check').length,
      Ready: readyOrders,
      Delivered: completedOrders,
    };

    res.status(200).json({
      success: true,
      data: {
        totalOrganizations,
        totalBranches,
        totalPersons,
        totalMeasurements,
        activeOrders,
        pendingOrders,
        readyOrders,
        completedOrders,
        ordersByStatus,
        recentPersons,
        recentMeasurements,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get organization comprehensive report
// @route GET /api/reports/organizations
export const getOrganizationReport = async (req, res, next) => {
  try {
    const organizations = await Organization.find({ isActive: true }).sort({ name: 1 });

    const report = await Promise.all(
      organizations.map(async (org) => {
        const branchCount = await Branch.countDocuments({ organization: org._id, isActive: true });
        const personCount = await Person.countDocuments({ organization: org._id, isActive: true });
        const measurementCount = await Measurement.countDocuments({ organization: org._id, isLatest: true, isActive: true });
        const orderCount = await Order.countDocuments({ organization: org._id, isActive: true });

        return {
          id: org._id,
          name: org.name,
          code: org.code,
          type: org.type,
          city: org.city,
          contactPerson: org.contactPerson,
          contactNumber: org.contactNumber,
          branchCount,
          personCount,
          measurementCount,
          orderCount,
          status: org.status,
          createdAt: org.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get measurement report
// @route GET /api/reports/measurements
export const getMeasurementReport = async (req, res, next) => {
  try {
    const { organization, branch, garment, startDate, endDate } = req.query;

    let query = { isLatest: true, isActive: true };
    if (organization) query.organization = organization;
    if (branch) query.branch = branch;
    if (garment) query.garment = garment;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const measurements = await Measurement.find(query)
      .populate('person', 'fullName personId mobileNumber department professionType')
      .populate('organization', 'name code')
      .populate('branch', 'name code')
      .populate('garment', 'name code category')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: measurements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get order report
// @route GET /api/reports/orders
export const getOrderReport = async (req, res, next) => {
  try {
    const { organization, branch, status, startDate, endDate } = req.query;

    let query = { isActive: true };
    if (organization) query.organization = organization;
    if (branch) query.branch = branch;
    if (status && status !== 'All') query.status = status;

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('person', 'fullName personId mobileNumber')
      .populate('organization', 'name code')
      .populate('branch', 'name code')
      .populate('items.garment', 'name')
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get audit logs
// @route GET /api/reports/audit-logs
export const getAuditLogs = async (req, res, next) => {
  try {
    const { module, action, page = 1, limit = 50 } = req.query;

    let query = {};
    if (module && module !== 'All') query.module = module;
    if (action && action !== 'All') query.action = action;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: logs,
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
