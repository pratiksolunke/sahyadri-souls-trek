import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-[#FDFBF7] py-20 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* About Section */}
          <div className="md:col-span-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_67e65c9a-584b-48ad-8d49-6a2225203899/artifacts/nvdxnh6u_Picsart_25-09-13_14-14-09-163.png" 
              alt="Sahyadri Souls Trek" 
              className="h-16 w-16 object-contain mb-4"
            />
            <h3 className="text-2xl font-bold mb-4">Sahyadri Souls Trek</h3>
            <p className="text-[#FDFBF7]/80 leading-relaxed">
              Experience the majestic Sahyadri mountains with expert guides. 
              We create unforgettable trekking adventures for all skill levels.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/treks" className="text-[#FDFBF7]/80 hover:text-primary transition-colors" data-testid="footer-treks-link">
                  Browse Treks
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#FDFBF7]/80 hover:text-primary transition-colors" data-testid="footer-about-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#FDFBF7]/80 hover:text-primary transition-colors" data-testid="footer-contact-link">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-5">
            <h4 className="text-lg font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="mt-1 flex-shrink-0" />
                <span className="text-[#FDFBF7]/80">
                  Chhatrapati Sambhaji Nagar, Maharashtra, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="flex-shrink-0" />
                <a href="tel:+919876543210" className="text-[#FDFBF7]/80 hover:text-primary transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="flex-shrink-0" />
                <a href="mailto:info@sahyadrisouls.com" className="text-[#FDFBF7]/80 hover:text-primary transition-colors">
                  info@sahyadrisouls.com
                </a>
              </li>
            </ul>
            <div className="flex gap-4 mt-6">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-white/10 rounded-md hover:bg-primary transition-colors"
                data-testid="footer-facebook-link"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-white/10 rounded-md hover:bg-primary transition-colors"
                data-testid="footer-instagram-link"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center text-[#FDFBF7]/60">
          <p>&copy; {new Date().getFullYear()} Sahyadri Souls Trek. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
