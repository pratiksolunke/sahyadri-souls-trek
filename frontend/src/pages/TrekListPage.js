import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrekListPage = () => {
  const [treks, setTreks] = useState([]);
  const [filteredTreks, setFilteredTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    difficulty: '',
    search: '',
  });

  useEffect(() => {
    fetchTreks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, treks]);

  const fetchTreks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/treks`);
      setTreks(response.data);
      setFilteredTreks(response.data);
    } catch (error) {
      console.error('Error fetching treks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...treks];

    if (filters.difficulty) {
      filtered = filtered.filter(trek => trek.difficulty === filters.difficulty);
    }

    if (filters.search) {
      filtered = filtered.filter(trek => 
        trek.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        trek.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        trek.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredTreks(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Explore Our Treks</h1>
          <p className="text-base text-text-muted max-w-2xl mx-auto">
            Discover amazing trekking experiences across the Sahyadri ranges
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-border rounded-md p-6 mb-12" data-testid="trek-filters">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Filter Treks</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
                <Input
                  type="text"
                  placeholder="Search by name or location..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty Level</label>
              <Select 
                value={filters.difficulty} 
                onValueChange={(value) => handleFilterChange('difficulty', value)}
              >
                <SelectTrigger data-testid="difficulty-filter">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Difficult">Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(filters.difficulty || filters.search) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ difficulty: '', search: '' })}
                data-testid="clear-filters-button"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Trek Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-text-muted">Loading treks...</p>
          </div>
        ) : filteredTreks.length === 0 ? (
          <div className="text-center py-20" data-testid="no-treks-message">
            <p className="text-xl text-text-muted">No treks found matching your criteria.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFilters({ difficulty: '', search: '' })}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="trek-grid">
            {filteredTreks.map((trek, index) => (
              <motion.div
                key={trek.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link to={`/treks/${trek.id}`} data-testid={`trek-card-${index}`}>
                  <div className="group bg-white border border-border rounded-md overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={trek.images?.[0] || 'https://via.placeholder.com/400x300'}
                        alt={trek.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-secondary">
                        ₹{trek.price}
                      </div>
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${
                        trek.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        trek.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {trek.difficulty}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{trek.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
                        <span>{trek.location}</span>
                        <span>•</span>
                        <span>{trek.duration}</span>
                      </div>
                      <p className="text-text-muted text-sm line-clamp-3">{trek.description}</p>
                      <Button className="w-full mt-4 bg-primary hover:bg-primary-hover" data-testid={`view-trek-button-${index}`}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrekListPage;
