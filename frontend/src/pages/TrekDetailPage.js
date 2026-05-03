import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Check, X, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    departure_date: '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ customer_name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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
    // Reset coupon when members change (since amount changes)
    if (name === 'num_members') {
      setCouponApplied(null);
      setCouponCode('');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    try {
      const amount = trek.price * bookingData.num_members;
      const response = await axios.post(`${API}/coupons/apply`, {
        code: couponCode.trim(),
        amount: amount,
      });
      setCouponApplied(response.data);
      toast.success(response.data.message);
    } catch (error) {
      setCouponApplied(null);
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.customer_name || !reviewForm.comment) {
      toast.error('Please fill in your name and review');
      return;
    }
    setReviewSubmitting(true);
    try {
      await axios.post(`${API}/reviews`, {
        trek_id: trekId,
        customer_name: reviewForm.customer_name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success('Thank you! Your review has been submitted and will appear after approval.');
      setReviewForm({ customer_name: '', rating: 5, comment: '' });
    } catch (error) {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingData.customer_name || !bookingData.customer_email || !bookingData.customer_phone || !bookingData.age) {
      toast.error('Please fill all required fields');
      return;
    }

    setBookingLoading(true);
    
    try {
      const baseAmount = trek.price * bookingData.num_members;
      const discountAmount = couponApplied ? couponApplied.discount_amount : 0;
      const total_amount = baseAmount - discountAmount;
      
      const response = await axios.post(`${API}/bookings/create-order`, {
        trek_id: trek.id,
        trek_name: trek.name,
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone,
        age: parseInt(bookingData.age),
        num_members: parseInt(bookingData.num_members),
        total_amount: total_amount,
        discount_amount: discountAmount,
        coupon_code: couponApplied ? couponApplied.code : null,
        departure_date: bookingData.departure_date || null,
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

  const baseAmount = trek.price * bookingData.num_members;
  const discountAmount = couponApplied ? couponApplied.discount_amount : 0;
  const totalAmount = baseAmount - discountAmount;

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

              {/* Departure Dates */}
              {trek.departure_dates && trek.departure_dates.length > 0 && (
                <div className="bg-white border border-border rounded-md p-6 mb-8" data-testid="departure-dates-section">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={24} className="text-primary" />
                    Upcoming Departures
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {trek.departure_dates.map((date, index) => (
                      <div
                        key={index}
                        className="bg-primary/5 border border-primary/20 rounded-md px-4 py-3 text-center"
                        data-testid={`departure-date-${index}`}
                      >
                        <p className="font-semibold text-secondary">
                          {new Date(date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(date).toLocaleDateString('en-IN', { weekday: 'long' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Write a Review */}
              <div className="bg-white border border-border rounded-md p-6" data-testid="write-review-section">
                <h2 className="text-2xl font-semibold mb-4">Write a Review</h2>
                <p className="text-sm text-text-muted mb-4">Share your experience with other trekkers. Reviews will be visible after admin approval.</p>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <Label htmlFor="review_name">Your Name *</Label>
                    <Input
                      id="review_name"
                      value={reviewForm.customer_name}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, customer_name: e.target.value }))}
                      required
                      data-testid="review-input-name"
                    />
                  </div>
                  <div>
                    <Label>Rating *</Label>
                    <div className="flex gap-2 mt-2" data-testid="review-rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                          className="transition-transform hover:scale-125"
                          data-testid={`review-star-${star}`}
                        >
                          <Star
                            size={28}
                            className={star <= reviewForm.rating ? 'fill-primary text-primary' : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="review_comment">Your Review *</Label>
                    <Textarea
                      id="review_comment"
                      rows={4}
                      placeholder="Tell us about your experience on this trek..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      required
                      data-testid="review-input-comment"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white"
                    disabled={reviewSubmitting}
                    data-testid="submit-review-button"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </form>
              </div>
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

                    {/* Departure Date Selection */}
                    {trek.departure_dates && trek.departure_dates.length > 0 && (
                      <div>
                        <Label htmlFor="departure_date" className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary" />
                          Select Departure Date *
                        </Label>
                        <Select
                          value={bookingData.departure_date}
                          onValueChange={(value) => setBookingData(prev => ({ ...prev, departure_date: value }))}
                        >
                          <SelectTrigger data-testid="select-departure-date">
                            <SelectValue placeholder="Choose a date" />
                          </SelectTrigger>
                          <SelectContent>
                            {trek.departure_dates.map((date) => (
                              <SelectItem key={date} value={date}>
                                {new Date(date).toLocaleDateString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border mt-6 pt-6">
                    {/* Coupon Code */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium">Have a coupon code?</Label>
                      {couponApplied ? (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-4 py-3 mt-2" data-testid="coupon-applied-badge">
                          <div>
                            <span className="font-semibold text-green-800">{couponApplied.code}</span>
                            <span className="text-sm text-green-600 ml-2">-₹{couponApplied.discount_amount} off</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                            data-testid="remove-coupon-button"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1"
                            data-testid="input-coupon"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading}
                            className="shrink-0"
                            data-testid="apply-coupon-button"
                          >
                            {couponLoading ? '...' : 'Apply'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-text-muted">
                        <span>₹{trek.price} x {bookingData.num_members} member(s)</span>
                        <span>₹{baseAmount}</span>
                      </div>
                      {couponApplied && (
                        <div className="flex justify-between text-sm text-green-600" data-testid="discount-line">
                          <span>Discount ({couponApplied.code})</span>
                          <span>-₹{discountAmount}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mb-6 border-t border-border pt-4">
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
