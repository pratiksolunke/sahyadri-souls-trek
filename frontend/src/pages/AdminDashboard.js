import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Check, X, TrendingUp, Users, Mountain, DollarSign, LogOut } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [treks, setTreks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isAddTrekOpen, setIsAddTrekOpen] = useState(false);
  const [editingTrek, setEditingTrek] = useState(null);
  
  const [trekForm, setTrekForm] = useState({
    name: '',
    location: '',
    duration: '',
    difficulty: 'Moderate',
    price: '',
    description: '',
    highlights: '',
    included: '',
    excluded: '',
    images: '',
    max_group_size: 15,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    fetchStats();
    fetchTreks();
    fetchBookings();
    fetchReviews();
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
  });

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (error) {
      if (error.response?.status === 401) { navigate('/admin/login'); return; }
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTreks = async () => {
    try {
      const response = await axios.get(`${API}/treks`);
      setTreks(response.data);
    } catch (error) {
      console.error('Error fetching treks:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`, getAuthHeaders());
      setBookings(response.data);
    } catch (error) {
      if (error.response?.status === 401) { navigate('/admin/login'); return; }
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const handleTrekFormChange = (field, value) => {
    setTrekForm(prev => ({ ...prev, [field]: value }));
  };

  const resetTrekForm = () => {
    setTrekForm({
      name: '',
      location: '',
      duration: '',
      difficulty: 'Moderate',
      price: '',
      description: '',
      highlights: '',
      included: '',
      excluded: '',
      images: '',
      max_group_size: 15,
    });
    setEditingTrek(null);
  };

  const handleAddTrek = async (e) => {
    e.preventDefault();
    
    const trekData = {
      ...trekForm,
      price: parseInt(trekForm.price),
      max_group_size: parseInt(trekForm.max_group_size),
      highlights: trekForm.highlights.split('\n').filter(h => h.trim()),
      included: trekForm.included.split('\n').filter(i => i.trim()),
      excluded: trekForm.excluded.split('\n').filter(e => e.trim()),
      images: trekForm.images.split('\n').filter(img => img.trim()),
    };

    try {
      if (editingTrek) {
        await axios.put(`${API}/treks/${editingTrek.id}`, trekData, getAuthHeaders());
        toast.success('Trek updated successfully');
      } else {
        await axios.post(`${API}/treks`, trekData, getAuthHeaders());
        toast.success('Trek added successfully');
      }
      
      fetchTreks();
      fetchStats();
      setIsAddTrekOpen(false);
      resetTrekForm();
    } catch (error) {
      toast.error('Failed to save trek');
    }
  };

  const handleEditTrek = (trek) => {
    setEditingTrek(trek);
    setTrekForm({
      name: trek.name,
      location: trek.location,
      duration: trek.duration,
      difficulty: trek.difficulty,
      price: trek.price.toString(),
      description: trek.description,
      highlights: trek.highlights.join('\n'),
      included: trek.included.join('\n'),
      excluded: trek.excluded.join('\n'),
      images: trek.images.join('\n'),
      max_group_size: trek.max_group_size,
    });
    setIsAddTrekOpen(true);
  };

  const handleDeleteTrek = async (trekId) => {
    if (!window.confirm('Are you sure you want to delete this trek?')) return;
    
    try {
      await axios.delete(`${API}/treks/${trekId}`, getAuthHeaders());
      toast.success('Trek deleted successfully');
      fetchTreks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete trek');
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await axios.put(`${API}/reviews/${reviewId}/approve`, {}, getAuthHeaders());
      toast.success('Review approved');
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast.error('Failed to approve review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await axios.delete(`${API}/reviews/${reviewId}`, getAuthHeaders());
      toast.success('Review deleted');
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-text-muted">Manage your trekking business</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            <LogOut className="mr-2" size={18} />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-testid="stats-section">
            <div className="bg-white border border-border rounded-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-muted text-sm">Total Treks</span>
                <Mountain className="text-primary" size={24} />
              </div>
              <p className="text-3xl font-bold" data-testid="stat-treks">{stats.total_treks}</p>
            </div>
            
            <div className="bg-white border border-border rounded-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-muted text-sm">Total Bookings</span>
                <Users className="text-primary" size={24} />
              </div>
              <p className="text-3xl font-bold" data-testid="stat-bookings">{stats.total_bookings}</p>
            </div>
            
            <div className="bg-white border border-border rounded-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-muted text-sm">Revenue</span>
                <DollarSign className="text-primary" size={24} />
              </div>
              <p className="text-3xl font-bold" data-testid="stat-revenue">₹{stats.total_revenue}</p>
            </div>
            
            <div className="bg-white border border-border rounded-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-muted text-sm">Pending Reviews</span>
                <TrendingUp className="text-primary" size={24} />
              </div>
              <p className="text-3xl font-bold" data-testid="stat-reviews">{stats.pending_reviews}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="treks" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="treks" data-testid="tab-treks">Treks</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Treks Tab */}
          <TabsContent value="treks">
            <div className="bg-white border border-border rounded-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Manage Treks</h2>
                <Dialog open={isAddTrekOpen} onOpenChange={setIsAddTrekOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary-hover" data-testid="add-trek-button">
                      <Plus className="mr-2" size={18} />
                      Add Trek
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingTrek ? 'Edit Trek' : 'Add New Trek'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddTrek} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Trek Name *</Label>
                          <Input
                            value={trekForm.name}
                            onChange={(e) => handleTrekFormChange('name', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Location *</Label>
                          <Input
                            value={trekForm.location}
                            onChange={(e) => handleTrekFormChange('location', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Duration *</Label>
                          <Input
                            placeholder="e.g., 2 Days 1 Night"
                            value={trekForm.duration}
                            onChange={(e) => handleTrekFormChange('duration', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Difficulty *</Label>
                          <Select
                            value={trekForm.difficulty}
                            onValueChange={(value) => handleTrekFormChange('difficulty', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Easy">Easy</SelectItem>
                              <SelectItem value="Moderate">Moderate</SelectItem>
                              <SelectItem value="Difficult">Difficult</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Price (₹) *</Label>
                          <Input
                            type="number"
                            value={trekForm.price}
                            onChange={(e) => handleTrekFormChange('price', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Max Group Size *</Label>
                          <Input
                            type="number"
                            value={trekForm.max_group_size}
                            onChange={(e) => handleTrekFormChange('max_group_size', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Description *</Label>
                        <Textarea
                          rows={3}
                          value={trekForm.description}
                          onChange={(e) => handleTrekFormChange('description', e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label>Highlights (one per line)</Label>
                        <Textarea
                          rows={3}
                          placeholder="Enter each highlight on a new line"
                          value={trekForm.highlights}
                          onChange={(e) => handleTrekFormChange('highlights', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Included (one per line)</Label>
                        <Textarea
                          rows={3}
                          placeholder="Enter each included item on a new line"
                          value={trekForm.included}
                          onChange={(e) => handleTrekFormChange('included', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Excluded (one per line)</Label>
                        <Textarea
                          rows={3}
                          placeholder="Enter each excluded item on a new line"
                          value={trekForm.excluded}
                          onChange={(e) => handleTrekFormChange('excluded', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Image URLs (one per line) *</Label>
                        <Textarea
                          rows={3}
                          placeholder="Enter each image URL on a new line"
                          value={trekForm.images}
                          onChange={(e) => handleTrekFormChange('images', e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="flex-1" data-testid="save-trek-button">
                          {editingTrek ? 'Update Trek' : 'Add Trek'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddTrekOpen(false);
                            resetTrekForm();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {treks.map((trek) => (
                  <div
                    key={trek.id}
                    className="border border-border rounded-md p-4 flex items-center justify-between"
                    data-testid="trek-item"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={trek.images[0]}
                        alt={trek.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{trek.name}</h3>
                        <p className="text-sm text-text-muted">
                          {trek.location} • {trek.duration} • ₹{trek.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTrek(trek)}
                        data-testid={`edit-trek-${trek.id}`}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTrek(trek.id)}
                        data-testid={`delete-trek-${trek.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="bg-white border border-border rounded-md p-6">
              <h2 className="text-2xl font-semibold mb-6">All Bookings</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Trek</th>
                      <th className="text-left p-3">Members</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b last:border-0" data-testid="booking-row">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{booking.customer_name}</p>
                            <p className="text-sm text-text-muted">{booking.customer_email}</p>
                          </div>
                        </td>
                        <td className="p-3">{booking.trek_name}</td>
                        <td className="p-3">{booking.num_members}</td>
                        <td className="p-3">₹{booking.total_amount}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              booking.payment_status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : booking.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {booking.payment_status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-text-muted">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <div className="bg-white border border-border rounded-md p-6">
              <h2 className="text-2xl font-semibold mb-6">Manage Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-border rounded-md p-4"
                    data-testid="review-item"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{review.customer_name}</p>
                          <div className="flex gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <span key={i} className="text-primary">★</span>
                            ))}
                          </div>
                          {review.approved && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Approved
                            </span>
                          )}
                        </div>
                        <p className="text-text-muted mb-2">{review.comment}</p>
                        <p className="text-sm text-text-muted">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!review.approved && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveReview(review.id)}
                            data-testid={`approve-review-${review.id}`}
                          >
                            <Check size={16} />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          data-testid={`delete-review-${review.id}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
