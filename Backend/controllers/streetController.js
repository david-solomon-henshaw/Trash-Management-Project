const Street = require('../models/street');

const addStreet = async (req, res) => {
  if (req.user && req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can create trucks' });
  }
  
  const { streetName, details } = req.body;

  if (!streetName?.trim()) {
    return res.status(400).json({ message: 'Street name is required' });
  }

  try {
    const existingStreet = await Street.findOne({ name: streetName.trim() });
    if (existingStreet) {
      return res.status(400).json({ message: 'Street name already exists' });
    }

    const street = new Street({
      name: streetName.trim(),
      details: details?.trim() || '',
    });
    await street.save();

    return res.status(201).json({
      message: `Street ${streetName} added`,
      street: { id: street._id, name: street.name, details: street.details },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllStreets = async (req, res) => {
  try {
    const streets = await Street.find();
    if (streets.length === 0) {
      return res.status(200).json({ message: 'No streets found', streets: [] });
    }
    return res.status(200).json({ message: 'Streets found', streets });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addStreet, getAllStreets };