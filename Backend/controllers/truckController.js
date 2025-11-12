const Truck = require('../models/trucks');
const Staff = require('../models/staff');
const Team = require('../models/teams');
const Route = require('../models/routes');

const createTruck = async (req, res) => {
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can create trucks' });
  }

  const { plate_number, truckModel, truckCapacity, truckStatus } = req.body; // Fixed field names

  const cleanPlate = plate_number ? plate_number.trim().toUpperCase() : ''; // Fixed field name
  const cleanModel = truckModel ? truckModel.trim() : ''; // Fixed field name
  const cleanCapacity = parseFloat(truckCapacity); // Fixed field name

  if (!cleanPlate || !cleanModel || isNaN(cleanCapacity) || !truckStatus) { // Fixed field name
    return res.status(400).json({ message: 'Plate number, model, capacity, and status are required' });
  }

  if (!['operational', 'maintenance', 'inactive'].includes(truckStatus)) { // Fixed field name
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
      truckStatus: truckStatus, // Fixed field name
    });

    await newTruck.save();

    return res.status(201).json({
      message: 'Truck created successfully',
      truck: {
        _id: newTruck._id,
        plate_number: newTruck.plate_number,
        truckModel: newTruck.truckModel,
        truckCapacity: newTruck.truckCapacity,
        truckStatus: newTruck.truckStatus, // Fixed field name
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create truck' });
  }
};

const assignRouteToTruck = async (req, res) => {
  const { truck_id, team_members, street_ids, scheduled_date } = req.body;

  if (req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can assign routes' });
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
  const supervisor = team_members.find(member => member.role === 'supervisor' || member.role === 'manager');
  if (!supervisor) {
    return res.status(400).json({ message: 'Team must have a supervisor or manager' });
  }

  // Validate team members
  for (const member of team_members) {
    if (!member.user || !member.role) {
      return res.status(400).json({ message: 'Each team member must have a user ID and role' });
    }
    if (!['supervisor', 'driver', 'field_agent', 'manager'].includes(member.role)) {
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
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can view trucks' });
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


// Add this function to truckController.js
const getActiveRoutes = async (req, res) => {
  if (!req.user || req.user.role !== 'manager') {
    return res.status(403).json({ 
      success: false,
      message: 'Only managers can view all active routes' 
    });
  }

  try {
    // Find routes with active statuses
    const activeRoutes = await Route.find({ 
      status: { 
        $in: ['in_progress', 'at_dumpsite', 'paused'] 
      }
    })
    .populate('assigned_truck', 'plate_number truckModel truckCapacity truckStatus')
    .populate({
      path: 'assigned_team',
      populate: {
        path: 'team_members.user',
        select: 'full_name role'
      }
    })
    .populate('streets', 'name location _id')
    .populate('supervisor', 'full_name')
    .sort({ 'assignment_lifecycle.started_at': -1 })
    .lean();

    // Simple format - just return the essential data
    const formattedRoutes = activeRoutes.map(route => ({
      id: route._id.toString(),
      title: route.assigned_truck ? `Truck ${route.assigned_truck.plate_number}` : 'Unassigned Truck',
      supervisor: route.supervisor?.full_name || 'No supervisor',
      status: route.status,
      truck: route.assigned_truck,
      assignment_lifecycle: route.assignment_lifecycle,
      streets: route.streets || [],
      scheduled_date: route.scheduled_date
    }));

    return res.status(200).json({
      success: true,
      message: `Found ${formattedRoutes.length} active routes`,
      routes: formattedRoutes
    });

  } catch (error) {
    console.error('Get active routes error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve active routes: ${error.message}`,
    });
  }
};


// Add maintenance history function
const addMaintenanceRecord = async (req, res) => {
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can add maintenance records' });
  }

  const { truck_id, description } = req.body;

  if (!truck_id || !description?.trim()) {
    return res.status(400).json({ message: 'Truck ID and description are required' });
  }

  try {
    const truck = await Truck.findById(truck_id);
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    truck.maintenance_history.push({
      maintenance_date: new Date(),
      description: description.trim(),
    });

    // Update truck status to maintenance if not already
    if (truck.truckStatus !== 'maintenance') {
      truck.truckStatus = 'maintenance';
    }

    await truck.save();

    return res.status(200).json({
      message: 'Maintenance record added successfully',
      maintenance_record: truck.maintenance_history[truck.maintenance_history.length - 1],
    });
  } catch (error) {
    return res.status(500).json({
      message: `Failed to add maintenance record: ${error.message}`,
    });
  }
};

// Update truck status function
const updateTruckStatus = async (req, res) => {
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can update truck status' });
  }

  const { truck_id, truckStatus } = req.body;

  if (!truck_id || !truckStatus) {
    return res.status(400).json({ message: 'Truck ID and status are required' });
  }

  if (!['operational', 'maintenance', 'inactive'].includes(truckStatus)) {
    return res.status(400).json({ message: 'Status must be operational, maintenance, or inactive' });
  }

  try {
    const truck = await Truck.findById(truck_id);
    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    truck.truckStatus = truckStatus;
    await truck.save();

    return res.status(200).json({
      message: 'Truck status updated successfully',
      truck: {
        _id: truck._id,
        plate_number: truck.plate_number,
        truckStatus: truck.truckStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Failed to update truck status: ${error.message}`,
    });
  }
};

// Get ALL supervisor assignments (today and future)
const getAllSupervisorAssignments = async (req, res) => {
  if (!req.user || (req.user.role !== 'supervisor' && req.user.role !== 'manager')) {
    return res.status(403).json({ 
      success: false,
      message: 'Only supervisors and managers can view their assignments' 
    });
  }

  try {
    const supervisorId = req.user.id;
    
    // Get current date to filter future assignments
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Find ALL assignments for this supervisor (today and future)
    const assignments = await Route.find({ 
      supervisor: supervisorId,
      scheduled_date: {
        $gte: currentDate // Get today and future assignments
      }
    })
    .populate('assigned_truck', 'plate_number truckModel truckCapacity truckStatus')
    .populate({
      path: 'assigned_team',
      populate: {
        path: 'team_members.user',
        select: 'full_name role'
      }
    })
    .populate('streets', 'name location _id')
    .sort({ scheduled_date: 1 }) // Sort by date ascending (oldest first)
    .lean(); // Convert to plain JavaScript objects

    // Format the response with additional info
    const formattedAssignments = assignments.map(assignment => {
      const assignmentDate = new Date(assignment.scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let status = assignment.status;
      let statusLabel = assignment.status;
      
      // Override status for UI purposes
      if (assignment.status === 'scheduled') {
        if (assignmentDate.getTime() === today.getTime()) {
          statusLabel = 'Today';
        } else if (assignmentDate > today) {
          statusLabel = 'Upcoming';
        }
      }

      return {
        ...assignment,
        display_status: statusLabel,
        is_today: assignmentDate.getTime() === today.getTime(),
        is_future: assignmentDate > today
      };
    });

    return res.status(200).json({
      success: true,
      message: assignments.length > 0 ? 'All assignments retrieved successfully' : 'No assignments found',
      assignments: formattedAssignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('Get all supervisor assignments error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve assignments: ${error.message}`,
    });
  }
};


// Start assignment function
const startAssignment = async (req, res) => {
  if (!req.user || (req.user.role !== 'supervisor' && req.user.role !== 'manager')) {
    return res.status(403).json({ 
      success: false,
      message: 'Only supervisors and managers can start assignments' 
    });
  }

  const { assignment_id } = req.body;

  if (!assignment_id) {
    return res.status(400).json({ 
      success: false,
      message: 'Assignment ID is required' 
    });
  }

  try {
    const assignment = await Route.findById(assignment_id);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assignment not found' 
      });
    }

    // Check if assignment belongs to the current supervisor
    if (assignment.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only start your own assignments' 
      });
    }

    // Check if assignment is scheduled for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assignmentDate = new Date(assignment.scheduled_date);
    assignmentDate.setHours(0, 0, 0, 0);

    if (assignmentDate.getTime() !== today.getTime()) {
      return res.status(400).json({ 
        success: false,
        message: 'You can only start assignments scheduled for today' 
      });
    }

    // Check if assignment is already started or completed
    if (assignment.status !== 'scheduled') {
      return res.status(400).json({ 
        success: false,
        message: `Assignment is already ${assignment.status}` 
      });
    }

    // Update assignment status and start time
    assignment.status = 'in_progress';
    assignment.assignment_lifecycle.started_at = new Date();
    assignment.assignment_lifecycle.started_by = req.user.id;
    
    // Add start checkpoint
    assignment.assignment_lifecycle.checkpoints.push({
      type: 'start',
      timestamp: new Date(),
      notes: 'Assignment started by supervisor'
    });

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: 'Assignment started successfully',
      assignment: {
        _id: assignment._id,
        status: assignment.status,
        started_at: assignment.assignment_lifecycle.started_at,
        display_status: 'In Progress'
      }
    });

  } catch (error) {
    console.error('Start assignment error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to start assignment: ${error.message}`,
    });
  }
};
module.exports = {
  createTruck,
  assignRouteToTruck,
  getAllTrucks,
  getActiveRoutes,
  addMaintenanceRecord,
    getAllSupervisorAssignments, 
  updateTruckStatus,
  startAssignment
};