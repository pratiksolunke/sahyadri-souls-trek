# Sahyadri Souls Trek - PRD

## Original Problem Statement
Build a complete website named Sahyadri Souls Trek for a trekking company based in Chhatrapati Sambhaji Nagar, Maharashtra. Include payment (Razorpay), booking, WhatsApp receipt methods, trek listing with filters, image gallery, customer reviews, about/contact pages, and admin panel.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Payment**: Razorpay (currently using test keys)
- **WhatsApp**: wa.me redirect for receipts + floating chat widget (7588917768) + community group

## User Personas
1. **Trekker (Customer)**: Browse treks, view details, book with guest checkout, share receipt on WhatsApp
2. **Admin**: Manage treks, view bookings, approve/delete reviews, monitor stats

## Core Requirements
- Guest checkout booking (no login required for customers)
- Trek listing with search and difficulty filters
- Individual trek pages with image gallery, highlights, included/excluded
- Razorpay payment integration
- WhatsApp booking receipts + floating chat widget
- Admin panel with auth for managing treks, bookings, reviews
- Customer review system (post-trek reviews approved by admin)
- About Us and Contact pages

## What's Been Implemented (Feb 2026)
- Full homepage with hero, stats, featured treks, testimonials, CTA
- Trek listing page with search + difficulty filter
- Trek detail page with image gallery, booking form
- Guest checkout booking flow (name, email, phone, age, members)
- Razorpay order creation (MOCKED - test keys)
- Booking success page with WhatsApp share + email receipt buttons
- WhatsApp floating widget with chat (7588917768) + community group link popup
- Admin login (/admin/login) with token-based auth
- Admin dashboard (stats, trek CRUD, bookings list, reviews management)
- About Us and Contact pages
- Database seeded with 6 Maharashtra treks + 6 reviews
- Backend auth middleware on all admin endpoints

## Prioritized Backlog
### P0 (Critical for launch)
- Add real Razorpay API keys (user action required)
- Configure email service (SendGrid/Resend) for booking confirmations

### P1 (High priority)
- Trek date selection in booking
- Trek availability/calendar management
- Email confirmation after successful booking
- Image upload for admin (currently using URLs)

### P2 (Nice to have)
- SEO optimization (meta tags, Open Graph)
- Blog section for trek stories
- Social media integration
- Multi-language support (Marathi/Hindi)
- Customer gallery (photos from treks)
- Discount codes/coupons system

## Next Tasks
1. User needs to provide Razorpay API keys for live payments
2. Set up email service (Resend/SendGrid) for confirmations
3. Add trek date selection and availability calendar
4. Add image upload functionality for admin
