import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Users } from 'lucide-react';

const WhatsAppWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const WHATSAPP_NUMBER = '917588917768';
  const COMMUNITY_LINK = 'https://chat.whatsapp.com/B9loAbbWP2KEGJj9nSyxDk?mode=gi_t';

  // Show popup after 5 seconds for first-time visitors
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('whatsapp_popup_seen');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        setIsOpen(true);
        sessionStorage.setItem('whatsapp_popup_seen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChatClick = () => {
    const message = encodeURIComponent('Hi! I am interested in trekking with Sahyadri Souls. Can you tell me about upcoming treks?');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const handleCommunityClick = () => {
    window.open(COMMUNITY_LINK, '_blank');
  };

  return (
    <div className="fixed bottom-20 right-4 z-[9998]" data-testid="whatsapp-widget">
      {/* Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl border border-border overflow-hidden"
            data-testid="whatsapp-popup"
          >
            {/* Header */}
            <div className="bg-[#075E54] p-4 text-white relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
                data-testid="close-whatsapp-popup"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src="https://customer-assets.emergentagent.com/job_67e65c9a-584b-48ad-8d49-6a2225203899/artifacts/nvdxnh6u_Picsart_25-09-13_14-14-09-163.png"
                  alt="Sahyadri Souls"
                  className="w-12 h-12 rounded-full bg-white p-1"
                />
                <div>
                  <h3 className="font-semibold text-base">Sahyadri Souls Trek</h3>
                  <p className="text-xs text-white/80">Typically replies within minutes</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-text-muted mb-4">
                Hey there! Ready for your next adventure? Connect with us!
              </p>

              {/* Chat Button */}
              <button
                onClick={handleChatClick}
                className="w-full flex items-center gap-3 p-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-lg hover:bg-[#25D366]/20 transition-colors group"
                data-testid="whatsapp-chat-button"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-[#075E54]">Chat with Us</p>
                  <p className="text-xs text-text-muted">Ask about treks & bookings</p>
                </div>
              </button>

              {/* Community Group Button */}
              <button
                onClick={handleCommunityClick}
                className="w-full flex items-center gap-3 p-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-lg hover:bg-[#25D366]/20 transition-colors group"
                data-testid="whatsapp-community-button"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-[#128C7E] rounded-full flex items-center justify-center">
                  <Users size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-[#075E54]">Join Our Community</p>
                  <p className="text-xs text-text-muted">Connect with fellow trekkers</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        data-testid="whatsapp-floating-button"
        aria-label="WhatsApp"
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )}
      </motion.button>

      {/* Pulse animation for attention */}
      {!isOpen && (
        <span className="absolute -top-1 -right-1 w-4 h-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#25D366]"></span>
        </span>
      )}
    </div>
  );
};

export default WhatsAppWidget;
