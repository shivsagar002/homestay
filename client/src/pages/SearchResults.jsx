import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WifiIcon, TvIcon, HomeIcon, TruckIcon, FunnelIcon, XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import useSearchStore from '../stores/searchStore';
import useAuthStore from '../stores/authStore';
import { propertyAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SearchResults = () => {
  const { location, startDate, endDate, guests } = useSearchStore();
  const { wishlist, toggleWishlist, isAuthenticated, setIsAuthModalOpen } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Local input state (doesn't trigger re-fetch on every keystroke)
  const [priceInputs, setPriceInputs] = useState({
    minPrice: '',
    maxPrice: ''
  });
  
  // Local amenities state
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  // Actual applied filters (triggers fetch only when Apply is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    minPrice: '',
    maxPrice: '',
    amenities: []
  });

  useEffect(() => {
    fetchProperties();
  }, [location, appliedFilters]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (location) params.location = location;
      if (appliedFilters.minPrice) params.minPrice = appliedFilters.minPrice;
      if (appliedFilters.maxPrice) params.maxPrice = appliedFilters.maxPrice;
      if (appliedFilters.amenities.length > 0) params.amenities = appliedFilters.amenities;

      const response = await propertyAPI.getAll(params);
      setProperties(response.data);
    } catch (err) {
      setError('Failed to load properties.');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setAppliedFilters({
      minPrice: priceInputs.minPrice,
      maxPrice: priceInputs.maxPrice,
      amenities: selectedAmenities
    });
  };

  const clearFilters = () => {
    setAppliedFilters({ minPrice: '', maxPrice: '', amenities: [] });
  };
  
  const handleToggleWishlist = async (propertyId) => {
    if (!isAuthenticated) {
      toast.error('Please login to save properties');
      setIsAuthModalOpen(true);
      return;
    }
    const result = await toggleWishlist(propertyId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  const hasActiveFilters = appliedFilters.minPrice || appliedFilters.maxPrice || appliedFilters.amenities.length > 0;

  // Check if property is available for selected dates
  const isPropertyAvailable = (property) => {
    if (!startDate || !endDate) return true;
    
    const bookedDates = property.bookedDates || [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const isBooked = bookedDates.some(bookedDate =>
        new Date(bookedDate).toDateString() === d.toDateString()
      );
      if (isBooked) return false;
    }
    return true;
  };

  const amenityIcons = {
    'WiFi': WifiIcon,
    'TV': TvIcon,
    'Kitchen': HomeIcon,
    'Parking': TruckIcon
  };

  const allAmenities = ['WiFi', 'TV', 'Kitchen', 'Parking', 'Air Conditioning', 'Heating', 'Washing Machine', 'Swimming Pool', 'Gym', 'Garden'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
          <button onClick={fetchProperties} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {location ? `Stays in ${location}` : 'All Properties'}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                {startDate && endDate && `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} • `}
                {properties.length} properties
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        </motion.div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {appliedFilters.minPrice && (
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                Min: ₹{parseInt(appliedFilters.minPrice).toLocaleString('en-IN')}
              </span>
            )}
            {appliedFilters.maxPrice && (
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                Max: ₹{parseInt(appliedFilters.maxPrice).toLocaleString('en-IN')}
              </span>
            )}
            {appliedFilters.amenities.map(amenity => (
              <span key={amenity} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                {amenity}
              </span>
            ))}
          </div>
        )}

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden w-full py-2 px-4 bg-white border rounded-lg text-sm font-medium mb-4 flex items-center justify-center gap-2"
        >
          <FunnelIcon className="h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden md:block'}`}>
              <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-24 border border-gray-100 shadow-gray-200/50">
                <div className="flex items-center gap-2 mb-6">
                  <FunnelIcon className="h-5 w-5 text-primary-600" />
                  <h3 className="text-xl font-black text-gray-900">Filters</h3>
                </div>
                
                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 text-sm mb-4 uppercase tracking-widest">Price Range</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                      <input
                        type="text"
                        value={priceInputs.minPrice}
                        onChange={(e) => setPriceInputs({...priceInputs, minPrice: e.target.value.replace(/[^0-9]/g, '')})}
                        className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-xl text-sm transition-all border"
                        placeholder="Min"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                      <input
                        type="text"
                        value={priceInputs.maxPrice}
                        onChange={(e) => setPriceInputs({...priceInputs, maxPrice: e.target.value.replace(/[^0-9]/g, '')})}
                        className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-500 rounded-xl text-sm transition-all border"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 text-sm mb-4 uppercase tracking-widest">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {allAmenities.map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => {
                          setSelectedAmenities(prev =>
                            prev.includes(amenity)
                              ? prev.filter(a => a !== amenity)
                              : [...prev, amenity]
                          );
                        }}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200 scale-[1.02]'
                            : 'bg-white text-gray-600 border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-50">
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-3 bg-gray-50 text-gray-600 rounded-xl text-sm font-black hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-black hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                  >
                    Apply
                  </button>
                </div>
              </div>
          </div>

          {/* Properties Grid */}
          <div className="lg:w-3/4">
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-bold mb-2">No properties found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-primary">
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {properties.map((property, index) => {
                  const isAvailable = isPropertyAvailable(property);
                  return (
                    <motion.div
                      key={property._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className={`bg-white rounded-xl shadow-lg overflow-hidden border ${
                        !isAvailable ? 'opacity-70' : ''
                      }`}
                    >
                      <Link to={isAvailable ? `/property/${property._id}` : '#'}>
                        <div className="relative">
                          <div className="absolute top-3 left-3 z-10">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleWishlist(property._id);
                              }}
                              className={`p-2 rounded-full backdrop-blur-md transition-all ${
                                wishlist.includes(property._id)
                                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110'
                                  : 'bg-white/80 text-gray-600 hover:bg-white hover:text-rose-500 shadow-sm'
                              }`}
                            >
                              {wishlist.includes(property._id) ? (
                                <HeartIconSolid className="h-5 w-5" />
                              ) : (
                                <HeartIcon className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <img
                            src={property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'}
                            alt={property.title}
                            className="w-full h-40 md:h-48 object-cover"
                          />
                          <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold shadow">
                            <span className="text-primary-600">₹{property.price?.toLocaleString('en-IN')}</span>
                            <span className="text-gray-500 text-xs">/night</span>
                          </div>
                          {!isAvailable && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm">
                                Not Available
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-base font-bold mb-1 line-clamp-1">{property.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{property.description}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {property.amenities?.slice(0, 3).map(amenity => {
                              const Icon = amenityIcons[amenity];
                              return Icon ? (
                                <div key={amenity} className="flex items-center text-xs bg-gray-50 px-2 py-1 rounded">
                                  <Icon className="h-3 w-3 mr-1" />
                                  {amenity}
                                </div>
                              ) : (
                                <div key={amenity} className="flex items-center text-xs bg-gray-50 px-2 py-1 rounded">
                                  {amenity}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="flex justify-between items-center pt-3 border-t text-sm">
                            <span className="text-gray-600">{property.location}</span>
                            <span className={`px-3 py-1 rounded text-xs ${
                              isAvailable ? 'btn-primary' : 'bg-gray-300 text-gray-600'
                            }`}>
                              {isAvailable ? 'View' : 'Booked'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
