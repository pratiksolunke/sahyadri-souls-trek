import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Check, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrekDetailPage = () => {
  const { trekId } = useParams();
  const navigate = useNavigate();
  const [trek, setTrek] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const [bookingData, setBookingData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    age: '',
    num_members: 1,
  });

  useEffect(() => {
    fetchTrek();
    fetchReviews();
  }, [trekId]);

  const fetchTrek = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/treks/${trekId}`);
      setTrek(response.data);
    } catch (error) {
      console.error('Error fetching trek:', error);
      toast.error('Trek not found');
      navigate('/treks');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews?trek_id=${trekId}&approved_only=true`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingData.customer_name || !bookingData.customer_email || !bookingData.customer_phone || !bookingData.age) {
      toast.error('Please fill all required fields');
      return;
    }

    setBookingLoading(true);
    
    try {
      const total_amount = trek.price * bookingData.num_members;
      
      const response = await axios.post(`${API}/bookings/create-order`, {
        trek_id: trek.id,
        trek_name: trek.name,
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone,
        age: parseInt(bookingData.age),
        num_members: parseInt(bookingData.num_members),
        total_amount: total_amount,
      });

      const { order_id, amount, key_id, booking_id } = response.data;

      // Initialize Razorpay
      const options = {
        key: key_id,
        amount: amount * 100,
        currency: 'INR',
        name: 'Sahyadri Souls Trek',
        description: `Booking for ${trek.name}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            await axios.post(`${API}/bookings/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: booking_id,
            });
            
            navigate(`/booking-success/${booking_id}`);
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: bookingData.customer_name,
          email: bookingData.customer_email,
          contact: bookingData.customer_phone,
        },
        theme: {
          color: '#F26A2E',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        toast.error('Payment failed. Please try again.');
      });
      razorpay.open();
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-muted">Loading trek details...</p>
        </div>
      </div>
    );
  }

  if (!trek) return null;

  const totalAmount = trek.price * bookingData.num_members;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column - Trek Details */}
          <div className="lg:col-span-7">
            {/* Main Image */}
            <div className="rounded-md overflow-hidden mb-4">
              <img
                src={trek.images?.[selectedImage] || 'https://via.placeholder.com/800x600'}
                alt={trek.name}
                className="w-full h-96 object-cover"
                data-testid="trek-main-image"
              />
            </div>

            {/* Image Gallery */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {trek.images?.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`rounded-md overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                  data-testid={`gallery-image-${index}`}
                >
                  <img
                    src={image}
                    alt={`${trek.name} ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Trek Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl font-bold mb-4" data-testid="trek-title">{trek.name}</h1>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-text-muted">
                  <MapPin size={20} className="text-primary" />
                  <span>{trek.location}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Clock size={20} className="text-primary" />
                  <span>{trek.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Users size={20} className="text-primary" />
                  <span>Max {trek.max_group_size} people</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  trek.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  trek.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {trek.difficulty}
                </div>
              </div>

              <div className="bg-white border border-border rounded-md p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4">About This Trek</h2>
                <p className="text-text-muted leading-relaxed" data-testid="trek-description">{trek.description}</p>
              </div>

              {/* Highlights */}
              {trek.highlights && trek.highlights.length > 0 && (
                <div className="bg-white border border-border rounded-md p-6 mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Highlights</h2>
                  <ul className="space-y-2">
                    {trek.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3" data-testid={`highlight-${index}`}>
                        <Check className="text-primary flex-shrink-0 mt-1" size={20} />
                        <span className="text-text-muted">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Included/Excluded */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {trek.included && trek.included.length > 0 && (
                  <div className="bg-white border border-border rounded-md p-6">
                    <h3 className="text-xl font-semibold mb-4">Included</h3>
                    <ul className="space-y-2">
                      {trek.included.map((item, index) => (
                        <li key={index} className="flex items-start gap-2" data-testid={`included-${index}`}>
                          <Check className="text-green-600 flex-shrink-0 mt-1" size={18} />
                          <span className="text-sm text-text-muted">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {trek.excluded && trek.excluded.length > 0 && (
                  <div className="bg-white border border-border rounded-md p-6">
                    <h3 className="text-xl font-semibold mb-4">Excluded</h3>
                    <ul className="space-y-2">
                      {trek.excluded.map((item, index) => (
                        <li key={index} className="flex items-start gap-2" data-testid={`excluded-${index}`}>
                          <X className="text-red-600 flex-shrink-0 mt-1" size={18} />
                          <span className="text-sm text-text-muted">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="bg-white border border-border rounded-md p-6">
                  <h2 className="text-2xl font-semibold mb-6">Reviews</h2>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-border last:border-0 pb-6 last:pb-0" data-testid="review-item">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < review.rating ? 'fill-primary text-primary' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{review.customer_name}</span>
                        </div>
                        <p className="text-text-muted">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-white border-2 border-primary rounded-md p-8">
                <div className="text-center mb-6">
                  <p className="text-text-muted text-sm mb-2">Price per person</p>
                  <p className="text-4xl font-bold text-primary" data-testid="trek-price">₹{trek.price}</p>
                </div>

                <form onSubmit={handleBooking} data-testid="booking-form">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer_name">Full Name *</Label>
                      <Input
                        id="customer_name"
                        name="customer_name"
                        value={bookingData.customer_name}
                        onChange={handleInputChange}
                        required
                        data-testid="input-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customer_email">Email *</Label>
                      <Input
                        id="customer_email"
                        name="customer_email"
                        type="email"
                        value={bookingData.customer_email}
                        onChange={handleInputChange}
                        required
                        data-testid="input-email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customer_phone">Phone Number *</Label>
                      <Input
                        id="customer_phone"
                        name="customer_phone"
                        type="tel"
                        value={bookingData.customer_phone}
                        onChange={handleInputChange}
                        required
                        data-testid="input-phone"
                      />
                    </div>

                    <div>
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        min="1"
                        max="100"
                        value={bookingData.age}
                        onChange={handleInputChange}
                        required
                        data-testid="input-age"
                      />
                    </div>

                    <div>
                      <Label htmlFor="num_members">Number of Members *</Label>
                      <Input
                        id="num_members"
                        name="num_members"
                        type="number"
                        min="1"
                        max={trek.max_group_size}
                        value={bookingData.num_members}
                        onChange={handleInputChange}
                        required
                        data-testid="input-members"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border mt-6 pt-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-primary" data-testid="total-amount">
                        ₹{totalAmount}
                      </span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-hover text-white text-lg py-6 rounded-md"
                      disabled={bookingLoading}
                      data-testid="book-now-button"
                    >
                      {bookingLoading ? 'Processing...' : 'Book Now'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrekDetailPage;
