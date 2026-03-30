# Premium HomeStay Booking Marketplace

A modern, full-stack HomeStay booking application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

### Frontend (React + Vite)
- **Landing Page**: Hero section with glassmorphism search bar
- **Search Functionality**: Filter properties by location, dates, and guests
- **Property Listings**: Grid view with filtering options
- **Property Details**: Image gallery, description, amenities, and booking sidebar
- **Authentication**: Login/Signup modal with JWT persistence
- **Admin Dashboard**: Sales charts, property management, and booking overview
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Smooth Animations**: Framer Motion for page transitions and interactions

### Backend (Node.js + Express)
- **RESTful API**: Complete CRUD operations for properties and bookings
- **User Authentication**: JWT-based authentication with role-based access
- **Booking System**: Date availability checking and booking management
- **Data Validation**: Input validation and error handling
- **MongoDB Integration**: Mongoose schemas for Users, Properties, and Bookings

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **React Router** for navigation
- **React Day Picker** for date selection
- **Heroicons** for icons
- **Recharts** for data visualization

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt.js** for password hashing
- **Cors** for cross-origin requests
- **Dotenv** for environment variables

## Project Structure

```
Homestay/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand stores
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── ...
├── server/                # Node.js backend
│   ├── controllers/       # Request handlers
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── config/           # Configuration files
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Homestay
```

2. **Install frontend dependencies**
```bash
cd client
npm install
```

3. **Install backend dependencies**
```bash
cd ../server
npm install
```

4. **Environment Setup**
Create a `.env` file in the `server` directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/homestay
JWT_SECRET=your_jwt_secret_key_here
```

5. **Start MongoDB**
Make sure MongoDB is running on your system.

6. **Run the applications**

In one terminal, start the backend:
```bash
cd server
npm run dev
```

In another terminal, start the frontend:
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create new property (Admin)
- `PUT /api/properties/:id` - Update property (Owner/Admin)
- `DELETE /api/properties/:id` - Delete property (Owner/Admin)
- `GET /api/properties/:id/availability` - Get property availability

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings` - Get all bookings (Admin)
- `PUT /api/bookings/:id/status` - Update booking status (Admin)
- `PUT /api/bookings/:id/cancel` - Cancel booking

## Key Features Implemented

### 1. Search & Discovery
- Location-based search
- Date range selection with availability checking
- Guest count filtering
- Price range and amenities filters

### 2. Booking System
- Real-time date availability checking
- Automatic date blocking after booking
- Price calculation based on nightly rates
- Booking status management

### 3. Authentication & Authorization
- User registration and login
- JWT token-based authentication
- Role-based access control (Guest/Admin)
- Protected routes and actions

### 4. Admin Functionality
- Property management (CRUD operations)
- Booking overview and management
- Revenue analytics and reporting
- User management capabilities

### 5. User Experience
- Responsive design for all devices
- Smooth animations and transitions
- Loading states and skeleton screens
- Intuitive navigation and user flows

## Future Enhancements

- Payment integration (Stripe/PayPal)
- Image upload functionality
- Advanced search filters
- User reviews and ratings
- Messaging system between guests and hosts
- Mobile app development
- Email notifications
- Social media integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.