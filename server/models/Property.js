const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  amenities: [{
    type: String,
    trim: true
  }],
  bookedDates: [{
    type: Date
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullAddress: {
    type: String,
    required: false
  },
  ownerName: {
    type: String,
    required: false
  },
  ownerContact: {
    type: String,
    required: false
  },
  ownerWhatsApp: {
    type: String,
    required: false
  },
  ownerEmail: {
    type: String,
    required: false
  },
  ownerImage: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);