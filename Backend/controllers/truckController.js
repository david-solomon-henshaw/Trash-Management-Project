const Truck = require('../models/trucks');
const Staff = require('../models/staff');
const Team = require('../models/teams');
const Route = require('../models/truck_routes');

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




const assignRouteToTruck = async (req, res) => {
  const { truck_id, team_members, street_ids, scheduled_date } = req.body;

  if (req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can assign routes' });
  }

  // Validate inputs
  if (!Array.isArray(team_members) || team_members.length === 0) {
    return res.status(400).json({ message: 'Team members array is required and cannot be empty' });
  }

  if (!Array.isArray(street_ids) || street_ids.length === 0) {
    return res.status(400).json({ message: 'Streets array is required and cannot be empty' });
  }

  if (!scheduled_date) {
    return res.status(400).json({ message: 'Scheduled date is required' });
  }

  const parsedDate = new Date(scheduled_date);

  if (isNaN(parsedDate)) {
    return res.status(400).json({ message: 'Invalid scheduled date' });
  }

  // Find supervisor in team
  const supervisor = team_members.find(member => member.role === 'supervisor');
  if (!supervisor) {
    return res.status(400).json({ message: 'Team must have a supervisor' });
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
    // Check if truck exists
    const truck = await Truck.findById(truck_id);
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Create team
    const team = new Team({
      team_members: team_members,
      assignment_date: parsedDate,
      created_by: req.user.id
    });
    await team.save();

    // Create route
    const route = new Route({
      streets: street_ids,
      assigned_team: team._id,
      assigned_truck: truck_id,
      supervisor: supervisor.user,
      scheduled_date: parsedDate
    });
    await route.save();

    // Update truck assignment history
    truck.assignment_history.push({
      route: route._id,
      team: team._id,
      logged_at: new Date(),
    });
    await truck.save();

    return res.status(201).json({
      message: 'Route assigned successfully',
      route: {
        _id: route._id,
        name: route.name,
        scheduled_date: route.scheduled_date,
        status: route.status,
        assigned_truck: truck_id,
        assigned_team: team._id,
        supervisor: supervisor.user
      },
    });
  } catch (error) {
    return res.status(500).json({ message: `Failed to assign route: ${error.message}` });
  }
};

const getAllTrucks = async (req, res) => {
  if (req.user && req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can view trucks' });
  }

  try {
    const trucks = await Truck.find()
      .select('plate_number truckModel truckCapacity truckStatus assignment_history');

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

// New function for supervisors to get their assignments
const getSupervisorAssignments = async (req, res) => {
  if (!req.user || req.user.role !== 'supervisor') {
    return res.status(403).json({ message: 'Only supervisors can view their assignments' });
  }

  try {
    const supervisorId = req.user.id;

    const assignments = await Route.find({ supervisor: supervisorId })
      .populate('assigned_truck', 'plate_number truckModel truckCapacity truckStatus')
      .populate({
        path: 'assigned_team',
        populate: {
          path: 'team_members.user',
          select: 'full_name role'
        }
      })
      .populate('streets', 'name location')
      .sort({ scheduled_date: -1 });

    return res.status(200).json({
      message: 'Assignments retrieved successfully',
      assignments,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Failed to retrieve assignments: ${error.message}`,
    });
  }
};

module.exports = {
  createTruck,
  assignRouteToTruck,
  getAllTrucks,
  getSupervisorAssignments
};