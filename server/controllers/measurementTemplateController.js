import MeasurementTemplate from '../models/MeasurementTemplate.js';
import Measurement from '../models/Measurement.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc Get all templates
// @route GET /api/measurement-templates
export const getTemplates = async (req, res, next) => {
  try {
    const { garment, gender, search, organization } = req.query;

    let query = { isActive: true };

    if (garment) query.garment = garment;
    if (gender && gender !== 'All') query.gender = { $in: [gender, 'Unisex'] };
    if (organization) query.organization = { $in: [organization, null] };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const templates = await MeasurementTemplate.find(query)
      .populate('garment', 'name code category')
      .populate('organization', 'name code')
      .populate('fields.field', 'name code category unit')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single template by ID
// @route GET /api/measurement-templates/:id
export const getTemplateById = async (req, res, next) => {
  try {
    const template = await MeasurementTemplate.findOne({ _id: req.params.id, isActive: true })
      .populate('garment', 'name code category')
      .populate('organization', 'name code')
      .populate('fields.field', 'name code category unit');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Sort fields by displayOrder
    const sortedFields = [...template.fields].sort((a, b) => a.displayOrder - b.displayOrder);
    const result = template.toObject();
    result.fields = sortedFields;

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Resolve best dynamic template for a given context (Garment + Gender + Profession + Org)
// @route POST /api/measurement-templates/resolve
export const resolveTemplate = async (req, res, next) => {
  try {
    const { garment, gender, professionType, organization } = req.body;

    if (!garment) {
      return res.status(400).json({
        success: false,
        message: 'Garment ID is required to resolve measurement template',
      });
    }

    // Search query priority:
    // 1. Specific Org + Garment + Gender + ProfessionType match
    let template = null;

    if (organization) {
      template = await MeasurementTemplate.findOne({
        garment,
        gender: { $in: [gender, 'Unisex'] },
        organization,
        isActive: true,
        $or: [
          { applicableTypes: professionType },
          { applicableTypes: 'All' },
          { applicableTypes: { $size: 0 } },
        ],
      }).populate('fields.field', 'name code category unit');
    }

    // 2. Global + Garment + Gender + ProfessionType match
    if (!template) {
      template = await MeasurementTemplate.findOne({
        garment,
        gender: { $in: [gender, 'Unisex'] },
        organization: null,
        isActive: true,
        applicableTypes: professionType,
      }).populate('fields.field', 'name code category unit');
    }

    // 3. Global + Garment + Gender + (All or empty)
    if (!template) {
      template = await MeasurementTemplate.findOne({
        garment,
        gender: { $in: [gender, 'Unisex'] },
        organization: null,
        isActive: true,
        $or: [
          { applicableTypes: 'All' },
          { applicableTypes: { $size: 0 } },
        ],
      }).populate('fields.field', 'name code category unit');
    }

    // 4. Fallback to any active template for this garment
    if (!template) {
      template = await MeasurementTemplate.findOne({
        garment,
        isActive: true,
      }).populate('fields.field', 'name code category unit');
    }

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No measurement template configured for this garment combination.',
      });
    }

    // Filter and sort active fields by displayOrder
    const sortedFields = template.fields
      .filter((item) => item.field && item.field.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const result = template.toObject();
    result.fields = sortedFields;

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new measurement template
// @route POST /api/measurement-templates
export const createTemplate = async (req, res, next) => {
  try {
    const { name, garment, gender, applicableTypes, organization, fields, description, status } = req.body;

    const template = await MeasurementTemplate.create({
      name,
      garment,
      gender: gender || 'Male',
      applicableTypes: applicableTypes && applicableTypes.length > 0 ? applicableTypes : ['All'],
      organization: organization || null,
      fields: fields || [],
      description,
      status: status || 'Active',
    });

    await template.populate('garment', 'name code');
    await template.populate('fields.field', 'name code category unit');

    await logAudit({
      req,
      action: 'CREATE',
      module: 'MeasurementTemplate',
      recordId: template._id,
      description: `Created measurement template '${template.name}' for ${template.garment?.name}`,
      newValues: template.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Measurement template created successfully',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update measurement template
// @route PUT /api/measurement-templates/:id
export const updateTemplate = async (req, res, next) => {
  try {
    const template = await MeasurementTemplate.findById(req.params.id);
    if (!template || !template.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    const prevValues = template.toObject();

    Object.assign(template, req.body);
    await template.save();

    await template.populate('garment', 'name code');
    await template.populate('fields.field', 'name code category unit');

    await logAudit({
      req,
      action: 'UPDATE',
      module: 'MeasurementTemplate',
      recordId: template._id,
      description: `Updated measurement template '${template.name}' with ${template.fields?.length || 0} fields`,
      prevValues,
      newValues: template.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Measurement template updated successfully',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete measurement template
// @route DELETE /api/measurement-templates/:id
export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await MeasurementTemplate.findById(req.params.id);
    if (!template || !template.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Check if used in measurements
    const measurementUsage = await Measurement.countDocuments({ template: template._id, isActive: true });
    if (measurementUsage > 0) {
      return res.status(400).json({
        success: false,
        message: `Template is linked to ${measurementUsage} measurements. Please deactivate it instead of deleting.`,
      });
    }

    template.isActive = false;
    await template.save();

    await logAudit({
      req,
      action: 'DELETE',
      module: 'MeasurementTemplate',
      recordId: template._id,
      description: `Deactivated measurement template '${template.name}'`,
    });

    res.status(200).json({
      success: true,
      message: 'Measurement template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
