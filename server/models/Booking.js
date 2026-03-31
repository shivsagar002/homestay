const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for admin-created bookings
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalGuests: {
    type: Number,
    required: false,
    default: 1,
    min: 1
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'CheckedIn', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  // Guest details for admin-created bookings
  guestName: {
    type: String,
    required: false
  },
  guestEmail: {
    type: String,
    required: false
  },
  guestPhone: {
    type: String,
    required: false
  },
  bookedBy: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
  },
  checkedInAt: {
    type: Date,
    required: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  paidAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);