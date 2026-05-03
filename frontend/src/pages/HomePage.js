import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mountain, Users, Award, Calendar, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [featuredTreks, setFeaturedTreks] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchFeaturedTreks();
    fetchReviews();
  }, []);

  const fetchFeaturedTreks = async () => {
    try {
      const response = await axios.get(`${API}/treks`);
      setFeaturedTreks(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching treks:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews?approved_only=true`);
      setReviews(response.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const stats = [
    { icon: Mountain, label: 'Treks Completed', value: '500+' },
    { icon: Users, label: 'Happy Trekkers', value: '2000+' },
    { icon: Award, label: 'Years Experience', value: '10+' },
    { icon: Calendar, label: 'Monthly Events', value: '20+' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1643559310339-eebc1a58a241?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHN1bnNldHxlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85)',
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            Hike The Peaks,
            <br />
            <span className="text-primary">Discover Your Soul</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl mb-8 text-white/90 max-w-2xl mx-auto"
          >
            Experience the majestic Sahyadri mountains with expert guides. 
            Adventure awaits in Maharashtra's most beautiful landscapes.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button 
              asChild 
              size="lg" 
              className="bg-primary hover:bg-primary-hover text-white px-8 py-6 text-lg rounded-md"
              data-testid="explore-treks-button"
            >
              <Link to="/treks">
                Explore Treks <ArrowRight className="ml-2" size={20} />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                  data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Icon className="text-primary" size={28} />
                  </div>
                  <h3 className="text-3xl font-bold text-secondary mb-2">{stat.value}</h3>
                  <p className="text-text-muted">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Treks */}
      <section className="py-20" data-testid="featured-treks-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4">Featured Treks</h2>
            <p className="text-base text-text-muted max-w-2xl mx-auto">
              Explore our handpicked selection of the most popular trekking experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredTreks.map((trek, index) => (
              <motion.div
                key={trek.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={`/treks/${trek.id}`} data-testid={`featured-trek-card-${index}`}>
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
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{trek.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-text-muted mb-4">
                        <span>{trek.duration}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          trek.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          trek.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {trek.difficulty}
                        </span>
                      </div>
                      <p className="text-text-muted text-sm line-clamp-2">{trek.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="rounded-md" data-testid="view-all-treks-button">
              <Link to="/treks">View All Treks</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="py-20 bg-white" data-testid="testimonials-section">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4">What Trekkers Say</h2>
              <p className="text-base text-text-muted max-w-2xl mx-auto">
                Real experiences from our adventure community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background border border-border rounded-md p-6"
                  data-testid={`testimonial-card-${index}`}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? 'fill-primary text-primary' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <p className="text-text-muted mb-4 italic">"{review.comment}"</p>
                  <p className="font-semibold text-secondary">{review.customer_name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-white" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-lg mb-8 text-white/90">
            Join us on an unforgettable journey through the Sahyadri mountains
          </p>
          <Button 
            asChild 
            size="lg" 
            className="bg-primary hover:bg-primary-hover text-white px-8 py-6 text-lg rounded-md"
            data-testid="cta-contact-button"
          >
            <Link to="/contact">Get in Touch</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
