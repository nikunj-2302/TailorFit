import Organization from '../models/Organization.js';
import Branch from '../models/Branch.js';
import Person from '../models/Person.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc Get all organizations (with search, filter, pagination)
// @route GET /api/organizations
export const getOrganizations = async (req, res, next) => {
  try {
    const { search, type, status, page = 1, limit = 50 } = req.query;

    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Organization.countDocuments(query);
    const organizations = await Organization.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get branch counts and person counts for each organization
    const orgsWithCounts = await Promise.all(
      organizations.map(async (org) => {
        const branchCount = await Branch.countDocuments({ organization: org._id, isActive: true });
        const personCount = await Person.countDocuments({ organization: org._id, isActive: true });
        return {
          ...org.toObject(),
          branchCount,
          personCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: orgsWithCounts,
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

// @desc Get single organization by ID
// @route GET /api/organizations/:id
export const getOrganizationById = async (req, res, next) => {
  try {
    const organization = await Organization.findOne({ _id: req.params.id, isActive: true });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const branches = await Branch.find({ organization: organization._id, isActive: true });
    const personCount = await Person.countDocuments({ organization: organization._id, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        ...organization.toObject(),
        branches,
        personCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new organization
// @route POST /api/organizations
export const createOrganization = async (req, res, next) => {
  try {
    const { name, code, type, contactPerson, contactNumber, email, address, city, state, country, pincode, status, notes } = req.body;

    const existing = await Organization.findOne({ code: code?.toUpperCase(), isActive: true });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Organization code '${code}' already exists.`,
      });
    }

    const organization = await Organization.create({
      name,
      code: code ? code.toUpperCase() : name.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900),
      type: type || 'Corporate',
      contactPerson,
      contactNumber,
      email,
      address,
      city,
      state,
      country: country || 'India',
      pincode,
      status: status || 'Active',
      notes,
    });

    await logAudit({
      req,
      action: 'CREATE',
      module: 'Organization',
      recordId: organization._id,
      description: `Created organization ${organization.name} (${organization.code})`,
      newValues: organization.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update organization
// @route PUT /api/organizations/:id
export const updateOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization || !organization.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const prevValues = organization.toObject();

    Object.assign(organization, req.body);
    if (req.body.code) organization.code = req.body.code.toUpperCase();

    await organization.save();

    await logAudit({
      req,
      action: 'UPDATE',
      module: 'Organization',
      recordId: organization._id,
      description: `Updated organization ${organization.name}`,
      prevValues,
      newValues: organization.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Soft delete organization
// @route DELETE /api/organizations/:id
export const deleteOrganization = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization || !organization.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Check if persons or branches exist
    const personCount = await Person.countDocuments({ organization: organization._id, isActive: true });
    if (personCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete organization with ${personCount} active persons. Deactivate instead.`,
      });
    }

    organization.isActive = false;
    await organization.save();

    await logAudit({
      req,
      action: 'DELETE',
      module: 'Organization',
      recordId: organization._id,
      description: `Deactivated organization ${organization.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
