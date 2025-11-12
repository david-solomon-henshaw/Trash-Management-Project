const Street = require('../models/street');

// Existing function (keep as is)
const addStreet = async (req, res) => {
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can create streets' });
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
      street: { 
        _id: street._id, 
        streetName: street.name, 
        details: street.details,
        createdAt: street.createdAt,
        updatedAt: street.updatedAt
      },
    });
  } catch (error) {
    console.error('Add street error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Existing function - Updated to match frontend expectations
const getAllStreets = async (req, res) => {
  try {
    const streets = await Street.find().sort({ createdAt: -1 }); // Sort by newest first
    
    // Transform data to match frontend expectations
    const transformedStreets = streets.map(street => ({
      _id: street._id,
      streetName: street.name,
      details: street.details,
      createdAt: street.createdAt,
      updatedAt: street.updatedAt
    }));
    
    return res.status(200).json({ 
      message: transformedStreets.length === 0 ? 'No streets found' : 'Streets found', 
      streets: transformedStreets 
    });
  } catch (error) {
    console.error('Get all streets error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Get single street by ID
const getStreetById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const street = await Street.findById(id);
    
    if (!street) {
      return res.status(404).json({ message: 'Street not found' });
    }
    
    // Transform data to match frontend expectations
    const transformedStreet = {
      _id: street._id,
      streetName: street.name,
      details: street.details,
      createdAt: street.createdAt,
      updatedAt: street.updatedAt
    };
    
    return res.status(200).json({ 
      message: 'Street found', 
      street: transformedStreet 
    });
  } catch (error) {
    console.error('Get street by ID error:', error);
    
    // Handle invalid MongoDB ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid street ID' });
    }
    
    return res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Update street
const updateStreet = async (req, res) => {
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can update streets' });
  }
  
  try {
    const { id } = req.params;
    const { streetName, details } = req.body;
    
    // Validate input
    if (!streetName?.trim()) {
      return res.status(400).json({ message: 'Street name is required' });
    }
    
    // Check if street exists
    const street = await Street.findById(id);
    if (!street) {
      return res.status(404).json({ message: 'Street not found' });
    }
    
    // Check if new name already exists (if name is being changed)
    if (streetName.trim().toLowerCase() !== street.name.toLowerCase()) {
      const existingStreet = await Street.findOne({ 
        name: streetName.trim(),
        _id: { $ne: id } // Exclude current street from check
      });
      
      if (existingStreet) {
        return res.status(400).json({ message: 'Street name already exists' });
      }
    }
    
    // Update street
    street.name = streetName.trim();
    street.details = details?.trim() || '';
    await street.save();
    
    // Transform data to match frontend expectations
    const transformedStreet = {
      _id: street._id,
      streetName: street.name,
      details: street.details,
      createdAt: street.createdAt,
      updatedAt: street.updatedAt
    };
    
    return res.status(200).json({ 
      message: 'Street updated successfully', 
      street: transformedStreet 
    });
  } catch (error) {
    console.error('Update street error:', error);
    
    // Handle invalid MongoDB ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid street ID' });
    }
    
    return res.status(500).json({ message: 'Server error' });
  }
};

// NEW: Delete street
const deleteStreet = async (req, res) => {
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can delete streets' });
  }
  
  try {
    const { id } = req.params;
    
    const street = await Street.findById(id);
    
    if (!street) {
      return res.status(404).json({ message: 'Street not found' });
    }
    
    // Optional: Check if street is being used by any customers/orders
    // You can add this check based on your business logic
    // const customersUsingStreet = await Customer.countDocuments({ street: id });
    // if (customersUsingStreet > 0) {
    //   return res.status(400).json({ 
    //     message: `Cannot delete street. ${customersUsingStreet} customer(s) are using this street.` 
    //   });
    // }
    
    await Street.findByIdAndDelete(id);
    
    return res.status(200).json({ 
      message: 'Street deleted successfully',
      deletedStreet: {
        _id: street._id,
        streetName: street.name
      }
    });
  } catch (error) {
    console.error('Delete street error:', error);
    
    // Handle invalid MongoDB ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid street ID' });
    }
    
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  addStreet, 
  getAllStreets, 
  getStreetById, 
  updateStreet, 
  deleteStreet 
};