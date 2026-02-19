const Truck = require('../models/trucks');
const Staff = require('../models/staff');
const Team = require('../models/teams');
const Route = require('../models/routes');

const createTruck = async (req, res) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can create trucks' });
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

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can assign routes' });
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
  const supervisor = team_members.find(member => member.role === 'supervisor' || member.role === 'admin');
  if (!supervisor) {
    return res.status(400).json({ message: 'Team must have a supervisor or admin' });
  }

  // Validate team members
  for (const member of team_members) {
    if (!member.user || !member.role) {
      return res.status(400).json({ message: 'Each team member must have a user ID and role' });
    }
    if (!['supervisor', 'driver', 'field_agent', 'admin'].includes(member.role)) {
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
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can view trucks' });
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
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Only admins can view all active routes' 
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

    // Enhanced formatting with complete location data
    const formattedRoutes = activeRoutes.map(route => {
      // Extract current location with proper fallbacks
      const currentLocation = route.assignment_lifecycle?.current_location || 
                            route.assignment_lifecycle?.location_history?.[0] || 
                            null;

      // Format location for map display
      const mapLocation = currentLocation ? {
        latitude: currentLocation.latitude || 0,
        longitude: currentLocation.longitude || 0,
        accuracy: currentLocation.accuracy || 0,
        speed: currentLocation.speed || 0,
        timestamp: currentLocation.timestamp || new Date().toISOString(),
        battery_level: currentLocation.battery_level || null
      } : null;

      // Get last checkpoint or start location
      const lastCheckpoint = route.assignment_lifecycle?.checkpoints?.slice(-1)[0] || null;
      const startLocation = route.assignment_lifecycle?.checkpoints?.find(cp => cp.type === 'start') || null;

      return {
        id: route._id.toString(),
        title: route.assigned_truck ? `Truck ${route.assigned_truck.plate_number}` : 'Unassigned Truck',
        supervisor: route.supervisor?.full_name || 'No supervisor',
        status: route.status,
        truck: route.assigned_truck ? {
          _id: route.assigned_truck._id,
          plate_number: route.assigned_truck.plate_number,
          truckModel: route.assigned_truck.truckModel,
          truckCapacity: route.assigned_truck.truckCapacity,
          truckStatus: route.assigned_truck.truckStatus
        } : null,
        assignment_lifecycle: {
          current_location: mapLocation,
          location_history: route.assignment_lifecycle?.location_history || [],
          checkpoints: route.assignment_lifecycle?.checkpoints || [],
          started_at: route.assignment_lifecycle?.started_at,
          started_by: route.assignment_lifecycle?.started_by,
          last_checkpoint: lastCheckpoint,
          start_location: startLocation
        },
        streets: route.streets || [],
        scheduled_date: route.scheduled_date,
        created_at: route.created_at,
        updated_at: route.updated_at
      };
    });

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
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can add maintenance records' });
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
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can update truck status' });
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
  if (!req.user || (req.user.role !== 'supervisor' && req.user.role !== 'admin')) {
    return res.status(403).json({ 
      success: false,
      message: 'Only supervisors and admins can view their assignments' 
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
  if (!req.user || (req.user.role !== 'supervisor' && req.user.role !== 'admin')) {
    return res.status(403).json({ 
      success: false,
      message: 'Only supervisors and admins can start assignments' 
    });
  }

  const { assignment_id, start_location } = req.body;

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
    
    // Create start checkpoint with location data
    const startCheckpoint = {
      type: 'start',
      timestamp: new Date(),
      notes: 'Assignment started by supervisor'
    };

    // Add location data if provided
    if (start_location && start_location.latitude && start_location.longitude) {
      startCheckpoint.location = {
        latitude: start_location.latitude,
        longitude: start_location.longitude
      };

      // Also update current location and add to location history
      assignment.assignment_lifecycle.current_location = {
        latitude: start_location.latitude,
        longitude: start_location.longitude,
        timestamp: new Date(),
        accuracy: start_location.accuracy || null,
        speed: null, // Will be updated with real-time tracking
        battery_level: null // Can be added from mobile device info
      };

      // Add to location history
      assignment.assignment_lifecycle.location_history.push({
        latitude: start_location.latitude,
        longitude: start_location.longitude,
        timestamp: new Date(),
        accuracy: start_location.accuracy || null,
        speed: null,
        is_moving: false
      });
    }

    assignment.assignment_lifecycle.checkpoints.push(startCheckpoint);

    await assignment.save();

    // Populate the response with more details
    const updatedAssignment = await Route.findById(assignment_id)
      .populate('assigned_truck', 'plate_number truckModel')
      .populate('streets', 'name location')
      .populate('supervisor', 'full_name');

    return res.status(200).json({
      success: true,
      message: 'Assignment started successfully',
      assignment: {
        _id: updatedAssignment._id,
        status: updatedAssignment.status,
        started_at: updatedAssignment.assignment_lifecycle.started_at,
        display_status: 'In Progress',
        start_location: startCheckpoint.location,
        truck: updatedAssignment.assigned_truck,
        streets: updatedAssignment.streets,
        supervisor: updatedAssignment.supervisor
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


// Add this function to truckController.js for background location updates
const updateRouteLocation = async (req, res) => {
  if (!req.user || (req.user.role !== 'supervisor' && req.user.role !== 'admin')) {
    return res.status(403).json({ 
      success: false,
      message: 'Only supervisors and admins can update route locations' 
    });
  }

  const { route_id, location_data } = req.body;

  if (!route_id || !location_data) {
    return res.status(400).json({ 
      success: false,
      message: 'Route ID and location data are required' 
    });
  }

  if (!location_data.latitude || !location_data.longitude) {
    return res.status(400).json({ 
      success: false,
      message: 'Valid latitude and longitude are required' 
    });
  }

  try {
    const route = await Route.findById(route_id);
    
    if (!route) {
      return res.status(404).json({ 
        success: false,
        message: 'Route not found' 
      });
    }

    // Check if the current user is the supervisor of this route
    if (route.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only update locations for your assigned routes' 
      });
    }

    // Check if the route is in progress
    if (route.status !== 'in_progress') {
      return res.status(400).json({ 
        success: false,
        message: 'Can only update location for routes in progress' 
      });
    }

    // Create location update object
    const locationUpdate = {
      latitude: location_data.latitude,
      longitude: location_data.longitude,
      timestamp: new Date(),
      accuracy: location_data.accuracy || null,
      speed: location_data.speed || null,
      battery_level: location_data.battery_level || null
    };

    // Update current location
    route.assignment_lifecycle.current_location = locationUpdate;

    // Add to location history
    route.assignment_lifecycle.location_history.unshift({
      latitude: location_data.latitude,
      longitude: location_data.longitude,
      timestamp: new Date(),
      accuracy: location_data.accuracy || null,
      speed: location_data.speed || null,
      is_moving: location_data.is_moving || false
    });

    // Keep only last 100 location history entries to prevent database bloat
    if (route.assignment_lifecycle.location_history.length > 100) {
      route.assignment_lifecycle.location_history = 
        route.assignment_lifecycle.location_history.slice(0, 100);
    }

    await route.save();

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: {
        latitude: location_data.latitude,
        longitude: location_data.longitude,
        timestamp: new Date(),
        accuracy: location_data.accuracy,
        speed: location_data.speed
      },
      route_status: route.status
    });

  } catch (error) {
    console.error('Update route location error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to update route location: ${error.message}`,
    });
  }
};

// Get supervisor's in-progress assignment for today
const getSupervisorInProgressAssignment = async (req, res) => {
  if (!req.user || (req.user.role !== 'supervisor' && req.user.role !== 'admin')) {
    return res.status(403).json({ 
      success: false,
      message: 'Only supervisors and admins can view assignments' 
    });
  }

  try {
    const supervisorId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's in-progress assignment for this supervisor
    const assignment = await Route.findOne({ 
      supervisor: supervisorId,
      scheduled_date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Today only
      },
      status: 'in_progress'
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
    .lean();

    if (!assignment) {
      return res.status(200).json({
        success: true,
        message: 'No in-progress assignment found for today',
        assignment: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'In-progress assignment retrieved successfully',
      assignment: assignment
    });

  } catch (error) {
    console.error('Get in-progress assignment error:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve assignment: ${error.message}`,
    });
  }
};

// Add this function to your truckController.js
// In truckController.js - Fix the updateAssignmentStatus function
const updateAssignmentStatus = async (req, res) => {
  console.log('Received update request:', req.body);
  
  try {
    const { assignment_id, status, notes, location } = req.body;
    const supervisor_id = req.user.id;

    // Validate required fields
    if (!assignment_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID and status are required'
      });
    }

    // Validate status
    const validStatuses = ['in_progress', 'paused', 'at_dumpsite', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: in_progress, paused, at_dumpsite, completed'
      });
    }

    // Find the assignment
    const assignment = await Route.findById(assignment_id)
      .populate('assigned_truck')
      .populate({
        path: 'assigned_team',
        populate: {
          path: 'team_members.user',
          select: 'full_name role'
        }
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    console.log('Current assignment status:', assignment.status);
    console.log('Requested status:', status);

    // Check authorization
    if (assignment.supervisor.toString() !== supervisor_id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this assignment'
      });
    }

    // Status transition validation
    const statusFlow = {
      'scheduled': ['in_progress'],
      'in_progress': ['paused', 'at_dumpsite', 'completed'],
      'paused': ['in_progress'], // Allow resume (in_progress) from paused
      'at_dumpsite': ['in_progress', 'completed']
    };

    if (!statusFlow[assignment.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${assignment.status} to ${status}`
      });
    }

    // CORRECTED: Checkpoint type function
    const getCheckpointType = (currentStatus, newStatus) => {
      console.log('Determining checkpoint type:', { currentStatus, newStatus });
      
      // Resume from paused
      if (currentStatus === 'paused' && newStatus === 'in_progress') {
        return 'resume';
      }
      // Start from scheduled
      if (currentStatus === 'scheduled' && newStatus === 'in_progress') {
        return 'start';
      }
      // Pause from in_progress
      if (currentStatus === 'in_progress' && newStatus === 'paused') {
        return 'pause';
      }
      // Dumpsite from in_progress
      if (currentStatus === 'in_progress' && newStatus === 'at_dumpsite') {
        return 'dumpsite';
      }
      // Complete from in_progress or at_dumpsite
      if (newStatus === 'completed') {
        return 'end';
      }
      
      return 'custom';
    };

    // Update assignment status
    const oldStatus = assignment.status;
    assignment.status = status;

    // Add checkpoint to lifecycle
    const checkpoint = {
      type: getCheckpointType(oldStatus, status),
      timestamp: new Date(),
      notes: notes || '',
      location: location || null
    };

    console.log('Created checkpoint:', checkpoint);

    // Initialize assignment_lifecycle if needed
    if (!assignment.assignment_lifecycle) {
      assignment.assignment_lifecycle = {
        checkpoints: [],
        current_location: null,
        location_history: []
      };
    }

    if (!assignment.assignment_lifecycle.checkpoints) {
      assignment.assignment_lifecycle.checkpoints = [];
    }

    assignment.assignment_lifecycle.checkpoints.push(checkpoint);

    // Update timestamps based on status
    if (status === 'in_progress' && oldStatus === 'paused') {
      // Resuming from pause
      assignment.assignment_lifecycle.resumed_at = new Date();
      console.log('Setting resumed_at timestamp');
    } else if (status === 'in_progress' && oldStatus === 'scheduled') {
      // Starting fresh
      assignment.assignment_lifecycle.started_at = new Date();
      assignment.assignment_lifecycle.started_by = supervisor_id;
    } else if (status === 'paused') {
      assignment.assignment_lifecycle.paused_at = new Date();
    } else if (status === 'completed') {
      assignment.assignment_lifecycle.completed_at = new Date();
      assignment.assignment_lifecycle.completed_by = supervisor_id;
    }

    // Update current location if provided
    if (location) {
      assignment.assignment_lifecycle.current_location = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        accuracy: location.accuracy || null,
        speed: location.speed || null,
        battery_level: location.battery_level || null
      };
    }

    await assignment.save();
    console.log('Assignment saved successfully');

    // Return updated assignment
    const updatedAssignment = await Route.findById(assignment_id)
      .populate('assigned_truck')
      .populate({
        path: 'assigned_team',
        populate: {
          path: 'team_members.user',
          select: 'full_name role'
        }
      })
      .populate('streets');

    res.json({
      success: true,
      message: `Assignment status updated from ${oldStatus} to ${status}`,
      assignment: updatedAssignment
    });

  } catch (error) {
    console.error('Update assignment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating assignment status'
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
  startAssignment,
  updateRouteLocation,
    getSupervisorInProgressAssignment,
    updateAssignmentStatus
};