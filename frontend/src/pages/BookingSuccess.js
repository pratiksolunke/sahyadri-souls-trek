import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Download, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingSuccess = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!booking) return;
    
    const message = `🏔 Booking Confirmed - Sahyadri Souls Trek\n\n` +
      `Trek: ${booking.trek_name}\n` +
      `Name: ${booking.customer_name}\n` +
      `Members: ${booking.num_members}\n` +
      `Amount Paid: ₹${booking.total_amount}\n` +
      `Booking ID: ${booking.id}\n\n` +
      `We're excited to have you on this adventure!`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-muted">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-text-muted">Booking not found</p>
          <Button asChild className="mt-4">
            <Link to="/treks">Browse Treks</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="success-title">
            Booking Confirmed!
          </h1>
          
          <p className="text-lg text-text-muted mb-8">
            Thank you for booking with Sahyadri Souls Trek. Your adventure awaits!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white border-2 border-primary rounded-md p-8 mb-8"
          data-testid="booking-details"
        >
          <h2 className="text-2xl font-semibold mb-6">Booking Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-text-muted">Booking ID</span>
              <span className="font-semibold" data-testid="booking-id">{booking.id}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-text-muted">Trek</span>
              <span className="font-semibold" data-testid="trek-name">{booking.trek_name}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-text-muted">Customer Name</span>
              <span className="font-semibold">{booking.customer_name}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-text-muted">Email</span>
              <span className="font-semibold">{booking.customer_email}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-text-muted">Phone</span>
              <span className="font-semibold">{booking.customer_phone}</span>
            </div>
            
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-text-muted">Number of Members</span>
              <span className="font-semibold">{booking.num_members}</span>
            </div>
            
            <div className="flex justify-between py-3">
              <span className="text-text-muted">Total Amount Paid</span>
              <span className="text-2xl font-bold text-primary" data-testid="total-paid">
                ₹{booking.total_amount}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <Button
            onClick={handleWhatsAppShare}
            className="bg-green-600 hover:bg-green-700 text-white py-6 rounded-md"
            data-testid="whatsapp-share-button"
          >
            <MessageCircle className="mr-2" size={20} />
            Share on WhatsApp
          </Button>
          
          <Button
            variant="outline"
            className="py-6 rounded-md"
            data-testid="email-receipt-button"
          >
            <Mail className="mr-2" size={20} />
            Email Receipt
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-accent/10 border border-accent rounded-md p-6 mb-8"
        >
          <h3 className="font-semibold text-lg mb-2">What's Next?</h3>
          <ul className="space-y-2 text-text-muted">
            <li>• You will receive a confirmation email shortly</li>
            <li>• Our team will contact you 2-3 days before the trek</li>
            <li>• Make sure to check the trek details and prepare accordingly</li>
            <li>• Bring your government-issued ID on the trek day</li>
          </ul>
        </motion.div>

        <div className="text-center">
          <Button asChild variant="outline" size="lg" className="rounded-md">
            <Link to="/treks" data-testid="browse-more-button">Browse More Treks</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
