import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { DayPicker } from 'react-day-picker';
import toast from 'react-hot-toast';
import { bookingAPI } from '../utils/api';
import 'react-day-picker/dist/style.css';

const ModifyBookingModal = ({ isOpen, onClose, booking, onUpdate }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setStartDate(new Date(booking.startDate));
      setEndDate(new Date(booking.endDate));
      setGuests(booking.totalGuests || 1);
    }
  }, [booking]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Please select both check-in and check-out dates');
      return;
    }

    setLoading(true);
    try {
      const response = await bookingAPI.update(booking._id, {
        startDate,
        endDate,
        totalGuests: guests
      });
      toast.success('Booking modification request sent!');
      onUpdate(response.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to modify booking');
    } finally {
      setLoading(false);
    }
  };

  const isDateBooked = (date) => {
    // We should ideally fetch current property's booked dates minus this booking's dates
    // For now, simple check - property data might need refreshing
    return false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Modify Booking</h2>
                  <p className="text-gray-500 text-sm mt-1">Changes require admin re-verification</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Calendar Section */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                      <CalendarIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Select New Dates
                    </label>
                    <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
                      <DayPicker
                        mode="range"
                        selected={{ from: startDate, to: endDate }}
                        onSelect={(range) => {
                          setStartDate(range?.from || null);
                          setEndDate(range?.to || null);
                        }}
                        disabled={isDateBooked}
                        className="mx-auto"
                        numberOfMonths={1}
                        showOutsideDays
                      />
                    </div>
                    {startDate && endDate && (
                      <div className="mt-4 p-4 bg-primary-50 rounded-2xl border border-primary-100 flex justify-between items-center text-sm shadow-sm">
                        <div className="text-center flex-1 border-r border-primary-100">
                          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-1">New Check-In</p>
                          <p className="text-primary-900 font-black">{startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-1">New Check-Out</p>
                          <p className="text-primary-900 font-black">{endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Guests Section */}
                  <div className="space-y-8">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                        <UserGroupIcon className="h-5 w-5 mr-2 text-primary-600" />
                        Number of Guests
                      </label>
                      <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setGuests(num)}
                            className={`w-10 h-10 rounded-full font-medium transition-all ${
                              guests === num 
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100">
                      <h4 className="font-bold text-primary-900 mb-2">Note:</h4>
                      <p className="text-sm text-primary-700 leading-relaxed">
                        Modifying your booking will set its status to <strong>Pending</strong>. 
                        The Host will need to re-verify the availability and pricing for your new selection.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary py-4 text-lg shadow-xl shadow-primary-100 disabled:opacity-50"
                  >
                    {loading ? 'Sending Request...' : 'Confirm Modification'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModifyBookingModal;
