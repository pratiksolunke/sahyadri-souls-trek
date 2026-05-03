from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client (will work with test keys or real keys)
razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID', 'test_key')
razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET', 'test_secret')
try:
    razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
except:
    razorpay_client = None

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Trek(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    duration: str  # e.g., "2 Days 1 Night"
    difficulty: str  # Easy, Moderate, Difficult
    price: int  # Price in INR
    description: str
    highlights: List[str]
    included: List[str]
    excluded: List[str]
    images: List[str]
    max_group_size: int = 15
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrekCreate(BaseModel):
    name: str
    location: str
    duration: str
    difficulty: str
    price: int
    description: str
    highlights: List[str]
    included: List[str]
    excluded: List[str]
    images: List[str]
    max_group_size: int = 15

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trek_id: str
    trek_name: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    age: int
    num_members: int
    total_amount: int
    payment_status: str = "pending"  # pending, completed, failed
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    booking_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    trek_id: str
    trek_name: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    age: int
    num_members: int
    total_amount: int

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trek_id: str
    customer_name: str
    rating: int  # 1-5
    comment: str
    approved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    trek_id: str
    customer_name: str
    rating: int
    comment: str

class AdminLogin(BaseModel):
    username: str
    password: str

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    booking_id: str

# Trek Routes
@api_router.get("/treks", response_model=List[Trek])
async def get_treks(difficulty: Optional[str] = None, location: Optional[str] = None):
    query = {}
    if difficulty:
        query['difficulty'] = difficulty
    if location:
        query['location'] = {'$regex': location, '$options': 'i'}
    
    treks = await db.treks.find(query, {"_id": 0}).to_list(100)
    for trek in treks:
        if isinstance(trek.get('created_at'), str):
            trek['created_at'] = datetime.fromisoformat(trek['created_at'])
    return treks

@api_router.get("/treks/{trek_id}", response_model=Trek)
async def get_trek(trek_id: str):
    trek = await db.treks.find_one({"id": trek_id}, {"_id": 0})
    if not trek:
        raise HTTPException(status_code=404, detail="Trek not found")
    if isinstance(trek.get('created_at'), str):
        trek['created_at'] = datetime.fromisoformat(trek['created_at'])
    return trek

@api_router.post("/treks", response_model=Trek)
async def create_trek(trek_input: TrekCreate):
    trek_dict = trek_input.model_dump()
    trek_obj = Trek(**trek_dict)
    doc = trek_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.treks.insert_one(doc)
    return trek_obj

@api_router.put("/treks/{trek_id}", response_model=Trek)
async def update_trek(trek_id: str, trek_input: TrekCreate):
    trek_dict = trek_input.model_dump()
    result = await db.treks.update_one(
        {"id": trek_id},
        {"$set": trek_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Trek not found")
    return await get_trek(trek_id)

@api_router.delete("/treks/{trek_id}")
async def delete_trek(trek_id: str):
    result = await db.treks.delete_one({"id": trek_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trek not found")
    return {"message": "Trek deleted successfully"}

# Booking Routes
@api_router.post("/bookings/create-order")
async def create_order(booking_input: BookingCreate):
    # Create booking in database
    booking_dict = booking_input.model_dump()
    booking_obj = Booking(**booking_dict)
    
    # Create Razorpay order
    if razorpay_client and razorpay_key_id != 'test_key':
        try:
            amount = booking_obj.total_amount * 100  # Convert to paise
            order_data = {
                "amount": amount,
                "currency": "INR",
                "receipt": booking_obj.id[:40],
                "payment_capture": 1
            }
            razorpay_order = razorpay_client.order.create(data=order_data)
            booking_obj.razorpay_order_id = razorpay_order['id']
        except Exception as e:
            logging.error(f"Razorpay order creation failed: {str(e)}")
            # Continue with mock order for demo
            booking_obj.razorpay_order_id = f"order_mock_{booking_obj.id[:10]}"
    else:
        # Mock order for testing
        booking_obj.razorpay_order_id = f"order_mock_{booking_obj.id[:10]}"
    
    # Save booking
    doc = booking_obj.model_dump()
    doc['booking_date'] = doc['booking_date'].isoformat()
    await db.bookings.insert_one(doc)
    
    return {
        "booking_id": booking_obj.id,
        "order_id": booking_obj.razorpay_order_id,
        "amount": booking_obj.total_amount,
        "key_id": razorpay_key_id,
        "customer_name": booking_obj.customer_name,
        "customer_email": booking_obj.customer_email,
        "customer_phone": booking_obj.customer_phone
    }

@api_router.post("/bookings/verify-payment")
async def verify_payment(payment_data: PaymentVerification):
    booking = await db.bookings.find_one({"id": payment_data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify payment signature (skip for mock payments)
    if razorpay_key_id != 'test_key' and razorpay_client:
        try:
            params_dict = {
                'razorpay_order_id': payment_data.razorpay_order_id,
                'razorpay_payment_id': payment_data.razorpay_payment_id,
                'razorpay_signature': payment_data.razorpay_signature
            }
            razorpay_client.utility.verify_payment_signature(params_dict)
        except Exception as e:
            await db.bookings.update_one(
                {"id": payment_data.booking_id},
                {"$set": {"payment_status": "failed"}}
            )
            raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update booking status
    await db.bookings.update_one(
        {"id": payment_data.booking_id},
        {"$set": {
            "payment_status": "completed",
            "razorpay_payment_id": payment_data.razorpay_payment_id
        }}
    )
    
    return {"message": "Payment verified successfully", "booking_id": payment_data.booking_id}

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    for booking in bookings:
        if isinstance(booking.get('booking_date'), str):
            booking['booking_date'] = datetime.fromisoformat(booking['booking_date'])
    return bookings

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if isinstance(booking.get('booking_date'), str):
        booking['booking_date'] = datetime.fromisoformat(booking['booking_date'])
    return booking

# Review Routes
@api_router.post("/reviews", response_model=Review)
async def create_review(review_input: ReviewCreate):
    review_dict = review_input.model_dump()
    review_obj = Review(**review_dict)
    doc = review_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.reviews.insert_one(doc)
    return review_obj

@api_router.get("/reviews", response_model=List[Review])
async def get_reviews(trek_id: Optional[str] = None, approved_only: bool = False):
    query = {}
    if trek_id:
        query['trek_id'] = trek_id
    if approved_only:
        query['approved'] = True
    
    reviews = await db.reviews.find(query, {"_id": 0}).to_list(1000)
    for review in reviews:
        if isinstance(review.get('created_at'), str):
            review['created_at'] = datetime.fromisoformat(review['created_at'])
    return reviews

@api_router.put("/reviews/{review_id}/approve")
async def approve_review(review_id: str):
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review approved successfully"}

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str):
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted successfully"}

# Admin Route
@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    if credentials.username == admin_username and credentials.password == admin_password:
        return {"message": "Login successful", "token": "admin_token_" + str(uuid.uuid4())}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Stats Route for Admin
@api_router.get("/admin/stats")
async def get_stats():
    total_treks = await db.treks.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    completed_bookings = await db.bookings.count_documents({"payment_status": "completed"})
    pending_reviews = await db.reviews.count_documents({"approved": False})
    
    # Calculate total revenue
    bookings = await db.bookings.find({"payment_status": "completed"}, {"_id": 0, "total_amount": 1}).to_list(10000)
    total_revenue = sum(b.get('total_amount', 0) for b in bookings)
    
    return {
        "total_treks": total_treks,
        "total_bookings": total_bookings,
        "completed_bookings": completed_bookings,
        "pending_reviews": pending_reviews,
        "total_revenue": total_revenue
    }

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()