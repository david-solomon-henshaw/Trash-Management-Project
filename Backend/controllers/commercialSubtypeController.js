const CommercialSubtype = require('../models/commercial');

// Fetch all commercial subtypes
const getAllCommercialSubtypes = async (req, res) => {
  try {
    const commercialSubtypes = await CommercialSubtype.find().sort({ created_at: -1 });

    const transformedSubtypes = commercialSubtypes.map(subtype => ({
      _id: subtype._id,
      name: subtype.name,
      base_fee: subtype.base_fee,
      created_at: subtype.created_at,
      updated_at: subtype.updated_at,
    }));

    return res.status(200).json({
      message: transformedSubtypes.length === 0 ? 'No commercial subtypes found' : 'Commercial subtypes found',
      commercialSubtypes: transformedSubtypes,
    });
  } catch (error) {
    console.error('Get all commercial subtypes error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Fetch single commercial subtype by ID
const getCommercialSubtypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const commercialSubtype = await CommercialSubtype.findById(id);

    if (!commercialSubtype) {
      return res.status(404).json({ message: 'Commercial subtype not found' });
    }

    const transformedSubtype = {
      _id: commercialSubtype._id,
      name: commercialSubtype.name,
      base_fee: commercialSubtype.base_fee,
      created_at: commercialSubtype.created_at,
      updated_at: commercialSubtype.updated_at,
    };

    return res.status(200).json({
      message: 'Commercial subtype found',
      commercialSubtype: transformedSubtype,
    });
  } catch (error) {
    console.error('Get commercial subtype by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid commercial subtype ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a new commercial subtype
const createCommercialSubtype = async (req, res) => {
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can create commercial subtypes' });
  }

  const { name, base_fee } = req.body;
  if (!name?.trim() || base_fee === undefined) {
    return res.status(400).json({ message: 'Name and base fee are required' });
  }

  try {
    const existingSubtype = await CommercialSubtype.findOne({ name: name.trim() });
    if (existingSubtype) {
      return res.status(400).json({ message: 'Commercial subtype name already exists' });
    }

    const commercialSubtype = new CommercialSubtype({
      name: name.trim(),
      base_fee,
    });

    await commercialSubtype.save();

    return res.status(201).json({
      message: `Commercial subtype ${name} added`,
      commercialSubtype: {
        _id: commercialSubtype._id,
        name: commercialSubtype.name,
        base_fee: commercialSubtype.base_fee,
        created_at: commercialSubtype.created_at,
        updated_at: commercialSubtype.updated_at,
      },
    });
  } catch (error) {
    console.error('Create commercial subtype error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllCommercialSubtypes,
  getCommercialSubtypeById,
  createCommercialSubtype,
};
