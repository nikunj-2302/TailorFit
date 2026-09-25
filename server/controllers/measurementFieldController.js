import MeasurementField from '../models/MeasurementField.js';
import MeasurementTemplate from '../models/MeasurementTemplate.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc Get all measurement fields (optionally filtered by category)
// @route GET /api/measurement-fields
export const getFields = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;

    let query = { isActive: true };

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const fields = await MeasurementField.find(query).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: fields,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single measurement field
// @route GET /api/measurement-fields/:id
export const getFieldById = async (req, res, next) => {
  try {
    const field = await MeasurementField.findOne({ _id: req.params.id, isActive: true });
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Measurement field not found',
      });
    }

    res.status(200).json({
      success: true,
      data: field,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create measurement field
// @route POST /api/measurement-fields
export const createField = async (req, res, next) => {
  try {
    const { name, code, category, unit, description, status } = req.body;

    const formattedCode = code ? code.toUpperCase() : name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

    const existing = await MeasurementField.findOne({ code: formattedCode, isActive: true });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Field with code '${formattedCode}' already exists`,
      });
    }

    const field = await MeasurementField.create({
      name,
      code: formattedCode,
      category: category || 'Upper Body',
      unit: unit || 'Inch',
      description,
      status: status || 'Active',
    });

    await logAudit({
      req,
      action: 'CREATE',
      module: 'MeasurementField',
      recordId: field._id,
      description: `Created measurement field '${field.name}' (${field.code})`,
      newValues: field.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Measurement field created successfully',
      data: field,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update measurement field
// @route PUT /api/measurement-fields/:id
export const updateField = async (req, res, next) => {
  try {
    const field = await MeasurementField.findById(req.params.id);
    if (!field || !field.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Measurement field not found',
      });
    }

    const prevValues = field.toObject();

    Object.assign(field, req.body);
    if (req.body.code) field.code = req.body.code.toUpperCase();

    await field.save();

    await logAudit({
      req,
      action: 'UPDATE',
      module: 'MeasurementField',
      recordId: field._id,
      description: `Updated measurement field '${field.name}'`,
      prevValues,
      newValues: field.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Measurement field updated successfully',
      data: field,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete measurement field
// @route DELETE /api/measurement-fields/:id
export const deleteField = async (req, res, next) => {
  try {
    const field = await MeasurementField.findById(req.params.id);
    if (!field || !field.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Measurement field not found',
      });
    }

    // Check if used in any templates
    const templateUsage = await MeasurementTemplate.countDocuments({
      'fields.field': field._id,
      isActive: true,
    });

    if (templateUsage > 0) {
      return res.status(400).json({
        success: false,
        message: `Field is used in ${templateUsage} templates. Please remove it from templates or deactivate it instead.`,
      });
    }

    field.isActive = false;
    await field.save();

    await logAudit({
      req,
      action: 'DELETE',
      module: 'MeasurementField',
      recordId: field._id,
      description: `Deactivated measurement field '${field.name}'`,
    });

    res.status(200).json({
      success: true,
      message: 'Measurement field deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
