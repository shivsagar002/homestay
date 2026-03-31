const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { propertyId, startDate, endDate, guestName, guestEmail, guestPhone, totalGuests } = req.body;
    
    // Validate dates and set standard times (11 AM Check-in, 10 AM Check-out)
    const start = new Date(startDate);
    start.setHours(11, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(10, 0, 0, 0);
    
    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check for overlapping bookings (Conflict if: NewStart < ExistEnd AND NewEnd > ExistStart)
    const conflictingBooking = await Booking.findOne({
      propertyId,
      status: { $nin: ['Cancelled', 'Pending'] }, // Only check against confirmed/active bookings
      $and: [
        { startDate: { $lt: end } },
        { endDate: { $gt: start } }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: 'Selected dates are already booked. Please try different dates.' });
    }
    
    // Calculate total amount
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = (nights > 0 ? nights : 1) * property.price;
    
    // Check if admin is booking for a guest
    const isAdminBooking = req.user.role === 'Admin' && guestName && guestEmail;
    
    // Get user info for bookings
    let finalGuestName = guestName;
    let finalGuestEmail = guestEmail;
    let finalGuestPhone = guestPhone;

    if (!isAdminBooking && req.user._id) {
      const user = await User.findById(req.user._id);
      finalGuestName = guestName || user?.name;
      finalGuestEmail = guestEmail || user?.email;
      finalGuestPhone = guestPhone || user?.phone;
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
      guestName: finalGuestName,
      guestEmail: finalGuestEmail,
      guestPhone: finalGuestPhone,
      bookedBy: isAdminBooking ? 'Admin' : 'User'
    });
    
    const createdBooking = await booking.save();
    
    // Add booked dates to property for all bookings (Pending or Confirmed)
    // This ensures they show as "crossed out" on the calendar immediately
    const requestedDates = [];
    let tempDate = new Date(start);
    while (tempDate < end) {
      requestedDates.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    property.bookedDates.push(...requestedDates);
    await property.save();
    
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
    
    // Set operational timestamps
    if (status === 'CheckedIn') {
      booking.checkedInAt = new Date();
    } else if (status === 'Completed') {
      booking.completedAt = new Date();
    }

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

// @desc    Update booking (User modify or Admin full edit)
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
  try {
    const { guestName, guestEmail, guestPhone, totalGuests, startDate, endDate, status, propertyId } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization check: User must own booking OR be admin
    const isAdmin = req.user.role === 'Admin';
    const isOwner = booking.userId && booking.userId.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to modify this booking' });
    }

    // Check if modification is allowed (24 hours before start date) for users
    if (!isAdmin) {
      const today = new Date();
      const hoursUntilStart = (booking.startDate - today) / (1000 * 60 * 60);
      
      // If user modifies, status ALWAYS resets to Pending for admin verification
      // We must check if we need to remove old dates (handled in property/date logic)
      if (booking.status !== 'Cancelled') {
        const property = await Property.findById(booking.propertyId);
        if (property) {
          const start = new Date(booking.startDate);
          const end = new Date(booking.endDate);
          const datesToRemove = [];
          let tempDate = new Date(start);
          while (tempDate < end) {
            datesToRemove.push(tempDate.toISOString().split('T')[0]);
            tempDate.setDate(tempDate.getDate() + 1);
          }
          property.bookedDates = property.bookedDates.filter(date =>
            !datesToRemove.includes(new Date(date).toISOString().split('T')[0])
          );
          await property.save();
        }
      }
      booking.status = 'Pending';
    } else if (status !== undefined) {
      // Admins can set status directly
      booking.status = status;
    }

    // Get old/new property info
    const oldPropertyId = booking.propertyId;
    const newPropertyId = propertyId || oldPropertyId;
    const isPropertyChanging = oldPropertyId.toString() !== newPropertyId.toString();
    const isDateChanging = (startDate && new Date(startDate).getTime() !== new Date(booking.startDate).getTime()) || 
                          (endDate && new Date(endDate).getTime() !== new Date(booking.endDate).getTime());

    // Handle property or date changes
    if (isPropertyChanging || isDateChanging) {
      const start = new Date(startDate || booking.startDate);
      start.setHours(11, 0, 0, 0);
      const end = new Date(endDate || booking.endDate);
      end.setHours(10, 0, 0, 0);
      
      if (start >= end) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      // 1. Check availability on new property (Collision if: NewStart < ExistEnd AND NewEnd > ExistStart)
      // Exclude CURRENT booking from conflict check
      const conflict = await Booking.findOne({
        _id: { $ne: booking._id },
        propertyId: newPropertyId,
        status: { $ne: 'Cancelled' },
        $and: [
          { startDate: { $lt: end } },
          { endDate: { $gt: start } }
        ]
      });

      if (conflict) {
        return res.status(400).json({ message: 'Selected dates are not available for this property' });
      }

      // 2. Remove old dates from old property if it was Confirmed
      if (booking.status === 'Confirmed' || isAdmin) {
        const oldProperty = await Property.findById(oldPropertyId);
        if (oldProperty) {
          const oldStart = new Date(booking.startDate);
          const oldEnd = new Date(booking.endDate);
          const oldDatesToRemove = [];
          
          let tempDate = new Date(oldStart);
          while (tempDate < oldEnd) {
            oldDatesToRemove.push(new Date(tempDate).toISOString());
            tempDate.setDate(tempDate.getDate() + 1);
          }
          
          oldProperty.bookedDates = oldProperty.bookedDates.filter(date =>
            !oldDatesToRemove.includes(new Date(date).toISOString())
          );
          await oldProperty.save();
        }
      }

      // 3. Update booking dates and amount
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const newProperty = await Property.findById(newPropertyId);
      if (!newProperty) return res.status(404).json({ message: 'Property not found' });
      
      booking.totalAmount = (nights > 0 ? nights : 1) * newProperty.price;
      booking.startDate = start;
      booking.endDate = end;
      booking.propertyId = newPropertyId;

      // 4. Add new dates to property IF it remains active
      if (booking.status !== 'Cancelled') {
        const requestedDates = [];
        let tempDate = new Date(start);
        while (tempDate < end) {
          requestedDates.push(new Date(tempDate));
          tempDate.setDate(tempDate.getDate() + 1);
        }
        newProperty.bookedDates.push(...requestedDates);
        await newProperty.save();
      }
    }

    // Update other fields
    if (guestName !== undefined && isAdmin) booking.guestName = guestName;
    if (guestEmail !== undefined && isAdmin) booking.guestEmail = guestEmail;
    if (guestPhone !== undefined) booking.guestPhone = guestPhone;
    if (totalGuests !== undefined) booking.totalGuests = totalGuests;

    const updatedBooking = await booking.save();
    await updatedBooking.populate('propertyId', 'title location images');
    
    res.json(updatedBooking);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update booking payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.paymentStatus = paymentStatus;
    if (paymentStatus === 'Paid') {
      booking.paidAt = new Date();
    }
    const updatedBooking = await booking.save();
    
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
  updateBooking,
  updatePaymentStatus
};