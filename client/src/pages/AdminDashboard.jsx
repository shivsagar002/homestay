import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ChartBarIcon, HomeIcon, UserGroupIcon,
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon, ArrowRightOnRectangleIcon,
  PhotoIcon, CloudArrowUpIcon, EyeIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
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
    title: '', description: '', images: [], price: '', location: '', amenities: [],
    fullAddress: '', ownerName: '', ownerContact: '', ownerWhatsApp: '', ownerEmail: '', ownerImage: ''
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

  // Today's bookings (check-in, check-out, or staying today)
  const todayBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return bookings.filter(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      
      // Check-in today
      const isCheckInToday = start >= today && start < tomorrow;
      // Check-out today
      const isCheckOutToday = end >= today && end < tomorrow;
      // Staying today (today is between start and end)
      const isStayingToday = today >= start && today < end;

      return isCheckInToday || isCheckOutToday || isStayingToday;
    });
  }, [bookings]);

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

  // Handle owner image upload
  const handleOwnerImageUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await uploadAPI.upload(file);
      const imageUrl = response.data.url;
      if (isEdit) {
        setEditingProperty(prev => ({ ...prev, ownerImage: imageUrl }));
      } else {
        setNewProperty(prev => ({ ...prev, ownerImage: imageUrl }));
      }
      toast.success('Owner image uploaded');
    } catch (err) {
      toast.error('Failed to upload owner image');
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

  const handleUpdatePayment = async (id, status) => {
    try {
      await bookingAPI.updatePayment(id, status);
      toast.success(`Payment marked as ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await bookingAPI.updateStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
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

  const salesData = useMemo(() => {
    const months = [];
    // 4 months ago to 1 month ahead (total 6 months)
    for (let i = 4; i >= -1; i--) {
      const d = new Date();
      d.setDate(1); // Crucial: Start at the 1st to avoid overflow (e.g., Mar 31 - 1 month = Mar 2/3)
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        revenue: 0,
        monthNum: d.getMonth(),
        year: d.getFullYear()
      });
    }

    bookings.filter(b => b.paymentStatus === 'Paid' && b.status !== 'Cancelled').forEach(booking => {
      const bDate = new Date(booking.startDate); // Use stay-start date for revenue tracking
      const monthIndex = months.findIndex(m => 
        m.monthNum === bDate.getMonth() && 
        m.year === bDate.getFullYear()
      );
      if (monthIndex !== -1) {
        months[monthIndex].revenue += (booking.totalAmount || 0);
      }
    });

    return months;
  }, [bookings]);

  const bookingStats = useMemo(() => {
    const stats = [
      { name: 'Pending', value: 0, color: '#f59e0b' },
      { name: 'Confirmed', value: 0, color: '#4f46e5' },
      { name: 'CheckedIn', value: 0, color: '#3b82f6' },
      { name: 'Completed', value: 0, color: '#10b981' },
      { name: 'Cancelled', value: 0, color: '#ef4444' }
    ];
    
    bookings.forEach(b => {
      const stat = stats.find(s => s.name === b.status);
      if (stat) stat.value++;
    });
    
    return stats.filter(s => s.value > 0);
  }, [bookings]);

  const totalRevenue = useMemo(() => {
    return bookings
      .filter(b => b.paymentStatus === 'Paid')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [bookings]);

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center sm:items-start">
            <div className="p-2 bg-green-50 rounded-lg mb-3">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</p>
            <p className="text-2xl lg:text-3xl font-black text-gray-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center sm:items-start">
            <div className="p-2 bg-blue-50 rounded-lg mb-3">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bookings</p>
            <p className="text-2xl lg:text-3xl font-black text-gray-900 mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center sm:items-start">
            <div className="p-2 bg-purple-50 rounded-lg mb-3">
              <HomeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Properties</p>
            <p className="text-2xl lg:text-3xl font-black text-gray-900 mt-1">{properties.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow mb-6 md:mb-8 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'today', name: 'Today', icon: CheckIcon },
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-base md:text-lg font-bold mb-6 flex items-center">
                      <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Revenue Overview (Last 6 Months)
                    </h3>
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#6b7280' }} 
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar 
                            dataKey="revenue" 
                            fill="#4f46e5" 
                            radius={[6, 6, 0, 0]} 
                            barSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-base md:text-lg font-bold mb-6">Booking Status Distribution</h3>
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bookingStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {bookingStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
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
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{booking.userId?.name || booking.guestName || 'N/A'}</td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm hidden sm:table-cell">₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
                            <td className="px-3 md:px-6 py-3 md:py-4">
                              <span className={`px-2 py-1 text-[10px] md:text-xs rounded-full font-bold ${
                                booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {booking.paymentStatus || 'Unpaid'}
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

            {/* Today Tab */}
            {activeTab === 'today' && (
              <div>
                <h3 className="text-base md:text-lg font-bold mb-4">Today's Activity</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {todayBookings.length > 0 ? todayBookings.map((booking) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        
                        const start = new Date(booking.startDate);
                        const end = new Date(booking.endDate);
                        
                        let type = "Staying";
                        if (start >= today && start < tomorrow) type = "Check-In";
                        if (end >= today && end < tomorrow) type = "Check-Out";

                        return (
                          <tr key={booking._id} className={type === "Check-In" ? "bg-green-50/30" : type === "Check-Out" ? "bg-red-50/30" : ""}>
                            <td className="px-3 md:px-6 py-3 md:py-4">
                              <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase ${
                                type === "Check-In" ? "bg-green-100 text-green-700" :
                                type === "Check-Out" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                              }`}>{type}</span>
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium">{booking.propertyId?.title}</td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{booking.guestName || booking.userId?.name}</td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
                            <td className="px-3 md:px-6 py-3 md:py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2 py-0.5 text-[10px] w-fit rounded-full font-bold ${
                                  booking.status === 'Confirmed' ? 'bg-indigo-100 text-indigo-700' :
                                  booking.status === 'CheckedIn' ? 'bg-blue-100 text-blue-700' :
                                  booking.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{booking.status}</span>
                                <button onClick={() => setViewingBooking(booking)} className="text-[10px] w-fit text-primary-600 font-bold hover:underline">View details & actions</button>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">No bookings for today</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">All Guest Bookings</h3>
                    <p className="text-xs text-gray-500">Manage your entire reservation floor from here.</p>
                  </div>
                  <button 
                    onClick={() => setShowNewBooking(true)} 
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                  >
                    <PlusIcon className="h-5 w-5" />
                    New Booking
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name, phone, email..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="CheckedIn">Checked In</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Guests</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking._id}>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium">{booking.propertyId?.title}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">{booking.guestName || booking.userId?.name}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm hidden md:table-cell">{booking.totalGuests}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-mono">
                            {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4">
                            <span className={`px-2 py-1 text-[10px] w-fit rounded-full font-bold uppercase ${
                              booking.status === 'Confirmed' ? 'bg-indigo-100 text-indigo-700' :
                              booking.status === 'CheckedIn' ? 'bg-blue-100 text-blue-700' :
                              booking.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{booking.status}</span>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setViewingBooking(booking)} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="View">
                                  <EyeIcon className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                                
                                <button onClick={() => setEditingBooking(booking)} className="p-1 hover:bg-blue-50 rounded text-primary-600" title="Edit">
                                  <PencilIcon className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                                <button onClick={() => handleCancelBooking(booking._id)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Cancel">
                                  <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                              </div>
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
              <input type="text" required placeholder="Full Address" value={newProperty.fullAddress} onChange={(e) => setNewProperty({...newProperty, fullAddress: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Price per night" value={newProperty.price} onChange={(e) => setNewProperty({...newProperty, price: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="text" required placeholder="City/Location" value={newProperty.location} onChange={(e) => setNewProperty({...newProperty, location: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-gray-700">Owner Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Owner Name" value={newProperty.ownerName} onChange={(e) => setNewProperty({...newProperty, ownerName: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="text" placeholder="Owner Contact (Call)" value={newProperty.ownerContact} onChange={(e) => setNewProperty({...newProperty, ownerContact: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <input type="text" placeholder="Owner WhatsApp" value={newProperty.ownerWhatsApp} onChange={(e) => setNewProperty({...newProperty, ownerWhatsApp: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                   <input type="email" placeholder="Owner Email" value={newProperty.ownerEmail} onChange={(e) => setNewProperty({...newProperty, ownerEmail: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-4">
                  {newProperty.ownerImage && <img src={newProperty.ownerImage} className="w-10 h-10 rounded-full object-cover border" alt="Owner" />}
                  <input type="file" onChange={(e) => handleOwnerImageUpload(e)} accept="image/*" className="text-xs" />
                </div>
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
              <input type="text" required placeholder="Full Address" value={editingProperty.fullAddress} onChange={(e) => setEditingProperty({...editingProperty, fullAddress: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" required placeholder="Price per night" value={editingProperty.price} onChange={(e) => setEditingProperty({...editingProperty, price: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="text" required placeholder="City/Location" value={editingProperty.location} onChange={(e) => setEditingProperty({...editingProperty, location: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-gray-700">Owner Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Owner Name" value={editingProperty.ownerName} onChange={(e) => setEditingProperty({...editingProperty, ownerName: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="text" placeholder="Owner Contact (Call)" value={editingProperty.ownerContact} onChange={(e) => setEditingProperty({...editingProperty, ownerContact: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Owner WhatsApp" value={editingProperty.ownerWhatsApp} onChange={(e) => setEditingProperty({...editingProperty, ownerWhatsApp: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="email" placeholder="Owner Email" value={editingProperty.ownerEmail} onChange={(e) => setEditingProperty({...editingProperty, ownerEmail: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex items-center gap-4">
                  {editingProperty.ownerImage && <img src={editingProperty.ownerImage} className="w-10 h-10 rounded-full object-cover border" alt="Owner" />}
                  <input type="file" onChange={(e) => handleOwnerImageUpload(e, true)} accept="image/*" className="text-xs" />
                </div>
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
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-700 mb-4 text-center">Select Stay Dates (Green: Available, Red: Booked)</label>
                <div className="flex justify-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                  <DayPicker
                    mode="range"
                    selected={{ 
                      from: newBooking.startDate ? new Date(newBooking.startDate + 'T00:00:00') : undefined, 
                      to: newBooking.endDate ? new Date(newBooking.endDate + 'T00:00:00') : undefined 
                    }}
                    onSelect={(range) => {
                      const formatDateLocal = (date) => {
                        if (!date) return '';
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      };
                      // Block selection of booked dates
                      const selectedPropCheck = properties.find(p => p._id === newBooking.propertyId);
                      const isBooked = (d) => selectedPropCheck?.bookedDates?.some(bd => new Date(bd).toDateString() === d?.toDateString());
                      if (isBooked(range?.from) || isBooked(range?.to)) return;
                      setNewBooking({
                        ...newBooking,
                        startDate: formatDateLocal(range?.from),
                        endDate: formatDateLocal(range?.to)
                      });
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      return date < today; // Only disable past dates, NOT booked dates
                    }}
                    modifiers={{ 
                      booked: (date) => {
                        const selectedProp = properties.find(p => p._id === newBooking.propertyId);
                        if (!selectedProp) return false;
                        return selectedProp.bookedDates?.some(d => new Date(d).toDateString() === date.toDateString());
                      }
                    }}
                    modifiersStyles={{
                      booked: {
                        backgroundColor: '#fff1f2',
                        color: '#f43f5e',
                        textDecoration: 'line-through',
                        textDecorationThickness: '2px',
                        opacity: 1,
                        cursor: 'not-allowed',
                        fontWeight: 'bold',
                        border: '1px solid #fecdd3'
                      }
                    }}
                    className="mx-auto"
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white p-2 rounded-lg border">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Check-In</p>
                    <p className="text-xs font-black">{newBooking.startDate || '---'}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Check-Out</p>
                    <p className="text-xs font-black">{newBooking.endDate || '---'}</p>
                  </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-xs text-gray-500 mb-1 uppercase tracking-wider">Property</h4>
                  <p className="font-bold text-gray-900">{viewingBooking.propertyId?.title || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-xs text-gray-500 mb-1 uppercase tracking-wider">Guest Name</h4>
                  <p className="font-bold text-gray-900">{viewingBooking.userId?.name || viewingBooking.guestName || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                   <h4 className="font-bold text-sm text-gray-700">Booking Status</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      viewingBooking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      viewingBooking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      viewingBooking.status === 'CheckedIn' ? 'bg-blue-100 text-blue-800' :
                      viewingBooking.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>{viewingBooking.status}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {viewingBooking.status === 'Pending' && (
                    <button onClick={() => { handleUpdateStatus(viewingBooking._id, 'Confirmed'); setViewingBooking(null); }} className="px-3 py-2 bg-green-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-tight shadow-sm hover:bg-green-700 transition-all">Confirm</button>
                  )}
                  {viewingBooking.status === 'Confirmed' && (
                    <button onClick={() => { handleUpdateStatus(viewingBooking._id, 'CheckedIn'); setViewingBooking(null); }} className="px-3 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-tight shadow-sm hover:bg-indigo-700 transition-all">Check In</button>
                  )}
                  {viewingBooking.status === 'CheckedIn' && (
                    <button onClick={() => { handleUpdateStatus(viewingBooking._id, 'Completed'); setViewingBooking(null); }} className="px-3 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-tight shadow-sm hover:bg-emerald-700 transition-all">Check Out</button>
                  )}
                  {viewingBooking.status !== 'Cancelled' && viewingBooking.status !== 'Completed' && (
                    <button onClick={() => { handleCancelBooking(viewingBooking._id); setViewingBooking(null); }} className="px-3 py-2 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg uppercase tracking-tight border border-red-100 hover:bg-red-100 transition-all">Cancel</button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                   <h4 className="font-bold text-sm text-gray-700">Payment History</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      viewingBooking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{viewingBooking.paymentStatus || 'Unpaid'}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { handleUpdatePayment(viewingBooking._id, viewingBooking.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'); setViewingBooking(null); }} 
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
                  >
                    Mark as {viewingBooking.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'}
                  </button>
                </div>
                {viewingBooking.paidAt && (
                   <p className="text-[10px] text-gray-400 italic">Paid on: {new Date(viewingBooking.paidAt).toLocaleString()}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Check-In</h5>
                    <p className="text-xs font-bold text-gray-700">{new Date(viewingBooking.startDate).toLocaleDateString()}</p>
                    {viewingBooking.checkedInAt && (
                      <p className="text-[9px] text-green-600 mt-1">Arrival: {new Date(viewingBooking.checkedInAt).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Check-Out</h5>
                    <p className="text-xs font-bold text-gray-700">{new Date(viewingBooking.endDate).toLocaleDateString()}</p>
                    {viewingBooking.completedAt && (
                      <p className="text-[9px] text-red-600 mt-1">Departure: {new Date(viewingBooking.completedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg flex flex-col justify-center items-center text-center">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Amount</h5>
                  <p className="text-2xl font-black text-gray-900">₹{viewingBooking.totalAmount?.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{viewingBooking.totalGuests} Guests</p>
                </div>
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