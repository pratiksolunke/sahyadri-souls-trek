import { motion } from 'framer-motion';
import { Mountain, Heart, Award, Users } from 'lucide-react';

const AboutPage = () => {
  const values = [
    {
      icon: Mountain,
      title: 'Adventure First',
      description: 'We believe in creating authentic mountain experiences that challenge and inspire.',
    },
    {
      icon: Heart,
      title: 'Safety & Care',
      description: 'Your safety is our top priority with experienced guides and proper equipment.',
    },
    {
      icon: Award,
      title: 'Expert Guides',
      description: 'Our certified guides have years of experience in the Sahyadri ranges.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Join a community of adventure seekers and nature lovers.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-96 flex items-center justify-center overflow-hidden"
        data-testid="about-hero-section"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1766852254215-ec02eeec50fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHx0cmVra2luZyUyMGdyb3VwfGVufDB8fHx8MTc3NjI3Mjg4MHww&ixlib=rb-4.1.0&q=85)',
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 text-center text-white px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
          >
            About Us
          </motion.h1>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6">Our Story</h2>
            <div className="space-y-4 text-text-muted text-lg leading-relaxed">
              <p>
                Founded in Chhatrapati Sambhaji Nagar, Maharashtra, Sahyadri Souls Trek was born from a 
                deep love for the majestic Sahyadri mountains. What started as a small group of adventure 
                enthusiasts has grown into a thriving community of trekkers and nature lovers.
              </p>
              <p>
                For over a decade, we've been organizing unforgettable trekking experiences across the 
                Western Ghats. Our mission is to make the beauty of the Sahyadri ranges accessible to 
                everyone while promoting responsible and sustainable tourism.
              </p>
              <p>
                Every trek we organize is carefully planned to ensure safety, comfort, and an authentic 
                connection with nature. We believe that the mountains have something special to teach us, 
                and we're here to facilitate that journey.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20" data-testid="values-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4">Our Values</h2>
            <p className="text-base text-text-muted max-w-2xl mx-auto">
              The principles that guide every trek we organize
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white border border-border rounded-md p-6 text-center"
                  data-testid={`value-card-${index}`}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Icon className="text-primary" size={28} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-text-muted text-sm">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6">Why Choose Us?</h2>
          <div className="space-y-4 text-text-muted text-lg leading-relaxed">
            <p>
              <strong className="text-secondary">Experienced Guides:</strong> All our trek leaders are 
              certified and have extensive knowledge of the Sahyadri ranges.
            </p>
            <p>
              <strong className="text-secondary">Safety First:</strong> We follow strict safety protocols 
              and carry all necessary emergency equipment on every trek.
            </p>
            <p>
              <strong className="text-secondary">Small Groups:</strong> We maintain small group sizes to 
              ensure personalized attention and minimal environmental impact.
            </p>
            <p>
              <strong className="text-secondary">Local Expertise:</strong> Being based in Chhatrapati 
              Sambhaji Nagar, we have deep connections with local communities and intimate knowledge of the region.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
