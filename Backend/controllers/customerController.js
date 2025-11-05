const Customer = require('../models/customer');
const ApartmentType = require('../models/apartment');
const CommercialSubtype = require('../models/commercial');
const Route = require('../models/routes');


// Get all customers (with populated references)
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate('street', 'name')
      .populate('apartment_type', 'name base_fee')
      .populate('commercial_subtype', 'name base_fee')
      .sort({ created_at: -1 });

    const transformedCustomers = customers.map(customer => ({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      house_number: customer.house_number,
      street: {
        _id: customer.street._id,
        streetName: customer.street.name,
      },
      customer_type: customer.customer_type,
      apartment_type: customer.apartment_type,
      commercial_subtype: customer.commercial_subtype,
      base_fee: customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee
        : customer.commercial_subtype?.base_fee,
      status: customer.status,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    }));

    return res.status(200).json({
      message: transformedCustomers.length === 0 ? 'No customers found' : 'Customers found',
      customers: transformedCustomers,
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get single customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id)
      .populate('street', 'name')
      .populate('apartment_type', 'name base_fee')
      .populate('commercial_subtype', 'name base_fee');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const transformedCustomer = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      house_number: customer.house_number,
      street: {
        _id: customer.street._id,
        streetName: customer.street.name,
      },
      customer_type: customer.customer_type,
      apartment_type: customer.apartment_type,
      commercial_subtype: customer.commercial_subtype,
      base_fee: customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee
        : customer.commercial_subtype?.base_fee,
      status: customer.status,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    };

    return res.status(200).json({
      message: 'Customer found',
      customer: transformedCustomer,
    });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  if (req.user && req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can create customers' });
  }
  try {
    const {
      name,
      email,
      phone,
      address,
      house_number,
      street,
      customer_type,
      apartment_type,
      commercial_subtype,
      status,
    } = req.body;

    // Validation
    if (!name?.trim() || !phone?.trim() || !address?.trim() ||
        !house_number?.trim() || !street || !customer_type) {
      return res.status(400).json({
        message: 'Name, phone, address, house number, street, and customer type are required',
      });
    }

    // Validate customer type specific requirements
    if (customer_type === 'residential' && !apartment_type) {
      return res.status(400).json({
        message: 'Apartment type is required for residential customers',
      });
    }
    if (customer_type === 'commercial' && !commercial_subtype) {
      return res.status(400).json({
        message: 'Business type is required for commercial customers',
      });
    }

    // Check for duplicate (same street and house number)
    const existingCustomer = await Customer.findOne({
      street,
      house_number: house_number.trim(),
    });
    if (existingCustomer) {
      return res.status(400).json({
        message: 'A customer already exists at this address',
      });
    }

    // Fetch base_fee based on customer_type
    let base_fee = 0;
    if (customer_type === 'residential') {
      const aptType = await ApartmentType.findById(apartment_type);
      base_fee = aptType.base_fee;
    } else if (customer_type === 'commercial') {
      const commSubtype = await CommercialSubtype.findById(commercial_subtype);
      base_fee = commSubtype.base_fee;
    }

    // Create customer data
    const customerData = {
      name: name.trim(),
      email: email?.trim() || '',
      phone: phone.trim(),
      address: address.trim(),
      house_number: house_number.trim(),
      street,
      customer_type,
      base_fee,
      status: status || 'active',
      // Initialize monthly_fees with the current month
      monthly_fees: [{
        month: new Date(), // Current month
        total_fee: base_fee,
        remaining_balance: base_fee,
        payments: []
      }]
    };

    if (customer_type === 'residential') {
      customerData.apartment_type = apartment_type;
    }
    if (customer_type === 'commercial') {
      customerData.commercial_subtype = commercial_subtype;
    }

    const customer = new Customer(customerData);
    await customer.save();

    // Populate and return
    await customer.populate('street', 'name');
    if (customer_type === 'residential') {
      await customer.populate('apartment_type', 'name base_fee');
    }
    if (customer_type === 'commercial') {
      await customer.populate('commercial_subtype', 'name base_fee');
    }

    return res.status(201).json({
      message: `Customer ${name} added successfully`,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        house_number: customer.house_number,
        street: {
          _id: customer.street._id,
          streetName: customer.street.name,
        },
        customer_type: customer.customer_type,
        apartment_type: customer.apartment_type,
        commercial_subtype: customer.commercial_subtype,
        base_fee: customer.base_fee,
        status: customer.status,
        createdAt: customer.created_at,
      },
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get customers by street ID
const getCustomersByStreet = async (req, res) => {
  try {
    const { streetId } = req.params;
    const customers = await Customer.find({ street: streetId })
      .populate('street', 'name')
      .populate('apartment_type', 'name base_fee')
      .populate('commercial_subtype', 'name base_fee')
      .sort({ created_at: -1 });

    const transformedCustomers = customers.map(customer => ({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      house_number: customer.house_number,
      street: {
        _id: customer.street._id,
        streetName: customer.street.name,
      },
      customer_type: customer.customer_type,
      apartment_type: customer.apartment_type,
      commercial_subtype: customer.commercial_subtype,
      base_fee: customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee
        : customer.commercial_subtype?.base_fee,
      status: customer.status,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    }));

    return res.status(200).json({
      message: transformedCustomers.length === 0 ? 'No customers found' : 'Customers found',
      customers: transformedCustomers,
    });
  } catch (error) {
    console.error('Get customers by street error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid street ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

const getCustomerAnalytics = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const newCustomersThisMonth = await Customer.countDocuments({
      created_at: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
    });

    const revenueThisMonth = await Payment.aggregate([
      { $match: { payment_status: 'paid', month: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const customersBySegment = await Customer.aggregate([
      { $group: { _id: '$customer_type', count: { $sum: 1 } } }
    ]);

    const customerGrowth = await Customer.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      totalCustomers,
      newCustomersThisMonth,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
      customersBySegment,
      customerGrowth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  if (req.user && req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can update customers' });
  }

  try {
    const { id } = req.params;
    const { name, phone, status } = req.body;

    // Basic validation
    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        message: 'Name and phone are required',
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update fields
    customer.name = name.trim();
    customer.phone = phone.trim();
    customer.status = status || customer.status;
    customer.updated_at = Date.now();

    await customer.save();

    // Populate and return
    await customer.populate('street', 'name');
    if (customer.customer_type === 'residential') {
      await customer.populate('apartment_type', 'name base_fee');
    }
    if (customer.customer_type === 'commercial') {
      await customer.populate('commercial_subtype', 'name base_fee');
    }

    return res.status(200).json({
      message: 'Customer updated successfully',
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        house_number: customer.house_number,
        street: {
          _id: customer.street._id,
          streetName: customer.street.name,
        },
        customer_type: customer.customer_type,
        apartment_type: customer.apartment_type,
        commercial_subtype: customer.commercial_subtype,
        base_fee: customer.base_fee,
        status: customer.status,
        updatedAt: customer.updated_at,
      },
    });
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  if (req.user && req.user.role !== 'ceo') {
    return res.status(403).json({ message: 'Only CEO can delete customers' });
  }

  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Customer deleted successfully',
      deletedCustomer: {
        _id: customer._id,
        name: customer.name,
      },
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  getCustomersByStreet,
  updateCustomer,
  deleteCustomer,
};


// Get customers assigned to supervisor's routes
const getAssignedCustomers = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    
    // Get routes assigned to this supervisor
    const routes = await Route.find({ supervisor: supervisorId })
      .populate('streets');
    
    const streetIds = routes.flatMap(route => route.streets.map(street => street._id));
    
    // Get customers in these streets
    const customers = await Customer.find({ 
      street: { $in: streetIds },
      status: 'active'
    })
    .populate('street', 'name')
    .populate('apartment_type', 'name base_fee')
    .populate('commercial_subtype', 'name base_fee')
    .limit(req.query.limit || 50);

    // Transform customers to match frontend format
    const transformedCustomers = customers.map(customer => ({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      house_number: customer.house_number,
      street: customer.street ? {
        _id: customer.street._id,
        streetName: customer.street.name,
      } : null,
      customer_type: customer.customer_type,
      apartment_type: customer.apartment_type,
      commercial_subtype: customer.commercial_subtype,
      base_fee: customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee
        : customer.commercial_subtype?.base_fee,
      status: customer.status,
      createdAt: customer.created_at,
    }));

    res.json({
      success: true,
      customers: transformedCustomers,
      count: customers.length
    });
  } catch (error) {
    console.error('Get assigned customers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

  // Export the function
  module.exports.getAssignedCustomers = getAssignedCustomers;
