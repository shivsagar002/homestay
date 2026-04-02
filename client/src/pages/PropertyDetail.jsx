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
  ChevronRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import useAuthStore from '../stores/authStore';
import useSearchStore from '../stores/searchStore';
import { propertyAPI, bookingAPI } from '../utils/api';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, isAuthenticated, setIsAuthModalOpen } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [localGuests, setLocalGuests] = useState(guests || 1);
  const [guestPhone, setGuestPhone] = useState('');

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save properties');
      setIsAuthModalOpen(true);
      return;
    }
    const result = await toggleWishlist(property._id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  // Infinite Auto-Shuffle Logic for Gallery
  useEffect(() => {
    if (property?.images?.length > 1) {
      const interval = setInterval(() => {
        setSelectedImage((prev) => 
          prev === property.images.length - 1 ? 0 : prev + 1
        );
      }, 5000); // Shuffle every 5 seconds
      return () => clearInterval(interval);
    }
  }, [property?.images?.length]);

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
      navigate('/my-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: property.description.substring(0, 100) + '...',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const isDateBooked = (date) => {
    return bookedDates.some(bookedDate => 
      new Date(bookedDate).toDateString() === date.toDateString()
    );
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const amenityIcons = {
    'WiFi': WifiIcon,
    'TV': TvIcon,
    'Kitchen': HomeIcon,
    'Parking': TruckIcon
  };

  const nextImage = () => {
    setSelectedImage((prev) => 
      prev === (property.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImage((prev) => 
      prev === 0 ? (property.images?.length || 1) - 1 : prev - 1
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
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Property Header & Images */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{property.title}</h1>
              <div className="flex flex-wrap items-center mt-3 gap-4">
                <div className="flex items-center text-gray-600 font-medium">
                  <MapPinIcon className="h-5 w-5 mr-1.5 text-primary-600" />
                  <span>{property.location}</span>
                </div>
                {property.fullAddress && (
                  <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    {property.fullAddress}
                  </div>
                )}
              </div>
            </motion.div>
            <div className="mt-6 md:mt-0 flex items-center space-x-3">
              <button 
                onClick={handleShare}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <ShareIcon className="h-5 w-5 mr-2 text-gray-600" />
                Share
              </button>
              <button 
                onClick={handleToggleWishlist}
                className={`p-2 rounded-xl transition-all shadow-sm active:scale-95 ${
                  wishlist.includes(property._id)
                    ? 'bg-rose-500 text-white shadow-rose-200'
                    : 'bg-white text-gray-400 hover:text-rose-500 border border-gray-100 hover:border-rose-100'
                }`}
              >
                {wishlist.includes(property._id) ? (
                  <HeartIconSolid className="h-6 w-6" />
                ) : (
                  <HeartIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Modern Infinite Shuffle Gallery */}
          <div className="relative group">
            <motion.div 
              key={selectedImage}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full h-[350px] md:h-[550px] rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <img 
                src={property.images?.[selectedImage] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'} 
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              
              {/* Navigation Arrows */}
              <div className="absolute inset-0 flex items-center justify-between p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={prevImage} className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white text-gray-900 transition-all transform hover:scale-110">
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button onClick={nextImage} className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white text-gray-900 transition-all transform hover:scale-110">
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </div>
            </motion.div>

            {/* Miniature Thumbnails at Bottom */}
            <div className="mt-6 flex items-center justify-center gap-3 overflow-x-auto pb-4 no-scrollbar">
              {property.images?.map((img, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-4 transition-all ${
                    selectedImage === idx ? 'border-primary-500 shadow-lg scale-105' : 'border-white hover:border-primary-100 shadow-sm'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  {selectedImage !== idx && <div className="absolute inset-0 bg-black/10" />}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About this place</h2>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {property.description}
              </p>
              
              <div className="mt-12 pt-10 border-t border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">What this place offers</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {property.amenities?.map((amenity, index) => {
                    const Icon = amenityIcons[amenity];
                    return (
                      <div key={index} className="flex items-center text-gray-700 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
                        {Icon && <Icon className="h-5 w-5 mr-3 text-primary-600" />}
                        <span className="font-semibold">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Owner Info Module */}
              <div className="mt-12 pt-10 border-t border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <UserIcon className="h-6 w-6 mr-3 text-primary-600" />
                  Hosted by
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center bg-indigo-50/40 p-6 md:p-8 rounded-[2rem] border border-indigo-100/50 shadow-inner">
                  <div className="h-24 w-24 bg-white rounded-3xl shadow-md overflow-hidden border-4 border-white ring-8 ring-indigo-50/50 mr-8 flex-shrink-0 mb-6 sm:mb-0">
                    <img 
                      src={property.ownerImage || `https://ui-avatars.com/api/?name=${property.ownerName || property.owner?.name || 'Host'}&background=4f46e5&color=fff&bold=true`} 
                      alt={property.ownerName || property.owner?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-3xl font-black text-gray-900 truncate">{property.ownerName || property.owner?.name || 'Homestay Host'}</h4>
                      <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-5">
                        <a 
                          href={`tel:${property.ownerContact || property.owner?.phone || '+910000000000'}`}
                          className="flex items-center px-6 py-3 bg-white text-gray-900 rounded-2xl hover:bg-gray-50 font-black text-sm transition-all border-2 border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <svg className="h-5 w-5 mr-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Call Now
                        </a>
                        <a 
                          href={`https://wa.me/${(property.ownerWhatsApp || property.owner?.phone || '910000000000').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-6 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 font-black text-sm transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          WhatsApp
                        </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Booking Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 sticky top-24">
              <div className="flex justify-between items-baseline mb-8">
                <div>
                  <span className="text-4xl font-black text-gray-900">₹{property.price?.toLocaleString('en-IN')}</span>
                  <span className="text-gray-500 font-medium"> / night</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Check-in / Out</label>
                  <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50 overflow-hidden w-full">
                    <DayPicker
                      mode="range"
                      selected={{ from: startDate, to: endDate }}
                      onSelect={(range) => {
                        if (range?.from && isDateBooked(range.from)) return;
                        if (range?.to && isDateBooked(range.to)) return;
                        setStartDate(range?.from || null);
                        setEndDate(range?.to || null);
                      }}
                      disabled={isPastDate}
                      modifiers={{ booked: isDateBooked }}
                      modifiersClassNames={{ booked: 'booked-date-crossed' }}
                      numberOfMonths={1}
                      className="w-full"
                    />
                  </div>
                  {startDate && endDate && (
                    <div className="mt-4 p-4 bg-primary-50 rounded-2xl border border-primary-100 flex justify-between items-center text-sm">
                      <div className="text-center flex-1 border-r border-primary-100">
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-1">Check-In</p>
                        <p className="text-primary-900 font-black">{startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-1">Check-Out</p>
                        <p className="text-primary-900 font-black">{endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Total Guests</label>
                  <select
                    value={localGuests}
                    onChange={(e) => setLocalGuests(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Guests</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Your Phone Number</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Enter your mobile number"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">* Required for host communication</p>
                </div>

                <div className="pt-4">
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>Base Price</span>
                    <span>₹{property.price?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500 italic">Check-in: 11:00 AM | Check-out: 10:00 AM</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-black text-xl pt-4 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-primary-600">₹{property.price?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={handleBookNow}
                  disabled={bookingLoading}
                  className="w-full btn-primary py-4 text-lg font-black shadow-lg shadow-primary-200 rounded-2xl disabled:opacity-50"
                >
                  {bookingLoading ? 'Processing...' : 'Reserve Now'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;