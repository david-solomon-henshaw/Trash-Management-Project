const Customer = require('../models/customer');

// Get all customers (with populated references)
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate('street', 'name')
      .populate('apartment_type', 'name')
      .populate('commercial_subtype', 'name')
      .sort({ created_at: -1 }); // Sort by newest first
    
    // Transform data to match frontend expectations
    const transformedCustomers = customers.map(customer => ({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      house_number: customer.house_number,
      street: {
        _id: customer.street._id,
        streetName: customer.street.name
      },
      customer_type: customer.customer_type,
      apartment_type: customer.apartment_type,
      commercial_subtype: customer.commercial_subtype,
      status: customer.status,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    }));
    
    return res.status(200).json({ 
      message: transformedCustomers.length === 0 ? 'No customers found' : 'Customers found', 
      customers: transformedCustomers 
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
      .populate('apartment_type', 'name')
      .populate('commercial_subtype', 'name');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Transform data
    const transformedCustomer = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      house_number: customer.house_number,
      street: {
        _id: customer.street._id,
        streetName: customer.street.name
      },
      customer_type: customer.customer_type,
      apartment_type: customer.apartment_type,
      commercial_subtype: customer.commercial_subtype,
      status: customer.status,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
    
    return res.status(200).json({ 
      message: 'Customer found', 
      customer: transformedCustomer 
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
      status
    } = req.body;
    
    // Validation
    if (!name?.trim() || !phone?.trim() || !address?.trim() || 
        !house_number?.trim() || !street || !customer_type) {
      return res.status(400).json({ 
        message: 'Name, phone, address, house number, street, and customer type are required' 
      });
    }
    
    // Validate customer type specific requirements
    if (customer_type === 'residential' && !apartment_type) {
      return res.status(400).json({ 
        message: 'Apartment type is required for residential customers' 
      });
    }
    
    if (customer_type === 'commercial' && !commercial_subtype) {
      return res.status(400).json({ 
        message: 'Business type is required for commercial customers' 
      });
    }
    
    // Check for duplicate (same street and house number)
    const existingCustomer = await Customer.findOne({ 
      street, 
      house_number: house_number.trim() 
    });
    
    if (existingCustomer) {
      return res.status(400).json({ 
        message: 'A customer already exists at this address' 
      });
    }
    
    // Create customer
    const customerData = {
      name: name.trim(),
      email: email?.trim() || '',
      phone: phone.trim(),
      address: address.trim(),
      house_number: house_number.trim(),
      street,
      customer_type,
      status: status || 'active'
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
      await customer.populate('apartment_type', 'name');
    }
    if (customer_type === 'commercial') {
      await customer.populate('commercial_subtype', 'name');
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
          streetName: customer.street.name
        },
        customer_type: customer.customer_type,
        apartment_type: customer.apartment_type,
        commercial_subtype: customer.commercial_subtype,
        status: customer.status,
        createdAt: customer.created_at
      }
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return res.status(500).json({ message: 'Server error' });
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
        message: 'Name and phone are required' 
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
      await customer.populate('apartment_type', 'name');
    }
    if (customer.customer_type === 'commercial') {
      await customer.populate('commercial_subtype', 'name');
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
          streetName: customer.street.name
        },
        customer_type: customer.customer_type,
        apartment_type: customer.apartment_type,
        commercial_subtype: customer.commercial_subtype,
        status: customer.status,
        updatedAt: customer.updated_at
      }
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
    
    // Optional: Check if customer has any payments/orders
    // const hasPayments = await Payment.countDocuments({ customer: id });
    // if (hasPayments > 0) {
    //   return res.status(400).json({ 
    //     message: 'Cannot delete customer with existing payment records' 
    //   });
    // }
    
    await Customer.findByIdAndDelete(id);
    
    return res.status(200).json({ 
      message: 'Customer deleted successfully',
      deletedCustomer: {
        _id: customer._id,
        name: customer.name
      }
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
  updateCustomer,
  deleteCustomer
};