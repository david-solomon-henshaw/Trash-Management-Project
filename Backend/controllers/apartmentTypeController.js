const ApartmentType = require('../models/apartment');

// Fetch all apartment types
const getAllApartmentTypes = async (req, res) => {
  try {
    const apartmentTypes = await ApartmentType.find().sort({ created_at: -1 });
    const transformedApartmentTypes = apartmentTypes.map(apartmentType => ({
      _id: apartmentType._id,
      name: apartmentType.name,
      base_fee: apartmentType.base_fee,
      created_at: apartmentType.created_at,
      updated_at: apartmentType.updated_at,
    }));
    return res.status(200).json({
      message: transformedApartmentTypes.length === 0 ? 'No apartment types found' : 'Apartment types found',
      apartmentTypes: transformedApartmentTypes,
    });
  } catch (error) {
    console.error('Get all apartment types error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Fetch single apartment type by ID
const getApartmentTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const apartmentType = await ApartmentType.findById(id);
    if (!apartmentType) {
      return res.status(404).json({ message: 'Apartment type not found' });
    }
    const transformedApartmentType = {
      _id: apartmentType._id,
      name: apartmentType.name,
      base_fee: apartmentType.base_fee,
      created_at: apartmentType.created_at,
      updated_at: apartmentType.updated_at,
    };
    return res.status(200).json({
      message: 'Apartment type found',
      apartmentType: transformedApartmentType,
    });
  } catch (error) {
    console.error('Get apartment type by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid apartment type ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a new apartment type
const createApartmentType = async (req, res) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can create apartment types' });
  }

  const { name, base_fee } = req.body;
  if (!name?.trim() || base_fee === undefined) {
    return res.status(400).json({ message: 'Name and base fee are required' });
  }

  try {
    const existingApartmentType = await ApartmentType.findOne({ name: name.trim() });
    if (existingApartmentType) {
      return res.status(400).json({ message: 'Apartment type name already exists' });
    }

    const apartmentType = new ApartmentType({
      name: name.trim(),
      base_fee,
    });

    await apartmentType.save();

    return res.status(201).json({
      message: `Apartment type ${name} added`,
      apartmentType: {
        _id: apartmentType._id,
        name: apartmentType.name,
        base_fee: apartmentType.base_fee,
        created_at: apartmentType.created_at,
        updated_at: apartmentType.updated_at,
      },
    });
  } catch (error) {
    console.error('Create apartment type error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllApartmentTypes,
  getApartmentTypeById,
  createApartmentType,
};
