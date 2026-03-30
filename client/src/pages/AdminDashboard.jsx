import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ChartBarIcon, HomeIcon, UserGroupIcon,
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon, ArrowRightOnRectangleIcon,
  PhotoIcon, CloudArrowUpIcon, EyeIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAuthStore from '../stores/authStore';
import { propertyAPI, bookingAPI, uploadAPI } from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  
  const [newProperty, setNewProperty] = useState({
    title: '', description: '', images: [], price: '', location: '', amenities: []
  });
  
  const [editingProperty, setEditingProperty] = useState(null);

  // Available amenities list
  const availableAmenities = ['WiFi', 'TV', 'Kitchen', 'Parking', 'Air Conditioning', 'Heating', 'Washing Machine', 'Swimming Pool', 'Gym', 'Garden'];
  
  const [newBooking, setNewBooking] = useState({
    propertyId: '', guestName: '', guestEmail: '', guestPhone: '', totalGuests: 1, startDate: '', endDate: ''
  });
  
  const [viewingBooking, setViewingBooking] = useState(null);

  // Search and filter state for bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');

  // Filtered bookings based on search and status filter
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Status filter
      if (bookingStatusFilter && booking.status !== bookingStatusFilter) {
        return false;
      }

      // Search filter (name, email, phone)
      if (bookingSearch) {
        const searchLower = bookingSearch.toLowerCase();
        const guestName = (booking.guestName || booking.userId?.name || '').toLowerCase();
        const guestEmail = (booking.guestEmail || booking.userId?.email || '').toLowerCase();
        const guestPhone = (booking.guestPhone || '').toLowerCase();

        return guestName.includes(searchLower) ||
               guestEmail.includes(searchLower) ||
               guestPhone.includes(searchLower);
      }

      return true;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      navigate('/admin', { replace: true });
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propertiesRes, bookingsRes] = await Promise.all([
        propertyAPI.getAll(),
        bookingAPI.getAll()
      ]);
      setProperties(propertiesRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload for new property
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const response = await uploadAPI.uploadMultiple(files);
      const uploadedImages = response.data.images.map(img => img.url);
      setNewProperty(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    } catch (err) {
      toast.error('Failed to upload images');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image upload for editing property
  const handleEditImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setEditUploadingImage(true);
    try {
      const response = await uploadAPI.uploadMultiple(files);
      const uploadedImages = response.data.images.map(img => img.url);
      setEditingProperty(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImages]
      }));
    } catch (err) {
      toast.error('Failed to upload images');
    } finally {
      setEditUploadingImage(false);
    }
  };

  // Remove image from new property
  const removeImage = (index) => {
    setNewProperty(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Remove image from editing property
  const removeEditImage = (index) => {
    setEditingProperty(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Toggle amenity selection for new property
  const toggleAmenity = (amenity) => {
    setNewProperty(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  // Toggle amenity selection for editing property
  const toggleEditAmenity = (amenity) => {
    setEditingProperty(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...(prev.amenities || []), amenity]
    }));
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      await propertyAPI.create({
        ...newProperty,
        price: Number(newProperty.price),
        images: newProperty.images.filter(img => img)
      });
      toast.success('Property created successfully');
      setShowAddProperty(false);
      setNewProperty({ title: '', description: '', images: [], price: '', location: '', amenities: [] });
      fetchData();
    } catch (err) {
      toast.error('Failed to create property');
    }
  };

  const handleEditProperty = async (e) => {
    e.preventDefault();
    try {
      await propertyAPI.update(editingProperty._id, {
        ...editingProperty,
        price: Number(editingProperty.price)
      });
      toast.success('Property updated successfully');
      setShowEditProperty(null);
      setEditingProperty(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update property');
    }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Delete this property?')) {
      try {
        await propertyAPI.delete(id);
        toast.success('Property deleted successfully');
        fetchData();
      } catch (err) {
        toast.error('Failed to delete property');
      }
    }
  };

  const handleConfirmBooking = async (id) => {
    try {
      await bookingAPI.updateStatus(id, 'Confirmed');
      toast.success('Booking confirmed');
      fetchData();
    } catch (err) {
      toast.error('Failed to confirm booking');
    }
  };

  const handleCancelBooking = async (id) => {
    if (window.confirm('Cancel this booking?')) {
      try {
        await bookingAPI.updateStatus(id, 'Cancelled');
        toast.success('Booking cancelled');
        fetchData();
      } catch (err) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const start = new Date(newBooking.startDate);
      const end = new Date(newBooking.endDate);
      
      await bookingAPI.create({
        propertyId: newBooking.propertyId,
        startDate: start,
        endDate: end,
        guestName: newBooking.guestName,
        guestEmail: newBooking.guestEmail,
        guestPhone: newBooking.guestPhone,
        totalGuests: Number(newBooking.totalGuests) || 1
      });
      
      toast.success('Booking created successfully');
      setShowNewBooking(false);
      setNewBooking({ propertyId: '', guestName: '', guestEmail: '', guestPhone: '', totalGuests: 1, startDate: '', endDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      await bookingAPI.update(editingBooking._id, {
        guestName: editingBooking.guestName,
        guestEmail: editingBooking.guestEmail,
        guestPhone: editingBooking.guestPhone,
        totalGuests: Number(editingBooking.totalGuests) || 1,
        startDate: editingBooking.startDate,
        endDate: editingBooking.endDate,
        status: editingBooking.status,
        propertyId: editingBooking.propertyId?._id || editingBooking.propertyId
      });
      toast.success('Booking updated successfully');
      setEditingBooking(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking');
    }
  };

  const salesData = [
    { month: 'Jan', revenue: 4000 }, { month: 'Feb', revenue: 3000 },
    { month: 'Mar', revenue: 2000 }, { month: 'Apr', revenue: 2780 },
    { month: 'May', revenue: 1890 }, { month: 'Jun', revenue: 2390 }
  ];

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl p-6 h-32"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-lg">Welcome back, {user?.name}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg md:rounded-2xl shadow p-3 md:p-6">
            <p className="text-xs md:text-sm text-gray-600">Revenue</p>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-lg md:rounded-2xl shadow p-3 md:p-6">
            <p className="text-xs md:text-sm text-gray-600">Bookings</p>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-lg md:rounded-2xl shadow p-3 md:p-6">
            <p className="text-xs md:text-sm text-gray-600">Properties</p>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{properties.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow mb-6 md:mb-8 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'properties', name: 'Properties', icon: HomeIcon },
              { id: 'bookings', name: 'Bookings', icon: UserGroupIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                {tab.name}
              </button>
            ))}
          </div>

          <div className="p-4 md:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-8">
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Revenue Overview</h3>
                  <div className="h-48 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Recent Bookings</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                          <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                          <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Amount</th>
                          <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookings.slice(0, 5).map((booking) => (
                          <tr key={booking._id}>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{booking.propertyId?.title || 'N/A'}</td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{booking.userId?.name || 'N/A'}</td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm hidden sm:table-cell">₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
                            <td className="px-3 md:px-6 py-3 md:py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div>
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-bold">Manage Properties</h3>
                  <button onClick={() => setShowAddProperty(true)} className="btn-primary flex items-center text-xs md:text-sm py-2 px-3 md:px-4">
                    <PlusIcon className="h-4 w-4 mr-1" /> Add
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Location</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {properties.map((property) => (
                        <tr key={property._id}>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium">{property.title}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm hidden sm:table-cell">{property.location}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">₹{property.price?.toLocaleString('en-IN')}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                            <button onClick={() => { setEditingProperty(property); setShowEditProperty(true); }} className="text-primary-600 hover:text-primary-900 mr-2 md:mr-3">
                              <PencilIcon className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                            <button onClick={() => handleDeleteProperty(property._id)} className="text-red-600 hover:text-red-900">
                              <TrashIcon className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-bold">All Bookings</h3>
                  <button onClick={() => setShowNewBooking(true)} className="btn-primary flex items-center text-xs md:text-sm py-2 px-3 md:px-4">
                    <PlusIcon className="h-4 w-4 mr-1" /> New Booking
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Guests</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Dates</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking._id}>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{booking.propertyId?.title || 'N/A'}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                            {booking.guestName || booking.userId?.name || 'N/A'}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm hidden md:table-cell">
                            {booking.totalGuests || 1}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm hidden md:table-cell">
                            {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                            <button onClick={() => setViewingBooking(booking)} className="text-gray-600 hover:text-gray-900 mr-2" title="View">
                              <EyeIcon className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                            {booking.status === 'Pending' && (
                              <button onClick={() => handleConfirmBooking(booking._id)} className="text-green-600 hover:text-green-900 mr-2" title="Confirm">
                                <CheckIcon className="h-4 w-4 md:h-5 md:w-5" />
                              </button>
                            )}
                            <button onClick={() => setEditingBooking(booking)} className="text-primary-600 hover:text-primary-900 mr-2" title="Edit">
                              <PencilIcon className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                            <button onClick={() => handleCancelBooking(booking._id)} className="text-red-600 hover:text-red-900" title="Cancel">
                              <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-4 md:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Property</h3>
              <button onClick={() => setShowAddProperty(false)}><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleAddProperty} className="space-y-3">
              <input type="text" required placeholder="Title" value={newProperty.title} onChange={(e) => setNewProperty({...newProperty, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea required placeholder="Description" rows="2" value={newProperty.description} onChange={(e) => setNewProperty({...newProperty, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Price per night" value={newProperty.price} onChange={(e) => setNewProperty({...newProperty, price: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="text" required placeholder="Location" value={newProperty.location} onChange={(e) => setNewProperty({...newProperty, location: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-colors"
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mb-2"></div>
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload images</span>
                      <span className="text-xs text-gray-400">PNG, JPG up to 5MB each</span>
                    </div>
                  )}
                </div>
                
                {/* Image Preview Grid */}
                {newProperty.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {newProperty.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-16 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {availableAmenities.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        newProperty.amenities.includes(amenity)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddProperty(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={uploadingImage} className="btn-primary text-sm disabled:opacity-50">Add Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditProperty && editingProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-4 md:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit Property</h3>
              <button onClick={() => { setShowEditProperty(null); setEditingProperty(null); }}><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleEditProperty} className="space-y-3">
              <input type="text" required placeholder="Title" value={editingProperty.title} onChange={(e) => setEditingProperty({...editingProperty, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea required placeholder="Description" rows="2" value={editingProperty.description} onChange={(e) => setEditingProperty({...editingProperty, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Price per night" value={editingProperty.price} onChange={(e) => setEditingProperty({...editingProperty, price: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="text" required placeholder="Location" value={editingProperty.location} onChange={(e) => setEditingProperty({...editingProperty, location: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleEditImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-colors"
                >
                  {editUploadingImage ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mb-2"></div>
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload more images</span>
                    </div>
                  )}
                </div>
                
                {/* Image Preview Grid */}
                {editingProperty.images && editingProperty.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {editingProperty.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-16 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {availableAmenities.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleEditAmenity(amenity)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        editingProperty.amenities?.includes(amenity)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowEditProperty(null); setEditingProperty(null); }} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={editUploadingImage} className="btn-primary text-sm disabled:opacity-50">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-4 md:p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create Booking for Guest</h3>
              <button onClick={() => setShowNewBooking(false)}><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleCreateBooking} className="space-y-3">
              <select required value={newBooking.propertyId} onChange={(e) => setNewBooking({...newBooking, propertyId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Select Property</option>
                {properties.map(p => <option key={p._id} value={p._id}>{p.title} - ₹{p.price?.toLocaleString('en-IN')}/night</option>)}
              </select>
              <input type="text" required placeholder="Guest Name" value={newBooking.guestName} onChange={(e) => setNewBooking({...newBooking, guestName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="email" required placeholder="Guest Email" value={newBooking.guestEmail} onChange={(e) => setNewBooking({...newBooking, guestEmail: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="tel" placeholder="Guest Phone (optional)" value={newBooking.guestPhone} onChange={(e) => setNewBooking({...newBooking, guestPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="number" min="1" placeholder="Total Guests" value={newBooking.totalGuests} onChange={(e) => setNewBooking({...newBooking, totalGuests: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Check-in</label>
                  <input type="date" required value={newBooking.startDate} onChange={(e) => setNewBooking({...newBooking, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Check-out</label>
                  <input type="date" required value={newBooking.endDate} onChange={(e) => setNewBooking({...newBooking, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewBooking(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">Create Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Booking Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-4 md:p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Booking Details</h3>
              <button onClick={() => setViewingBooking(null)}><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-sm text-gray-500 mb-2">Property</h4>
                <p className="font-semibold">{viewingBooking.propertyId?.title || 'N/A'}</p>
                <p className="text-sm text-gray-600">{viewingBooking.propertyId?.location || ''}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Guest Name</h4>
                  <p className="font-semibold">{viewingBooking.guestName || viewingBooking.userId?.name || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Total Guests</h4>
                  <p className="font-semibold">{viewingBooking.totalGuests || 1}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Email</h4>
                  <p className="font-semibold text-sm">{viewingBooking.guestEmail || viewingBooking.userId?.email || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Phone</h4>
                  <p className="font-semibold">{viewingBooking.guestPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Check-in</h4>
                  <p className="font-semibold">{new Date(viewingBooking.startDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Check-out</h4>
                  <p className="font-semibold">{new Date(viewingBooking.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Total Amount</h4>
                  <p className="font-semibold text-primary-600">₹{viewingBooking.totalAmount?.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Status</h4>
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                    viewingBooking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                    viewingBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    viewingBooking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingBooking.status}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-sm text-gray-500 mb-2">Booked By</h4>
                <p className="font-semibold">{viewingBooking.bookedBy || 'User'}</p>
                <p className="text-xs text-gray-500 mt-1">Created: {new Date(viewingBooking.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setViewingBooking(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-lg p-4 md:p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit Booking Status</h3>
              <button onClick={() => setEditingBooking(null)}><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleUpdateBooking} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={editingBooking.status} onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingBooking(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;