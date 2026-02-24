const Service = require('../models/service');
const Customer = require('../models/customer');
const Route = require('../models/routes');
const Staff = require('../models/staff');

// Create new service record
const createService = async (req, res) => {
  try {
    const {
      customer,
      route,
      supervisor,
      service_date,
      service_month,
      before_photo,
      after_photo,
      service_notes,
      service_status
    } = req.body;

    // Validation
    if (!customer || !route || !supervisor || !service_date || !service_month || !before_photo || !service_status) {
      return res.status(400).json({
        message: 'Customer, route, supervisor, service_date, service_month, before_photo, and service_status are required'
      });
    }

    // Validate service_status enum
    if (!['serviced', 'not_home', 'refused'].includes(service_status)) {
      return res.status(400).json({
        message: 'Service status must be one of: serviced, not_home, refused'
      });
    }

    // Validate after_photo for 'serviced' status
    if (service_status === 'serviced' && !after_photo) {
      return res.status(400).json({
        message: 'After photo is required when service status is "serviced"'
      });
    }

    // Check if customer exists
    const customerExists = await Customer.findOne({ _id: customer, companyId: req.user.companyId });
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if route exists
    const routeExists = await Route.findOne({ _id: route, companyId: req.user.companyId });
    if (!routeExists) {
      return res.status(404).json({ message: 'Route not found' });
    }

    // Check if supervisor exists and has correct role
    const supervisorExists = await Staff.findOne({ _id: supervisor, companyId: req.user.companyId });
    if (!supervisorExists) {
      return res.status(404).json({ message: 'Supervisor not found' });
    }

    // Check for duplicate service (same customer, same month)
    const existingService = await Service.findOne({
      companyId: req.user.companyId,
      customer,
      service_month: new Date(service_month)
    });

    if (existingService) {
      return res.status(409).json({
        message: 'Service record already exists for this customer in the specified month'
      });
    }

    // Create service record
    const service = new Service({
      companyId: req.user.companyId,
      customer,
      route,
      supervisor,
      service_date: new Date(service_date),
      service_month: new Date(service_month),
      before_photo,
      after_photo: service_status === 'serviced' ? after_photo : undefined,
      service_notes,
      service_status
    });

    await service.save();

    // Populate references for response
    await service.populate('customer', 'name phone address');
    await service.populate('route', 'name');
    await service.populate('supervisor', 'full_name');

    return res.status(201).json({
      message: 'Service record created successfully',
      service: {
        _id: service._id,
        customer: {
          _id: service.customer._id,
          name: service.customer.name,
          phone: service.customer.phone,
          address: service.customer.address
        },
        route: {
          _id: service.route._id,
          name: service.route.name
        },
        supervisor: {
          _id: service.supervisor._id,
          name: service.supervisor.full_name
        },
        service_date: service.service_date,
        service_month: service.service_month,
        before_photo: service.before_photo,
        after_photo: service.after_photo,
        service_notes: service.service_notes,
        service_status: service.service_status,
        created_at: service.created_at
      }
    });

  } catch (error) {
    console.error('Create service error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all services with filtering and pagination
const getAllServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      customer,
      route,
      supervisor,
      service_status,
      service_month,
      start_date,
      end_date
    } = req.query;

    const filter = {};

    // Build filter object
    if (customer) filter.customer = customer;
    if (route) filter.route = route;
    if (supervisor) filter.supervisor = supervisor;
    if (service_status) filter.service_status = service_status;
    if (service_month) {
      const month = new Date(service_month);
      filter.service_month = {
        $gte: new Date(month.getFullYear(), month.getMonth(), 1),
        $lt: new Date(month.getFullYear(), month.getMonth() + 1, 1)
      };
    }
    if (start_date || end_date) {
      filter.service_date = {};
      if (start_date) filter.service_date.$gte = new Date(start_date);
      if (end_date) filter.service_date.$lte = new Date(end_date);
    }

    filter.companyId = req.user.companyId;

    const services = await Service.find(filter)
      .populate('customer', 'name phone address house_number')
      .populate('route', 'name')
      .populate('supervisor', 'full_name')
      .sort({ service_date: -1, created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(filter);

    return res.status(200).json({
      message: services.length === 0 ? 'No services found' : 'Services retrieved successfully',
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalServices: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all services error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get service by ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findOne({ _id: id, companyId: req.user.companyId })
      .populate('customer', 'name phone address house_number')
      .populate('route', 'name')
      .populate('supervisor', 'full_name');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    return res.status(200).json({
      message: 'Service found',
      service
    });

  } catch (error) {
    console.error('Get service by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get services by customer ID
const getServicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if customer exists
    const customer = await Customer.findOne({ _id: customerId, companyId: req.user.companyId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const services = await Service.find({ companyId: req.user.companyId, customer: customerId })
      .populate('route', 'name')
      .populate('supervisor', 'full_name')
      .sort({ service_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments({ companyId: req.user.companyId, customer: customerId });

    return res.status(200).json({
      message: services.length === 0 ? 'No services found for this customer' : 'Customer services retrieved successfully',
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address
      },
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalServices: total
      }
    });

  } catch (error) {
    console.error('Get services by customer error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get services by route ID
const getServicesByRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { service_date, page = 1, limit = 50 } = req.query;

    const filter = { companyId: req.user.companyId, route: routeId };
    if (service_date) {
      filter.service_date = new Date(service_date);
    }

    const services = await Service.find(filter)
      .populate('customer', 'name phone address house_number')
      .populate('supervisor', 'full_name')
      .sort({ service_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(filter);

    return res.status(200).json({
      message: services.length === 0 ? 'No services found for this route' : 'Route services retrieved successfully',
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalServices: total
      }
    });

  } catch (error) {
    console.error('Get services by route error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid route ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update service record
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      after_photo,
      service_notes,
      service_status
    } = req.body;

    const service = await Service.findOne({ _id: id, companyId: req.user.companyId });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Validate service_status if provided
    if (service_status && !['serviced', 'not_home', 'refused'].includes(service_status)) {
      return res.status(400).json({
        message: 'Service status must be one of: serviced, not_home, refused'
      });
    }

    // Update fields
    if (after_photo !== undefined) service.after_photo = after_photo;
    if (service_notes !== undefined) service.service_notes = service_notes;
    if (service_status !== undefined) service.service_status = service_status;

    // Validate after_photo for 'serviced' status
    if (service.service_status === 'serviced' && !service.after_photo) {
      return res.status(400).json({
        message: 'After photo is required when service status is "serviced"'
      });
    }

    await service.save();

    // Populate references for response
    await service.populate('customer', 'name phone address');
    await service.populate('route', 'name');
    await service.populate('supervisor', 'full_name');

    return res.status(200).json({
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Update service error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get service analytics
const getServiceAnalytics = async (req, res) => {
  try {
    const { month, year = new Date().getFullYear() } = req.query;

    let monthFilter = {};
    if (month) {
      const targetMonth = new Date(year, month - 1);
      monthFilter = {
        service_month: {
          $gte: new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1),
          $lt: new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1)
        }
      };
    }

    // Get service status counts
    const statusCounts = await Service.aggregate([
      { $match: monthFilter },
      { $group: { _id: '$service_status', count: { $sum: 1 } } }
    ]);

    // Get services per route
    const routeStats = await Service.aggregate([
      { $match: monthFilter },
      { $group: { _id: '$route', count: { $sum: 1 } } },
      { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route' } },
      { $unwind: '$route' },
      { $project: { 'route.name': 1, count: 1 } }
    ]);

    // Get monthly trend
    const monthlyTrend = await Service.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$service_month' },
            month: { $month: '$service_month' }
          },
          total: { $sum: 1 },
          serviced: {
            $sum: { $cond: [{ $eq: ['$service_status', 'serviced'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get supervisor performance
    const supervisorStats = await Service.aggregate([
      { $match: monthFilter },
      { $group: { _id: '$supervisor', total: { $sum: 1 }, serviced: { $sum: { $cond: [{ $eq: ['$service_status', 'serviced'] }, 1, 0] } } } },
      { $lookup: { from: 'staffs', localField: '_id', foreignField: '_id', as: 'supervisor' } },
      { $unwind: '$supervisor' },
      { $project: { 'supervisor.full_name': 1, total: 1, serviced: 1, successRate: { $multiply: [{ $divide: ['$serviced', '$total'] }, 100] } } }
    ]);

    return res.status(200).json({
      message: 'Analytics retrieved successfully',
      analytics: {
        statusCounts,
        routeStats,
        monthlyTrend,
        supervisorStats,
        totalServices: statusCounts.reduce((sum, item) => sum + item.count, 0)
      }
    });

  } catch (error) {
    console.error('Get service analytics error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete service record (admin only)
const deleteService = async (req, res) => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can delete service records' });
  }

  try {
    const { id } = req.params;

    const service = await Service.findOne({ _id: id, companyId: req.user.companyId });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await Service.findOneAndDelete({ _id: id, companyId: req.user.companyId });

    return res.status(200).json({
      message: 'Service deleted successfully',
      deletedService: {
        _id: service._id,
        customer: service.customer,
        service_date: service.service_date
      }
    });

  } catch (error) {
    console.error('Delete service error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  getServicesByCustomer,
  getServicesByRoute,
  updateService,
  getServiceAnalytics,
  deleteService
};