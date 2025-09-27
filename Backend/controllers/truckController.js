const Truck = require('../models/trucks')

const createTruck = async (req, res) => {
  // Check if user is CEO
  if (req.user && req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can create trucks' });
  }

  const { plate, model, capacity, status } = req.body;

  // Clean inputs
  const cleanPlate = plate ? plate.trim().toUpperCase() : '';
  const cleanModel = model ? model.trim() : '';
  const cleanCapacity = parseFloat(capacity);

  // Validate fields
  if (!cleanPlate || !cleanModel || isNaN(cleanCapacity) || !status) {
    return res.status(400).json({ message: 'Plate number, model, capacity, and status are required' });
  }

  if (!['operational', 'maintenance', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status must be operational, maintenance, or inactive' });
  }

  if (cleanCapacity < 0) {
    return res.status(400).json({ message: 'Capacity must be a non-negative number' });
  }

  try {
    // Check for duplicate plate
    const existingTruck = await Truck.findOne({ plate_number: cleanPlate });
    if (existingTruck) {
      return res.status(409).json({ message: `Truck with plate number ${cleanPlate} already exists` });
    }

    // Create truck
    const newTruck = new Truck({
      plate_number: cleanPlate,
      truckModel: cleanModel,
      truckCapacity: cleanCapacity,
      truckStatus: status,
    });

    await newTruck.save();

    return res.status(201).json({
      message: 'Truck created successfully',
      truck: {
        _id: newTruck._id,
        plate_number: newTruck.plate_number,
        truckModel: newTruck.truckModel,
        truckCapacity: newTruck.truckCapacity,
        truckStatus: newTruck.truckStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create truck' });
  }
};

module.exports = { createTruck };
