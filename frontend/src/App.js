import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import HomePage from '@/pages/HomePage';
import TrekListPage from '@/pages/TrekListPage';
import TrekDetailPage from '@/pages/TrekDetailPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import BookingSuccess from '@/pages/BookingSuccess';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/treks" element={<TrekListPage />} />
          <Route path="/treks/:trekId" element={<TrekDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/booking-success/:bookingId" element={<BookingSuccess />} />
        </Routes>
        <Footer />
        <WhatsAppWidget />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
