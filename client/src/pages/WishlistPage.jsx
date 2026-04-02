import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, MapPinIcon, WifiIcon, TvIcon, HomeIcon, TruckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { fetchWishlist, toggleWishlist, wishlist, isAuthenticated } = useAuthStore();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadWishlist();
  }, [isAuthenticated, wishlist.length]);

  const loadWishlist = async () => {
    setLoading(true);
    const data = await fetchWishlist();
    setProperties(data);
    setLoading(false);
  };

  const handleToggleWishlist = async (e, propertyId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const result = await toggleWishlist(propertyId);
    if (result.success) {
      toast.success(result.message);
      // Remove from local state immediately for better UX
      setProperties(prev => prev.filter(p => p._id !== propertyId));
    } else {
      toast.error(result.error);
    }
  };

  const amenityIcons = {
    'WiFi': WifiIcon,
    'TV': TvIcon,
    'Kitchen': HomeIcon,
    'Parking': TruckIcon
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-80 shadow-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Wishlist</h1>
            <p className="text-gray-500 mt-1">Saved properties you're interested in</p>
          </motion.div>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center text-primary-600 font-bold hover:text-primary-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to search
          </button>
        </div>

        {properties.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300"
          >
            <div className="text-6xl mb-6">❤️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No saved properties</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Tap the heart icon on any property to save it to your wishlist for later.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="btn-primary"
            >
              Explore Properties
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence mode="popLayout">
              {properties.map((property, index) => (
                <motion.div
                  key={property._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group"
                >
                  <Link 
                    to={`/property/${property._id}`}
                    className="block bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary-100/50 transition-all duration-500 hover:-translate-y-2 h-full"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={(e) => handleToggleWishlist(e, property._id)}
                          className="p-3 bg-white/90 backdrop-blur-md text-rose-500 rounded-2xl shadow-xl hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                        >
                          <HeartIconSolid className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-4 left-4">
                         <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-lg border border-white/20">
                            <span className="text-lg font-black text-gray-900">₹{property.price?.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-gray-500 font-bold tracking-tighter ml-0.5">/ NIGHT</span>
                         </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                          {property.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-xs mb-4 font-bold bg-gray-50 px-3 py-2 rounded-xl inline-flex w-full">
                        <MapPinIcon className="h-4 w-4 mr-2 text-primary-500 shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4 h-8 overflow-hidden">
                        {property.amenities?.slice(0, 3).map(amenity => {
                          const Icon = amenityIcons[amenity];
                          return (
                            <div key={amenity} className="flex items-center text-[10px] bg-indigo-50/50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 font-black uppercase tracking-wider">
                              {Icon && <Icon className="h-3 w-3 mr-1.5" />}
                              {amenity}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                         <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1.5 rounded-full">
                            Available Now
                         </span>
                         <div className="flex -space-x-2">
                           {[1,2,3].map(i => (
                             <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                               <img src={`https://i.pravatar.cc/100?u=${property._id}${i}`} className="w-full h-full object-cover" />
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
