import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, UserIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useSearchStore from '../stores/searchStore';
import { propertyAPI } from '../utils/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const { 
    location, 
    startDate, 
    endDate, 
    guests,
    setLocation,
    setStartDate,
    setEndDate,
    setGuests,
    setSearchParams
  } = useSearchStore();
  
  const [localLocation, setLocalLocation] = useState(location);
  const [localGuests, setLocalGuests] = useState(guests);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      const response = await propertyAPI.getAll();
      setFeaturedProperties(response.data.slice(0, 3));
    } catch (err) {
      console.error('Error fetching featured properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const featuredCategories = [
    { name: 'Cabins', icon: '🏠', description: 'Cozy retreats', gradient: 'from-orange-400 to-red-500' },
    { name: 'Beachfront', icon: '🏖️', description: 'Ocean views', gradient: 'from-cyan-400 to-blue-500' },
    { name: 'Urban', icon: '🏙️', description: 'City living', gradient: 'from-purple-400 to-pink-500' },
    { name: 'Countryside', icon: '🌾', description: 'Rural escapes', gradient: 'from-green-400 to-emerald-500' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (startDate && endDate && startDate >= endDate) {
      toast.error('Check-out date must be after check-in date');
      return;
    }
    
    setSearchParams({ location: localLocation, guests: localGuests });
    navigate('/search');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Luxury HomeStay"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        </div>

        <div className="absolute inset-0 overflow-hidden hidden md:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-6 md:mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-1 md:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-4 md:mb-6"
            >
              <SparklesIcon className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm font-medium">Premium HomeStay Experience</span>
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-3 md:mb-6 leading-tight">
              Find Your Perfect
              <span className="block mt-1 md:mt-2 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                HomeStay
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-gray-200 mb-6 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              Discover unique accommodations and authentic experiences around the world.
            </p>
          </motion.div>

          {/* Glassmorphism Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl max-w-5xl mx-auto"
          >
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="relative group">
                <MapPinIcon className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <input
                  type="text"
                  value={localLocation}
                  onChange={(e) => setLocalLocation(e.target.value)}
                  placeholder="Where to?"
                  className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/90 border border-white/50 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 text-sm md:text-base"
                />
              </div>
              
              <div className="relative group">
                <CalendarIcon className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <input
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/90 border border-white/50 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 text-sm md:text-base"
                />
              </div>
              
              <div className="relative group">
                <CalendarIcon className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <input
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/90 border border-white/50 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 text-sm md:text-base"
                />
              </div>
              
              <div className="relative group">
                <UserIcon className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <select
                  value={localGuests}
                  onChange={(e) => setLocalGuests(parseInt(e.target.value))}
                  className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/90 border border-white/50 rounded-lg md:rounded-xl focus:ring-2 focus:ring-primary-500 outline-none appearance-none text-gray-900 text-sm md:text-base"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              <button
                type="submit"
                className="md:col-span-2 lg:col-span-4 w-full py-3 md:py-4 px-8 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold text-base md:text-lg rounded-lg md:rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                Explore Stays
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Featured Categories */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 md:mb-4">
              Popular Categories
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-600">
              Discover stays that match your travel style
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group cursor-pointer"
              >
                <div className={`relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${category.gradient} p-4 md:p-6 text-white shadow-lg hover:shadow-2xl transition-all`}>
                  <div className="relative z-10">
                    <div className="text-3xl md:text-4xl mb-2">{category.icon}</div>
                    <h3 className="text-base md:text-xl font-bold mb-1">{category.name}</h3>
                    <p className="text-xs md:text-sm text-white/90">{category.description}</p>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {!loading && featuredProperties.length > 0 && (
        <section className="py-12 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 md:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 md:mb-4">
                Featured Properties
              </h2>
              <p className="text-sm sm:text-base md:text-xl text-gray-600">
                Explore our hand-picked selection of premium stays
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {featuredProperties.map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/property/${property._id}`)}
                >
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all">
                    <div className="relative h-48 md:h-64 overflow-hidden">
                      <img
                        src={property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 md:top-4 right-3 md:right-4 bg-white px-3 py-1.5 md:py-2 rounded-full text-sm md:text-lg font-bold shadow-lg">
                        <span className="text-primary-600">₹{property.price?.toLocaleString('en-IN')}</span>
                        <span className="text-gray-500 text-xs md:text-sm font-normal">/night</span>
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {property.title}
                      </h3>
                      <p className="text-gray-600 flex items-center text-sm md:text-base">
                        <MapPinIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 text-primary-500" />
                        {property.location}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-8 md:mt-12">
              <button onClick={() => navigate('/search')} className="btn-primary text-sm md:text-lg px-6 md:px-8 py-3 md:py-4">
                View All Properties
              </button>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
              How It Works
            </h2>
            <p className="text-sm sm:text-base md:text-xl text-gray-300">
              Finding your perfect stay has never been easier
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { step: '1', title: 'Search & Discover', description: 'Browse thousands of unique stays worldwide', icon: '🔍' },
              { step: '2', title: 'Book Directly', description: 'Connect with hosts and book your stay', icon: '📅' },
              { step: '3', title: 'Enjoy Your Stay', description: 'Experience authentic hospitality', icon: '✨' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative text-center"
              >
                <div className="text-4xl md:text-6xl mb-3 md:mb-4">{item.icon}</div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full flex items-center justify-center text-base md:text-xl font-bold mx-auto mb-3 md:mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm md:text-lg">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 md:py-16 bg-gradient-to-r from-primary-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-white text-center">
            {[
              { number: '500+', label: 'Properties' },
              { number: '10K+', label: 'Travelers' },
              { number: '50+', label: 'Countries' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-2xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">{stat.number}</div>
                <div className="text-xs md:text-lg text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;