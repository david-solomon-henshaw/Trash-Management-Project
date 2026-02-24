const InstitutionalSubtype = require('../models/institutional');

// Fetch all institutional subtypes
const getAllInstitutionalSubtypes = async (req, res) => {
  try {
    const institutionalSubtypes = await InstitutionalSubtype.find({ companyId: req.user.companyId }).sort({ created_at: -1 });
    const transformedInstitutionalSubtypes = institutionalSubtypes.map(institutionalSubtype => ({
      _id: institutionalSubtype._id,
      name: institutionalSubtype.name,
      base_fee: institutionalSubtype.base_fee,
      created_at: institutionalSubtype.created_at,
      updated_at: institutionalSubtype.updated_at,
    }));
    return res.status(200).json({
      message: transformedInstitutionalSubtypes.length === 0 ? 'No institutional subtypes found' : 'Institutional subtypes found',
      institutionalSubtypes: transformedInstitutionalSubtypes,
    });
  } catch (error) {
    console.error('Get all institutional subtypes error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Fetch single institutional subtype by ID
const getInstitutionalSubtypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionalSubtype = await InstitutionalSubtype.findOne({ _id: id, companyId: req.user.companyId });
    if (!institutionalSubtype) {
      return res.status(404).json({ message: 'Institutional subtype not found' });
    }
    const transformedInstitutionalSubtype = {
      _id: institutionalSubtype._id,
      name: institutionalSubtype.name,
      base_fee: institutionalSubtype.base_fee,
      created_at: institutionalSubtype.created_at,
      updated_at: institutionalSubtype.updated_at,
    };
    return res.status(200).json({
      message: 'Institutional subtype found',
      institutionalSubtype: transformedInstitutionalSubtype,
    });
  } catch (error) {
    console.error('Get institutional subtype by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid institutional subtype ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a new institutional subtype
const createInstitutionalSubtype = async (req, res) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can create institutional subtypes' });
  }

  const { name, base_fee } = req.body;
  if (!name?.trim() || base_fee === undefined) {
    return res.status(400).json({ message: 'Name and base fee are required' });
  }

  try {
    const existingInstitutionalSubtype = await InstitutionalSubtype.findOne({ name: name.trim(), companyId: req.user.companyId });
    if (existingInstitutionalSubtype) {
      return res.status(400).json({ message: 'Institutional subtype name already exists' });
    }

    const institutionalSubtype = new InstitutionalSubtype({
      companyId: req.user.companyId,
      name: name.trim(),
      base_fee,
    });

    await institutionalSubtype.save();

    return res.status(201).json({
      message: `Institutional subtype ${name} added`,
      institutionalSubtype: {
        _id: institutionalSubtype._id,
        name: institutionalSubtype.name,
        base_fee: institutionalSubtype.base_fee,
        created_at: institutionalSubtype.created_at,
        updated_at: institutionalSubtype.updated_at,
      },
    });
  } catch (error) {
    console.error('Create institutional subtype error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update an institutional subtype
const updateInstitutionalSubtype = async (req, res) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can update institutional subtypes' });
  }

  const { id } = req.params;
  const { name, base_fee } = req.body;

  if (!name?.trim() || base_fee === undefined) {
    return res.status(400).json({ message: 'Name and base fee are required' });
  }

  try {
    const institutionalSubtype = await InstitutionalSubtype.findOne({ _id: id, companyId: req.user.companyId });
    if (!institutionalSubtype) {
      return res.status(404).json({ message: 'Institutional subtype not found' });
    }

    // Check if name already exists (excluding current document)
    const existingInstitutionalSubtype = await InstitutionalSubtype.findOne({
      name: name.trim(),
      companyId: req.user.companyId,
      _id: { $ne: id }
    });
    if (existingInstitutionalSubtype) {
      return res.status(400).json({ message: 'Institutional subtype name already exists' });
    }

    institutionalSubtype.name = name.trim();
    institutionalSubtype.base_fee = base_fee;
    institutionalSubtype.updated_at = Date.now();

    await institutionalSubtype.save();

    return res.status(200).json({
      message: `Institutional subtype ${name} updated`,
      institutionalSubtype: {
        _id: institutionalSubtype._id,
        name: institutionalSubtype.name,
        base_fee: institutionalSubtype.base_fee,
        created_at: institutionalSubtype.created_at,
        updated_at: institutionalSubtype.updated_at,
      },
    });
  } catch (error) {
    console.error('Update institutional subtype error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid institutional subtype ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete an institutional subtype
const deleteInstitutionalSubtype = async (req, res) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can delete institutional subtypes' });
  }

  const { id } = req.params;

  try {
    const institutionalSubtype = await InstitutionalSubtype.findOneAndDelete({ _id: id, companyId: req.user.companyId });
    if (!institutionalSubtype) {
      return res.status(404).json({ message: 'Institutional subtype not found' });
    }

    return res.status(200).json({
      message: `Institutional subtype ${institutionalSubtype.name} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete institutional subtype error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid institutional subtype ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllInstitutionalSubtypes,
  getInstitutionalSubtypeById,
  createInstitutionalSubtype,
  updateInstitutionalSubtype,
  deleteInstitutionalSubtype,
};