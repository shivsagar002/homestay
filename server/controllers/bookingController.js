const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { propertyId, startDate, endDate, guestName, guestEmail, guestPhone, totalGuests } = req.body;
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check if dates are available
    const bookedDates = property.bookedDates.map(date => new Date(date).toISOString().split('T')[0]);
    const requestedDates = [];
    
    const tempStart = new Date(start);
    while (tempStart < end) {
      requestedDates.push(tempStart.toISOString().split('T')[0]);
      tempStart.setDate(tempStart.getDate() + 1);
    }
    
    const isBooked = requestedDates.some(date => bookedDates.includes(date));
    if (isBooked) {
      return res.status(400).json({ message: 'Selected dates are not available' });
    }
    
    // Calculate total amount
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * property.price;
    
    // Check if admin is booking for a guest
    const isAdminBooking = req.user.role === 'Admin' && guestName && guestEmail;
    
    // Get user info for user bookings
    let userPhone = null;
    if (!isAdminBooking && req.user._id) {
      const user = await User.findById(req.user._id);
      userPhone = user?.phone || guestPhone;
    }
    
    // Create booking - User bookings are always Pending, Admin bookings are Confirmed
    const booking = new Booking({
      userId: isAdminBooking ? null : req.user._id,
      propertyId,
      startDate: start,
      endDate: end,
      totalAmount,
      totalGuests: totalGuests || 1,
      status: isAdminBooking ? 'Confirmed' : 'Pending',
      guestName: isAdminBooking ? guestName : undefined,
      guestEmail: isAdminBooking ? guestEmail : undefined,
      guestPhone: isAdminBooking ? guestPhone : userPhone,
      bookedBy: isAdminBooking ? 'Admin' : 'User'
    });
    
    const createdBooking = await booking.save();
    
    // Add booked dates to property only for confirmed/admin bookings
    if (isAdminBooking) {
      property.bookedDates.push(...requestedDates.map(date => new Date(date)));
      await property.save();
    }
    
    res.status(201).json(createdBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('propertyId', 'title location images')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('propertyId', 'title location')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // If cancelling, remove booked dates from property
    if (status === 'Cancelled' && booking.status !== 'Cancelled') {
      const property = await Property.findById(booking.propertyId);
      if (property) {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const datesToRemove = [];
        
        const tempStart = new Date(start);
        while (tempStart < end) {
          datesToRemove.push(tempStart.toISOString().split('T')[0]);
          tempStart.setDate(tempStart.getDate() + 1);
        }
        
        property.bookedDates = property.bookedDates.filter(date => 
          !datesToRemove.includes(new Date(date).toISOString().split('T')[0])
        );
        await property.save();
      }
    }
    
    booking.status = status;
    const updatedBooking = await booking.save();
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if user owns this booking or is admin
    if (booking.userId && booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if booking can be cancelled (24 hours before start date)
    const today = new Date();
    const hoursUntilStart = (booking.startDate - today) / (1000 * 60 * 60);
    
    if (hoursUntilStart < 24 && req.user.role !== 'Admin') {
      return res.status(400).json({ message: 'Cannot cancel booking within 24 hours of start date' });
    }
    
    // Remove booked dates from property
    const property = await Property.findById(booking.propertyId);
    if (property) {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const datesToRemove = [];
      
      const tempStart = new Date(start);
      while (tempStart < end) {
        datesToRemove.push(tempStart.toISOString().split('T')[0]);
        tempStart.setDate(tempStart.getDate() + 1);
      }
      
      property.bookedDates = property.bookedDates.filter(date => 
        !datesToRemove.includes(new Date(date).toISOString().split('T')[0])
      );
      await property.save();
    }
    
    booking.status = 'Cancelled';
    const updatedBooking = await booking.save();
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update booking (admin - full edit)
// @route   PUT /api/bookings/:id
// @access  Private/Admin
const updateBooking = async (req, res) => {
  try {
    const { guestName, guestEmail, guestPhone, totalGuests, startDate, endDate, status, propertyId } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get old property if propertyId is changing
    const oldPropertyId = booking.propertyId;
    const newPropertyId = propertyId || oldPropertyId;

    // Handle date changes - remove old dates from old property
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      // Remove old dates from old property
      const oldProperty = await Property.findById(oldPropertyId);
      if (oldProperty) {
        const oldStart = new Date(booking.startDate);
        const oldEnd = new Date(booking.endDate);
        const oldDatesToRemove = [];
        
        const tempStart = new Date(oldStart);
        while (tempStart < oldEnd) {
          oldDatesToRemove.push(tempStart.toISOString().split('T')[0]);
          tempStart.setDate(tempStart.getDate() + 1);
        }
        
        oldProperty.bookedDates = oldProperty.bookedDates.filter(date =>
          !oldDatesToRemove.includes(new Date(date).toISOString().split('T')[0])
        );
        await oldProperty.save();
      }

      // Check availability on new property
      const newProperty = await Property.findById(newPropertyId);
      if (!newProperty) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const bookedDates = newProperty.bookedDates.map(date => new Date(date).toISOString().split('T')[0]);
      const requestedDates = [];
      
      const tempStart = new Date(start);
      while (tempStart < end) {
        requestedDates.push(tempStart.toISOString().split('T')[0]);
        tempStart.setDate(tempStart.getDate() + 1);
      }

      // Check if new dates are available (exclude current booking's dates if same property)
      const isBooked = requestedDates.some(date => bookedDates.includes(date));
      if (isBooked && oldPropertyId.toString() !== newPropertyId.toString()) {
        return res.status(400).json({ message: 'Selected dates are not available' });
      }

      // Add new dates to new property if confirmed
      if (status === 'Confirmed' || booking.status === 'Confirmed') {
        newProperty.bookedDates.push(...requestedDates.map(date => new Date(date)));
        await newProperty.save();
      }

      // Calculate new total amount
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      booking.totalAmount = nights * newProperty.price;
      
      booking.startDate = start;
      booking.endDate = end;
    }

    // Update other fields
    if (guestName !== undefined) booking.guestName = guestName;
    if (guestEmail !== undefined) booking.guestEmail = guestEmail;
    if (guestPhone !== undefined) booking.guestPhone = guestPhone;
    if (totalGuests !== undefined) booking.totalGuests = totalGuests;
    if (status !== undefined) booking.status = status;
    if (propertyId) booking.propertyId = propertyId;

    const updatedBooking = await booking.save();
    
    // Populate before returning
    await updatedBooking.populate('propertyId', 'title location');
    
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  updateBooking
};