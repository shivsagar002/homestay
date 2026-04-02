const Property = require('../models/Property');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  try {
    const { location, minPrice, maxPrice, amenities } = req.query;
    
    let query = {};
    
    // Global Search Filter (Location, Title, or Full Address)
    if (location) {
      query.$or = [
        { location: { $regex: location, $options: 'i' } },
        { title: { $regex: location, $options: 'i' } },
        { fullAddress: { $regex: location, $options: 'i' } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Amenities filter
    if (amenities) {
      const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
      query.amenities = { $all: amenityArray };
    }
    
    const properties = await Property.find(query).populate('owner', 'name');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('owner', 'name email phone');
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Dynamically fetch all booked dates from Bookings collection (Pending, Confirmed, etc.)
    const Booking = require('../models/Booking');
    const activeBookings = await Booking.find({
      propertyId: req.params.id,
      status: { $nin: ['Cancelled'] }
    }).select('startDate endDate');

    const dynamicBookedDates = [];
    activeBookings.forEach(booking => {
      let tempDate = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      while (tempDate < end) {
        dynamicBookedDates.push(new Date(tempDate));
        tempDate.setDate(tempDate.getDate() + 1);
      }
    });

    // Merge manual property.bookedDates with dynamic ones for backward compatibility
    const allBookedDates = [...new Set([
      ...property.bookedDates.map(d => d.toISOString()),
      ...dynamicBookedDates.map(d => d.toISOString())
    ])].map(d => new Date(d));
    
    // Return property with accurate booked dates
    const propertyObj = property.toObject();
    propertyObj.bookedDates = allBookedDates;

    res.json(propertyObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new property
// @route   POST /api/properties
// @access  Private/Admin
const createProperty = async (req, res) => {
  try {
    const { title, description, images, price, location, amenities, ownerName, ownerContact, ownerWhatsApp, ownerEmail, ownerImage, fullAddress } = req.body;
    
    const property = new Property({
      title,
      description,
      images,
      price,
      location,
      amenities,
      ownerName,
      ownerContact,
      ownerWhatsApp,
      ownerEmail,
      ownerImage,
      fullAddress,
      owner: req.user._id // Assuming authentication middleware sets req.user
    });
    
    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private/Admin
const updateProperty = async (req, res) => {
  try {
    const { title, description, images, price, location, amenities, ownerName, ownerContact, ownerWhatsApp, ownerEmail, ownerImage, fullAddress } = req.body;
    
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Admin can edit any property
    if (req.user.role === 'Admin') {
      property.title = title ?? property.title;
      property.description = description ?? property.description;
      property.images = images ?? property.images;
      property.price = price ?? property.price;
      property.location = location ?? property.location;
      property.amenities = amenities ?? property.amenities;
      property.ownerName = ownerName ?? property.ownerName;
      property.ownerContact = ownerContact ?? property.ownerContact;
      property.ownerWhatsApp = ownerWhatsApp ?? property.ownerWhatsApp;
      property.ownerEmail = ownerEmail ?? property.ownerEmail;
      property.ownerImage = ownerImage ?? property.ownerImage;
      property.fullAddress = fullAddress ?? property.fullAddress;
      
      const updatedProperty = await property.save();
      return res.json(updatedProperty);
    }

    // Check if user owns this property
    if (property.owner && property.owner.toString() === req.user._id.toString()) {
      property.title = title ?? property.title;
      property.description = description ?? property.description;
      property.images = images ?? property.images;
      property.price = price ?? property.price;
      property.location = location ?? property.location;
      property.amenities = amenities ?? property.amenities;
      property.ownerName = ownerName ?? property.ownerName;
      property.ownerContact = ownerContact ?? property.ownerContact;
      property.ownerWhatsApp = ownerWhatsApp ?? property.ownerWhatsApp;
      property.ownerEmail = ownerEmail ?? property.ownerEmail;
      property.ownerImage = ownerImage ?? property.ownerImage;
      property.fullAddress = fullAddress ?? property.fullAddress;
      
      const updatedProperty = await property.save();
      return res.json(updatedProperty);
    }
    
    return res.status(403).json({ message: 'Not authorized' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private/Admin
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Admin can delete any property
    if (req.user.role === 'Admin') {
      await property.deleteOne();
      return res.json({ message: 'Property removed' });
    }

    // Check if user owns this property
    if (property.owner && property.owner.toString() === req.user._id.toString()) {
      await property.deleteOne();
      return res.json({ message: 'Property removed' });
    }
    
    return res.status(403).json({ message: 'Not authorized' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available dates for a property
// @route   GET /api/properties/:id/availability
// @access  Public
const getPropertyAvailability = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json({ bookedDates: property.bookedDates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyAvailability
};