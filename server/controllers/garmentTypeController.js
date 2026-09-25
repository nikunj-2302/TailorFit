import GarmentType from '../models/GarmentType.js';
import MeasurementTemplate from '../models/MeasurementTemplate.js';
import Measurement from '../models/Measurement.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc Get all garment types
// @route GET /api/garments
export const getGarments = async (req, res, next) => {
  try {
    const { category, gender, search, status } = req.query;

    let query = { isActive: true };

    if (category && category !== 'All') query.category = category;
    if (gender && gender !== 'All') query.applicableGenders = { $in: [gender, 'Unisex'] };
    if (status && status !== 'All') query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const garments = await GarmentType.find(query).sort({ category: 1, name: 1 });

    // Include template count for each garment
    const garmentsWithMeta = await Promise.all(
      garments.map(async (g) => {
        const templateCount = await MeasurementTemplate.countDocuments({ garment: g._id, isActive: true });
        const usageCount = await Measurement.countDocuments({ garment: g._id, isActive: true });
        return {
          ...g.toObject(),
          templateCount,
          usageCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: garmentsWithMeta,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single garment
// @route GET /api/garments/:id
export const getGarmentById = async (req, res, next) => {
  try {
    const garment = await GarmentType.findOne({ _id: req.params.id, isActive: true });
    if (!garment) {
      return res.status(404).json({
        success: false,
        message: 'Garment type not found',
      });
    }

    const templates = await MeasurementTemplate.find({ garment: garment._id, isActive: true })
      .populate('fields.field', 'name code category unit');

    res.status(200).json({
      success: true,
      data: {
        ...garment.toObject(),
        templates,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create garment
// @route POST /api/garments
export const createGarment = async (req, res, next) => {
  try {
    const { name, code, category, applicableGenders, description, status } = req.body;

    const existing = await GarmentType.findOne({ code: code?.toUpperCase(), isActive: true });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Garment code '${code}' already exists`,
      });
    }

    const garment = await GarmentType.create({
      name,
      code: code ? code.toUpperCase() : name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase(),
      category: category || 'Clothing',
      applicableGenders: applicableGenders || ['Male', 'Female', 'Unisex'],
      description,
      status: status || 'Active',
    });

    await logAudit({
      req,
      action: 'CREATE',
      module: 'GarmentType',
      recordId: garment._id,
      description: `Created garment type '${garment.name}' (${garment.code})`,
      newValues: garment.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Garment type created successfully',
      data: garment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update garment
// @route PUT /api/garments/:id
export const updateGarment = async (req, res, next) => {
  try {
    const garment = await GarmentType.findById(req.params.id);
    if (!garment || !garment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Garment type not found',
      });
    }

    const prevValues = garment.toObject();

    Object.assign(garment, req.body);
    if (req.body.code) garment.code = req.body.code.toUpperCase();

    await garment.save();

    await logAudit({
      req,
      action: 'UPDATE',
      module: 'GarmentType',
      recordId: garment._id,
      description: `Updated garment type '${garment.name}'`,
      prevValues,
      newValues: garment.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Garment type updated successfully',
      data: garment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete garment (with usage check)
// @route DELETE /api/garments/:id
export const deleteGarment = async (req, res, next) => {
  try {
    const garment = await GarmentType.findById(req.params.id);
    if (!garment || !garment.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Garment type not found',
      });
    }

    // Check if being used in measurements
    const measurementUsage = await Measurement.countDocuments({ garment: garment._id, isActive: true });
    if (measurementUsage > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete garment type. It is actively used in ${measurementUsage} measurements. Please deactivate it instead.`,
      });
    }

    garment.isActive = false;
    await garment.save();

    await logAudit({
      req,
      action: 'DELETE',
      module: 'GarmentType',
      recordId: garment._id,
      description: `Deactivated garment type '${garment.name}'`,
    });

    res.status(200).json({
      success: true,
      message: 'Garment type deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
