import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  CurrencyRupeeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../utils/api';
import ModifyBookingModal from '../components/ModifyBookingModal';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data);
    } catch (err) {
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id, startDate) => {
    const today = new Date();
    const hoursUntilStart = (new Date(startDate) - today) / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
      toast.error('Cancellations are not allowed within 24 hours of check-in.');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingAPI.cancel(id);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Confirmed': return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      case 'Pending': return <ClockIcon className="h-4 w-4 mr-1 animate-pulse" />;
      case 'Cancelled': return <XCircleIcon className="h-4 w-4 mr-1" />;
      case 'Completed': return <CheckCircleIcon className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Fetching your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Bookings</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage your stays and view reservation details.</p>
        </div>

        {bookings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-16 text-center border border-gray-100"
          >
            <div className="text-6xl mb-6">🧳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No bookings found</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              You haven't made any bookings yet. Start exploring properties and book your first stay!
            </p>
            <button 
              onClick={() => navigate('/search')}
              className="btn-primary px-8 py-3 text-lg rounded-xl shadow-lg shadow-primary-100"
            >
              Explore Properties
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden group"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Left: Thumbnail */}
                    <div className="md:w-1/3 lg:w-1/4 relative overflow-hidden">
                      <img 
                        src={booking.propertyId?.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'} 
                        alt={booking.propertyId?.title}
                        className="h-48 md:h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md flex items-center shadow-sm ${getStatusStyle(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 p-6 md:p-8">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {booking.propertyId?.title}
                          </h3>
                          <div className="flex items-center text-gray-500 font-medium">
                            <MapPinIcon className="h-4 w-4 mr-1 text-primary-500" />
                            {booking.propertyId?.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-gray-900">₹{booking.totalAmount?.toLocaleString('en-IN')}</div>
                          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Total Paid</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 py-6 border-y border-gray-50">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400 font-bold uppercase flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" /> Check-In
                          </div>
                          <div className="font-bold text-gray-800">{new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400 font-bold uppercase flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" /> Check-Out
                          </div>
                          <div className="font-bold text-gray-800">{new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400 font-bold uppercase flex items-center">
                            <UserGroupIcon className="h-3 w-3 mr-1" /> Guests
                          </div>
                          <div className="font-bold text-gray-800">{booking.totalGuests} Guests</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400 font-bold uppercase flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" /> Booked On
                          </div>
                          <div className="font-bold text-gray-800">{new Date(booking.createdAt).toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-8">
                          <a 
                            href={`tel:${booking.propertyId?.ownerContact || booking.propertyId?.owner?.phone || '+910000000000'}`}
                            className="flex items-center px-6 py-2.5 bg-white text-gray-900 rounded-2xl hover:bg-gray-50 font-black text-sm transition-all border-2 border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <svg className="h-5 w-5 mr-2.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call Host
                          </a>
                          <a 
                            href={`https://wa.me/${(booking.propertyId?.ownerWhatsApp || booking.propertyId?.owner?.phone || '910000000000').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-6 py-2.5 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 font-black text-sm transition-all shadow-lg shadow-emerald-100 hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <svg className="h-5 w-5 mr-2.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            WhatsApp Host
                          </a>
                        
                        {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
                          <>
                            <button 
                              onClick={() => {
                                setSelectedBooking(booking);
                                setIsModifyModalOpen(true);
                              }}
                              className="flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 font-bold text-sm transition-all border border-primary-100"
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-2" />
                              Modify
                            </button>
                            <button 
                              onClick={() => handleCancelBooking(booking._id, booking.startDate)}
                              className="flex items-center px-4 py-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 font-bold text-sm transition-all border border-rose-100"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ModifyBookingModal 
        isOpen={isModifyModalOpen} 
        onClose={() => setIsModifyModalOpen(false)} 
        booking={selectedBooking} 
        onUpdate={fetchBookings} 
      />
    </div>
  );
};

export default MyBookings;
