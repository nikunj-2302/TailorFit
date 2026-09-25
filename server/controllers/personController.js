import Person from '../models/Person.js';
import Measurement from '../models/Measurement.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc Get persons with search, filters, pagination
// @route GET /api/persons
export const getPersons = async (req, res, next) => {
  try {
    const {
      search,
      organization,
      branch,
      gender,
      professionType,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    let query = { isActive: true };

    if (organization) query.organization = organization;
    if (branch) query.branch = branch;
    if (gender && gender !== 'All') query.gender = gender;
    if (professionType && professionType !== 'All') query.professionType = professionType;
    if (status && status !== 'All') query.status = status;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { personId: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Person.countDocuments(query);
    const persons = await Person.find(query)
      .populate('organization', 'name code')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Also fetch measurement count for each person
    const personsWithMeasurements = await Promise.all(
      persons.map(async (p) => {
        const measurementCount = await Measurement.countDocuments({ person: p._id, isLatest: true, isActive: true });
        return {
          ...p.toObject(),
          measurementCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: personsWithMeasurements,
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

// @desc Get single person by ID
// @route GET /api/persons/:id
export const getPersonById = async (req, res, next) => {
  try {
    const person = await Person.findOne({ _id: req.params.id, isActive: true })
      .populate('organization', 'name code')
      .populate('branch', 'name code');

    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found',
      });
    }

    const measurements = await Measurement.find({ person: person._id, isLatest: true, isActive: true })
      .populate('garment', 'name code category')
      .populate('template', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...person.toObject(),
        measurements,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new person
// @route POST /api/persons
export const createPerson = async (req, res, next) => {
  try {
    const {
      personId,
      fullName,
      gender,
      mobileNumber,
      email,
      organization,
      branch,
      department,
      designation,
      professionType,
      notes,
      status,
    } = req.body;

    const generatedId = personId || `EMP-${Math.floor(100000 + Math.random() * 900000)}`;

    const person = await Person.create({
      personId: generatedId,
      fullName,
      gender: gender || 'Male',
      mobileNumber,
      email,
      organization,
      branch: branch || null,
      department,
      designation,
      professionType: professionType || 'Staff',
      notes,
      status: status || 'Active',
    });

    await person.populate('organization', 'name code');
    if (person.branch) await person.populate('branch', 'name code');

    await logAudit({
      req,
      action: 'CREATE',
      module: 'Person',
      recordId: person._id,
      description: `Created person ${person.fullName} (${person.personId}) at ${person.organization?.name}`,
      newValues: person.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: person,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update person
// @route PUT /api/persons/:id
export const updatePerson = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person || !person.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Person not found',
      });
    }

    const prevValues = person.toObject();

    Object.assign(person, req.body);
    await person.save();

    await person.populate('organization', 'name code');
    if (person.branch) await person.populate('branch', 'name code');

    await logAudit({
      req,
      action: 'UPDATE',
      module: 'Person',
      recordId: person._id,
      description: `Updated person ${person.fullName}`,
      prevValues,
      newValues: person.toObject(),
    });

    res.status(200).json({
      success: true,
      message: 'Person updated successfully',
      data: person,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete person
// @route DELETE /api/persons/:id
export const deletePerson = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person || !person.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Person not found',
      });
    }

    person.isActive = false;
    await person.save();

    await logAudit({
      req,
      action: 'DELETE',
      module: 'Person',
      recordId: person._id,
      description: `Deactivated person ${person.fullName}`,
    });

    res.status(200).json({
      success: true,
      message: 'Person deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};
