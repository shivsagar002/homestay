import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  HeartIcon, 
  ShareIcon, 
  MapPinIcon,
  UserIcon,
  WifiIcon,
  TvIcon,
  HomeIcon,
  TruckIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import useAuthStore from '../stores/authStore';
import useSearchStore from '../stores/searchStore';
import { propertyAPI, bookingAPI } from '../utils/api';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthModalOpen, setAuthMode } = useAuthStore();
  const { startDate, endDate, guests, setStartDate, setEndDate, setGuests } = useSearchStore();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [localGuests, setLocalGuests] = useState(guests || 1);
  const [guestPhone, setGuestPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyAPI.getById(id);
      setProperty(response.data);
      setBookedDates(response.data.bookedDates || []);
    } catch (err) {
      setError('Failed to load property details');
      console.error('Error fetching property:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    
    if (!startDate || !endDate) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    
    if (!guestPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    setBookingLoading(true);
    try {
      await bookingAPI.create({
        propertyId: id,
        startDate,
        endDate,
        guestPhone,
        totalGuests: localGuests
      });
      toast.success('Booking request submitted successfully!');
      fetchProperty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const isDateBooked = (date) => {
    return bookedDates.some(bookedDate => 
      new Date(bookedDate).toDateString() === date.toDateString()
    );
  };

  const amenityIcons = {
    'WiFi': WifiIcon,
    'TV': TvIcon,
    'Kitchen': HomeIcon,
    'Parking': TruckIcon
  };

  const nextImage = () => {
    setSelectedImage((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImage((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-2xl mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              </div>
              <div>
                <div className="h-96 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property not found</h2>
          <p className="text-gray-600 mb-4">{error || 'The property you\'re looking for doesn\'t exist.'}</p>
          <button 
            onClick={() => navigate('/search')}
            className="btn-primary"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Property Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {property.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 mr-1 text-primary-600" />
              <span className="font-medium">{property.location}</span>
            </div>
            <button className="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors">
              <HeartIcon className="h-5 w-5 mr-1" />
              Save to Wishlist
            </button>
            <button className="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors">
              <ShareIcon className="h-5 w-5 mr-1" />
              Share
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={property.images?.[selectedImage] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'}
                  alt={property.title}
                  className="w-full h-96 md:h-[500px] object-cover"
                />
                
                {property.images?.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeftIcon className="h-6 w-6 text-gray-900" />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRightIcon className="h-6 w-6 text-gray-900" />
                    </button>
                  </>
                )}
                
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {selectedImage + 1} / {property.images?.length || 1}
                </div>
              </div>
              
              {property.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`rounded-lg overflow-hidden transition-all ${
                        selectedImage === index ? 'ring-2 ring-primary-500 ring-offset-2' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${property.title} ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Property Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About this place</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                  {property.description}
                </p>
              </div>
            </motion.div>

            {/* Amenities */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What this place offers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.amenities?.map(amenity => {
                  const Icon = amenityIcons[amenity];
                  return Icon ? (
                    <div key={amenity} className="flex items-center p-3 bg-gray-50 rounded-xl">
                      <Icon className="h-6 w-6 text-primary-600 mr-3" />
                      <span className="text-gray-700 font-medium">{amenity}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Booking Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-3xl font-bold text-gray-900">₹{property.price?.toLocaleString('en-IN')}</span>
                  <span className="text-gray-600 text-lg"> / night</span>
                </div>
              </div>

              {/* Booking Calendar */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Select dates</h4>
                <div className="border border-gray-200 rounded-xl p-4">
                  <DayPicker
                    mode="range"
                    selected={{ from: startDate, to: endDate }}
                    onSelect={(range) => {
                      if (range?.from) setStartDate(range.from);
                      if (range?.to) setEndDate(range.to);
                    }}
                    disabled={isDateBooked}
                    className="border-0 p-0"
                  />
                </div>
              </div>

              {/* Guests Selector */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Guests</h4>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={localGuests}
                    onChange={(e) => {
                      setLocalGuests(parseInt(e.target.value));
                      setGuests(parseInt(e.target.value));
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none appearance-none bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Phone Number</h4>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Price Breakdown */}
              {startDate && endDate && (
                <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">₹{property.price?.toLocaleString('en-IN')} × {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} nights</span>
                    <span className="font-medium">₹{(property.price * Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Service fee</span>
                    <span className="font-medium">₹{Math.round(property.price * 0.12 * Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))?.toLocaleString('en-IN')}</span>
                  </div>
                  <hr className="my-3 border-gray-300" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">
                      ₹{((property.price * Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))) + 
                       Math.round(property.price * 0.12 * Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))))?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBookNow}
                disabled={bookingLoading}
                className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? 'Processing...' : isAuthenticated ? 'Book Now' : 'Login to Book'}
              </button>

              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-600 mt-3">
                  You'll be redirected to complete your booking after login
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;