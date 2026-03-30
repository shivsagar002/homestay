const mongoose = require('mongoose');
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const connectDB = require('./config/db');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@homestay.com',
    password: 'admin123',
    role: 'Admin'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'Guest'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'Guest'
  }
];

const properties = [
  {
    title: 'Cozy Mountain Cabin',
    description: 'Beautiful cabin with stunning mountain views, perfect for a peaceful getaway. This cozy retreat offers panoramic views of the Rocky Mountains and provides the perfect blend of rustic charm and modern comfort.',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    price: 120,
    location: 'Aspen, Colorado',
    amenities: ['WiFi', 'Kitchen', 'Parking'],
    bookedDates: [
      new Date(2026, 3, 15),
      new Date(2026, 3, 16),
      new Date(2026, 3, 17)
    ]
  },
  {
    title: 'Beachfront Villa',
    description: 'Luxury villa steps away from the pristine beach with private pool. Modern amenities and stunning ocean views make this the perfect vacation spot.',
    images: [
      'https://images.unsplash.com/photo-1615529182904-16819ec026f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    price: 250,
    location: 'Malibu, California',
    amenities: ['WiFi', 'TV', 'Kitchen', 'Parking'],
    bookedDates: [
      new Date(2026, 4, 1),
      new Date(2026, 4, 2),
      new Date(2026, 4, 3)
    ]
  },
  {
    title: 'Urban Loft Downtown',
    description: 'Modern loft in the heart of the city with skyline views. Perfect location for business travelers and urban explorers.',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    price: 95,
    location: 'New York, NY',
    amenities: ['WiFi', 'TV'],
    bookedDates: [
      new Date(2026, 3, 22),
      new Date(2026, 3, 23)
    ]
  },
  {
    title: 'Rustic Countryside Cottage',
    description: 'Charming cottage surrounded by rolling hills and beautiful countryside. Experience authentic rural life with modern comforts.',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    price: 85,
    location: 'Tuscany, Italy',
    amenities: ['Kitchen', 'Parking'],
    bookedDates: []
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await Booking.deleteMany({});
    
    console.log('Database cleared');
    
    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);
    
    // Insert properties with owner references
    const propertiesWithOwners = properties.map((property, index) => ({
      ...property,
      owner: createdUsers[index % createdUsers.length]._id
    }));
    
    const createdProperties = await Property.insertMany(propertiesWithOwners);
    console.log(`${createdProperties.length} properties created`);
    
    // Create some sample bookings
    const bookings = [
      {
        userId: createdUsers[1]._id, // John Doe
        propertyId: createdProperties[0]._id, // Mountain Cabin
        startDate: new Date(2026, 3, 10),
        endDate: new Date(2026, 3, 14),
        totalAmount: 480,
        status: 'Confirmed'
      },
      {
        userId: createdUsers[2]._id, // Jane Smith
        propertyId: createdProperties[1]._id, // Beach Villa
        startDate: new Date(2026, 4, 5),
        endDate: new Date(2026, 4, 10),
        totalAmount: 1250,
        status: 'Pending'
      }
    ];
    
    const createdBookings = await Booking.insertMany(bookings);
    console.log(`${createdBookings.length} bookings created`);
    
    console.log('Database seeding completed successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@homestay.com / admin123');
    console.log('User: john@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();