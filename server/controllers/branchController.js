import Branch from '../models/Branch.js';
import Person from '../models/Person.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc Get branches (filter by organization, search)
// @route GET /api/branches
export const getBranches = async (req, res, next) => {
  try {
    const { organization, search, status } = req.query;

    let query = { isActive: true };

    if (organization) {
      query.organization = organization;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }

    const branches = await Branch.find(query)
      .populate('organization', 'name code')
      .sort({ name: 1 });

    const branchesWithCount = await Promise.all(
      branches.map(async (b) => {
        const personCount = await Person.countDocuments({ branch: b._id, isActive: true });
        return {
          ...b.toObject(),
          personCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: branchesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single branch
// @route GET /api/branches/:id
export const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, isActive: true }).populate('organization', 'name code');
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    res.status(200).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create branch
// @route POST /api/branches
export const createBranch = async (req, res, next) => {
  try {
    const { organization, name, code, address, city, state, country, pincode, contactPerson, contactNumber, email, status, notes } = req.body;

    const branch = await Branch.create({
      organization,
      name,
      code: code ? code.toUpperCase() : undefined,
      address,
      city,
      state,
      country: country || 'India',
      pincode,
      contactPerson,
      contactNumber,
      email,
      status: status || 'Active',
      notes,
    });

    await branch.populate('organization', 'name code');

    await logAudit({
      req,
      action: 'CREATE',
      module: 'Branch',
      recordId: branch._id,
      description: `Created branch ${branch.name} for organization ${branch.organization?.name}`,
      newValues: branch.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update branch
// @route PUT /api/branches/:id
export const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch || !branch.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    const prevValues = branch.toObject();

    Object.assign(branch, req.body);
    if (req.body.code) branch.code = req.body.code.toUpperCase();

    await branch.save();
    await branch.populate('organization', 'name code');

    await logAudit({
      req,
      action: 'UPDATE',
      module: 'Branch',
      recordId: branch._id,
      description: `Updated branch ${branch.name}`,
      prevValues,
      newValues: branch.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete branch
// @route DELETE /api/branches/:id
export const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch || !branch.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found',
      });
    }

    const personCount = await Person.countDocuments({ branch: branch._id, isActive: true });
    if (personCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete branch with ${personCount} active persons assigned to it.`,
      });
    }

    branch.isActive = false;
    await branch.save();

    await logAudit({
      req,
      action: 'DELETE',
      module: 'Branch',
      recordId: branch._id,
      description: `Deactivated branch ${branch.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'Branch deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
