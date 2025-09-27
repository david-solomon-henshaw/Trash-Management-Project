const Truck = require('../models/trucks');
const Staff = require('../models/staff');

const createTruck = async (req, res) => {
  if (req.user && req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can create trucks' });
  }

  const { plate, model, capacity, status } = req.body;

  const cleanPlate = plate ? plate.trim().toUpperCase() : '';
  const cleanModel = model ? model.trim() : '';
  const cleanCapacity = parseFloat(capacity);

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
    const existingTruck = await Truck.findOne({ plate_number: cleanPlate });
    if (existingTruck) {
      return res.status(409).json({ message: `Truck with plate number ${cleanPlate} already exists` });
    }

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

const assignTeamToTruck = async (req, res) => {
  const { id } = req.params; // Truck ID
  const { team_members, assignment_date } = req.body; // team_members: [{ user, role }], date

  if (req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can assign teams' });
  }

  // Validate inputs
  if (!Array.isArray(team_members) || team_members.length === 0) {
    return res.status(400).json({ message: 'Team members array is required and cannot be empty' });
  }

  if (!assignment_date) {
    return res.status(400).json({ message: 'Assignment date is required' });
  }

  const parsedDate = new Date(assignment_date);
  if (isNaN(parsedDate)) {
    return res.status(400).json({ message: 'Invalid assignment date' });
  }

  // Validate team members
  for (const member of team_members) {
    if (!member.user || !member.role) {
      return res.status(400).json({ message: 'Each team member must have a user ID and role' });
    }
    if (!['supervisor', 'driver', 'field_agent'].includes(member.role)) {
      return res.status(400).json({ message: 'Invalid role. Must be supervisor, driver, or field_agent' });
    }
    const user = await Staff.findById(member.user);
    if (!user) {
      return res.status(400).json({ message: `Staff ID ${member.user} not found` });
    }
  }

  try {
    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Log current assigned_team to assignment_history
    if (truck.assigned_team && truck.assigned_team.length > 0) {
      truck.assignment_history.push({
        assigned_team: truck.assigned_team,
        logged_at: new Date(),
      });
    }

    // Assign new team with date
    truck.assigned_team = team_members.map(member => ({
      user: member.user,
      role: member.role,
      date: parsedDate,
    }));
    await truck.save();

    return res.status(200).json({
      message: 'Team assigned successfully',
      truck: {
        _id: truck._id,
        plate_number: truck.plate_number,
        truckModel: truck.truckModel,
        truckCapacity: truck.truckCapacity,
        truckStatus: truck.truckStatus,
        assigned_team: truck.assigned_team,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: `Failed to assign team: ${error.message}` });
  }
};

const getAllTrucks = async (req, res) => {
  if (req.user && req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can view trucks' });
  }

  try {
    const trucks = await Truck.find()
      .select('plate_number truckModel truckCapacity truckStatus assigned_team')
      .populate('assigned_team.user', 'full_name'); // Populate user names

    if (trucks.length === 0) {
      return res.status(200).json({
        message: 'No trucks found in the database',
        trucks: [],
      });
    }

    return res.status(200).json({
      message: 'Trucks retrieved successfully',
      trucks,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Failed to retrieve trucks: ${error.message}`,
    });
  }
};

module.exports = { createTruck, assignTeamToTruck, getAllTrucks };
