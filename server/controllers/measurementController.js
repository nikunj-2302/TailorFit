import Measurement from '../models/Measurement.js';
import Person from '../models/Person.js';
import GarmentType from '../models/GarmentType.js';
import MeasurementTemplate from '../models/MeasurementTemplate.js';
import { logAudit } from '../utils/auditLogger.js';

// Helper to generate measurement number
const generateMeasurementNumber = async () => {
  const count = await Measurement.countDocuments();
  const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
  return `MEA-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// @desc Get measurements with search, filters, pagination
// @route GET /api/measurements
export const getMeasurements = async (req, res, next) => {
  try {
    const {
      person,
      organization,
      branch,
      garment,
      gender,
      isLatestOnly = 'true',
      search,
      page = 1,
      limit = 50,
    } = req.query;

    let query = { isActive: true };

    if (isLatestOnly === 'true') {
      query.isLatest = true;
    }

    if (person) query.person = person;
    if (organization) query.organization = organization;
    if (branch) query.branch = branch;
    if (garment) query.garment = garment;
    if (gender && gender !== 'All') query.gender = gender;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Measurement.countDocuments(query);

    let measurementsQuery = Measurement.find(query)
      .populate('person', 'fullName personId mobileNumber department professionType')
      .populate('organization', 'name code')
      .populate('branch', 'name code')
      .populate('garment', 'name code category')
      .populate('template', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const measurements = await measurementsQuery;

    res.status(200).json({
      success: true,
      data: measurements,
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

// @desc Get single measurement by ID (includes history trail)
// @route GET /api/measurements/:id
export const getMeasurementById = async (req, res, next) => {
  try {
    const measurement = await Measurement.findOne({ _id: req.params.id, isActive: true })
      .populate('person', 'fullName personId mobileNumber email department designation professionType')
      .populate('organization', 'name code')
      .populate('branch', 'name code')
      .populate('garment', 'name code category')
      .populate('template', 'name fields')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!measurement) {
      return res.status(404).json({
        success: false,
        message: 'Measurement record not found',
      });
    }

    // Fetch version history for this specific person and garment
    const versionHistory = await Measurement.find({
      person: measurement.person._id,
      garment: measurement.garment._id,
      isActive: true,
    })
      .sort({ version: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: {
        ...measurement.toObject(),
        versionHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get complete measurement history for a Person
// @route GET /api/measurements/person/:personId
export const getPersonMeasurementHistory = async (req, res, next) => {
  try {
    const { personId } = req.params;

    const history = await Measurement.find({ person: personId, isActive: true })
      .populate('garment', 'name code category')
      .populate('template', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Save multiple measurements at once (Batch creation for a Person)
// @route POST /api/measurements/batch
export const createMeasurementsBatch = async (req, res, next) => {
  try {
    const { personId, organizationId, branchId, garments } = req.body;

    if (!personId || !garments || !Array.isArray(garments) || garments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Person and at least one garment measurement are required.',
      });
    }

    const person = await Person.findById(personId);
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found',
      });
    }

    const savedMeasurements = [];

    for (const item of garments) {
      const { garmentId, templateId, values, unit = 'Inch', notes } = item;

      // Check if there is an existing latest measurement for this person and garment
      const existingLatest = await Measurement.findOne({
        person: person._id,
        garment: garmentId,
        isLatest: true,
        isActive: true,
      });

      let version = 1;
      let previousVersionId = null;

      if (existingLatest) {
        version = existingLatest.version + 1;
        previousVersionId = existingLatest._id;
        // Mark the previous one as not latest
        existingLatest.isLatest = false;
        existingLatest.status = 'Archived';
        await existingLatest.save();
      }

      const measurementNumber = await generateMeasurementNumber();

      const newMeasurement = await Measurement.create({
        measurementNumber,
        person: person._id,
        organization: organizationId || person.organization,
        branch: branchId || person.branch,
        garment: garmentId,
        template: templateId || null,
        gender: person.gender,
        professionType: person.professionType,
        unit,
        values: values || [],
        version,
        isLatest: true,
        previousVersion: previousVersionId,
        notes,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
        status: 'Active',
      });

      await newMeasurement.populate('garment', 'name code category');
      savedMeasurements.push(newMeasurement);

      await logAudit({
        req,
        action: existingLatest ? 'VERSION_CREATE' : 'CREATE',
        module: 'Measurement',
        recordId: newMeasurement._id,
        description: `Saved Measurement (v${version}) for ${person.fullName} - ${newMeasurement.garment?.name}`,
        newValues: newMeasurement.toObject(),
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully saved ${savedMeasurements.length} garment measurement(s)`,
      data: savedMeasurements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new version of an existing measurement (Preserves history)
// @route POST /api/measurements/:id/new-version
export const createNewVersion = async (req, res, next) => {
  try {
    const existing = await Measurement.findById(req.params.id);
    if (!existing || !existing.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Original measurement not found',
      });
    }

    const { values, unit, notes } = req.body;

    // Archive current latest
    existing.isLatest = false;
    existing.status = 'Archived';
    await existing.save();

    const measurementNumber = await generateMeasurementNumber();

    const newVersion = await Measurement.create({
      measurementNumber,
      person: existing.person,
      organization: existing.organization,
      branch: existing.branch,
      garment: existing.garment,
      template: existing.template,
      gender: existing.gender,
      professionType: existing.professionType,
      unit: unit || existing.unit,
      values: values || existing.values,
      version: existing.version + 1,
      isLatest: true,
      previousVersion: existing._id,
      notes: notes !== undefined ? notes : existing.notes,
      createdBy: req.user?._id || existing.createdBy,
      updatedBy: req.user?._id,
      status: 'Active',
    });

    await newVersion.populate('person', 'fullName personId');
    await newVersion.populate('garment', 'name code');

    await logAudit({
      req,
      action: 'VERSION_CREATE',
      module: 'Measurement',
      recordId: newVersion._id,
      description: `Created new version (v${newVersion.version}) for ${newVersion.person?.fullName} - ${newVersion.garment?.name}`,
      prevValues: existing.toObject(),
      newValues: newVersion.toObject(),
    });

    res.status(201).json({
      success: true,
      message: `New version (v${newVersion.version}) created successfully without overwriting history`,
      data: newVersion,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Duplicate measurement
// @route POST /api/measurements/:id/duplicate
export const duplicateMeasurement = async (req, res, next) => {
  try {
    const existing = await Measurement.findById(req.params.id);
    if (!existing || !existing.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Measurement not found',
      });
    }

    const { targetPersonId } = req.body;
    const targetPerson = targetPersonId ? await Person.findById(targetPersonId) : await Person.findById(existing.person);

    if (!targetPerson) {
      return res.status(404).json({
        success: false,
        message: 'Target person not found',
      });
    }

    const measurementNumber = await generateMeasurementNumber();

    const duplicate = await Measurement.create({
      measurementNumber,
      person: targetPerson._id,
      organization: targetPerson.organization,
      branch: targetPerson.branch,
      garment: existing.garment,
      template: existing.template,
      gender: targetPerson.gender,
      professionType: targetPerson.professionType,
      unit: existing.unit,
      values: existing.values,
      version: 1,
      isLatest: true,
      previousVersion: null,
      notes: `Duplicated from ${existing.measurementNumber}. ${existing.notes || ''}`.trim(),
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
      status: 'Active',
    });

    await duplicate.populate('person', 'fullName personId');
    await duplicate.populate('garment', 'name code');

    await logAudit({
      req,
      action: 'CREATE',
      module: 'Measurement',
      recordId: duplicate._id,
      description: `Duplicated measurement ${existing.measurementNumber} to ${duplicate.measurementNumber} for ${targetPerson.fullName}`,
    });

    res.status(201).json({
      success: true,
      message: 'Measurement duplicated successfully',
      data: duplicate,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Soft delete / archive measurement
// @route DELETE /api/measurements/:id
export const deleteMeasurement = async (req, res, next) => {
  try {
    const measurement = await Measurement.findById(req.params.id);
    if (!measurement || !measurement.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Measurement not found',
      });
    }

    measurement.isActive = false;
    await measurement.save();

    await logAudit({
      req,
      action: 'DELETE',
      module: 'Measurement',
      recordId: measurement._id,
      description: `Deactivated measurement ${measurement.measurementNumber}`,
    });

    res.status(200).json({
      success: true,
      message: 'Measurement record archived successfully',
    });
  } catch (error) {
    next(error);
  }
};
