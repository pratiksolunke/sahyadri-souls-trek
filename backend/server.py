from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, File, UploadFile, Response
from fastapi.params import Query
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
import requests
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client
razorpay_key_id = os.environ.get('RAZORPAY_KEY_ID', 'test_key')
razorpay_key_secret = os.environ.get('RAZORPAY_KEY_SECRET', 'test_secret')
try:
    razorpay_client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
except Exception:
    razorpay_client = None

# Resend email setup
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
REPLY_TO_EMAIL = os.environ.get('REPLY_TO_EMAIL', 'sahyadri.souls@gmail.com')

# Object Storage setup
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "sahyadri-souls-trek"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Admin token storage
admin_tokens = set()

async def verify_admin(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    if token not in admin_tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return token

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Trek(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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
    departure_dates: List[str] = []
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
    departure_dates: List[str] = []

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
    departure_date: Optional[str] = None
    payment_status: str = "pending"
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
    departure_date: Optional[str] = None

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trek_id: str
    customer_name: str
    rating: int
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

# Email helper
async def send_booking_confirmation_email(booking_data: dict):
    try:
        html_content = f"""
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; padding: 0;">
            <div style="background: #0B2046; padding: 30px; text-align: center;">
                <h1 style="color: #FDFBF7; margin: 0; font-size: 24px;">Sahyadri Souls Trek</h1>
                <p style="color: #F26A2E; margin: 5px 0 0; font-size: 14px;">Hike The Peaks</p>
            </div>
            
            <div style="padding: 30px; background: #ffffff;">
                <h2 style="color: #0B2046; margin-top: 0;">Booking Confirmed! 🎉</h2>
                <p style="color: #57534E; font-size: 16px;">
                    Dear <strong>{booking_data['customer_name']}</strong>,
                </p>
                <p style="color: #57534E; font-size: 16px;">
                    Your trek booking has been confirmed. Here are your details:
                </p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="border-bottom: 1px solid #E7E5E4;">
                        <td style="padding: 12px 0; color: #57534E;">Booking ID</td>
                        <td style="padding: 12px 0; font-weight: bold; text-align: right;">{booking_data['id']}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E7E5E4;">
                        <td style="padding: 12px 0; color: #57534E;">Trek</td>
                        <td style="padding: 12px 0; font-weight: bold; text-align: right;">{booking_data['trek_name']}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E7E5E4;">
                        <td style="padding: 12px 0; color: #57534E;">Departure Date</td>
                        <td style="padding: 12px 0; font-weight: bold; text-align: right;">{booking_data.get('departure_date', 'To be confirmed')}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #E7E5E4;">
                        <td style="padding: 12px 0; color: #57534E;">Members</td>
                        <td style="padding: 12px 0; font-weight: bold; text-align: right;">{booking_data['num_members']}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; color: #57534E; font-size: 18px;">Total Amount</td>
                        <td style="padding: 12px 0; font-weight: bold; text-align: right; font-size: 18px; color: #F26A2E;">₹{booking_data['total_amount']}</td>
                    </tr>
                </table>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <h3 style="color: #166534; margin: 0 0 8px;">What's Next?</h3>
                    <ul style="color: #57534E; margin: 0; padding-left: 20px;">
                        <li>Our team will contact you 2-3 days before the trek</li>
                        <li>Carry a government-issued ID</li>
                        <li>Wear comfortable trekking shoes</li>
                        <li>Carry minimum 2 liters of water</li>
                    </ul>
                </div>
                
                <p style="color: #57534E; font-size: 14px;">
                    For any queries, reach out to us on WhatsApp: <strong>+91 75889 17768</strong>
                </p>
            </div>
            
            <div style="background: #0B2046; padding: 20px; text-align: center;">
                <p style="color: #FDFBF7; margin: 0; font-size: 12px;">
                    © {datetime.now().year} Sahyadri Souls Trek | Chhatrapati Sambhaji Nagar, Maharashtra
                </p>
            </div>
        </div>
        """
        
        params = {
            "from": f"Sahyadri Souls Trek <{SENDER_EMAIL}>",
            "to": [booking_data['customer_email']],
            "reply_to": REPLY_TO_EMAIL,
            "subject": f"Booking Confirmed - {booking_data['trek_name']} | Sahyadri Souls Trek",
            "html": html_content
        }
        
        email = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Booking confirmation email sent to {booking_data['customer_email']}, id: {email.get('id')}")
        return True
    except Exception as e:
        logging.error(f"Failed to send booking email: {str(e)}")
        return False

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
        if 'departure_dates' not in trek:
            trek['departure_dates'] = []
    return treks

@api_router.get("/treks/{trek_id}", response_model=Trek)
async def get_trek(trek_id: str):
    trek = await db.treks.find_one({"id": trek_id}, {"_id": 0})
    if not trek:
        raise HTTPException(status_code=404, detail="Trek not found")
    if isinstance(trek.get('created_at'), str):
        trek['created_at'] = datetime.fromisoformat(trek['created_at'])
    if 'departure_dates' not in trek:
        trek['departure_dates'] = []
    return trek

@api_router.post("/treks", response_model=Trek)
async def create_trek(trek_input: TrekCreate, token: str = Depends(verify_admin)):
    trek_dict = trek_input.model_dump()
    trek_obj = Trek(**trek_dict)
    doc = trek_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.treks.insert_one(doc)
    return trek_obj

@api_router.put("/treks/{trek_id}", response_model=Trek)
async def update_trek(trek_id: str, trek_input: TrekCreate, token: str = Depends(verify_admin)):
    trek_dict = trek_input.model_dump()
    result = await db.treks.update_one(
        {"id": trek_id},
        {"$set": trek_dict}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Trek not found")
    return await get_trek(trek_id)

@api_router.delete("/treks/{trek_id}")
async def delete_trek(trek_id: str, token: str = Depends(verify_admin)):
    result = await db.treks.delete_one({"id": trek_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trek not found")
    return {"message": "Trek deleted successfully"}

# Image Upload Route
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), token: str = Depends(verify_admin)):
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WebP, GIF) are allowed")
    
    # Limit file size to 5MB
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{file_id}.{ext}"
    
    try:
        result = put_object(path, data, file.content_type or "image/jpeg")
        
        # Store in DB
        file_record = {
            "id": file_id,
            "storage_path": result["path"],
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": result.get("size", len(data)),
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.files.insert_one(file_record)
        
        return {"file_id": file_id, "path": result["path"], "url": f"/api/files/{file_id}"}
    except Exception as e:
        logging.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/files/{file_id}")
async def get_file(file_id: str):
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        data, content_type = get_object(record["storage_path"])
        return Response(content=data, media_type=record.get("content_type", content_type))
    except Exception as e:
        logging.error(f"File fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve file")

# Booking Routes
@api_router.post("/bookings/create-order")
async def create_order(booking_input: BookingCreate):
    booking_dict = booking_input.model_dump()
    booking_obj = Booking(**booking_dict)
    
    # Create Razorpay order
    if razorpay_client and razorpay_key_id != 'test_key':
        try:
            amount = booking_obj.total_amount * 100
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
            booking_obj.razorpay_order_id = f"order_mock_{booking_obj.id[:10]}"
    else:
        booking_obj.razorpay_order_id = f"order_mock_{booking_obj.id[:10]}"
    
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
    
    # Verify payment signature
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
    
    # Send confirmation email
    await send_booking_confirmation_email(booking)
    
    return {"message": "Payment verified successfully", "booking_id": payment_data.booking_id}

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(token: str = Depends(verify_admin)):
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
async def approve_review(review_id: str, token: str = Depends(verify_admin)):
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review approved successfully"}

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, token: str = Depends(verify_admin)):
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
        token = "admin_token_" + str(uuid.uuid4())
        admin_tokens.add(token)
        return {"message": "Login successful", "token": token}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Stats Route for Admin
@api_router.get("/admin/stats")
async def get_stats(token: str = Depends(verify_admin)):
    total_treks = await db.treks.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    completed_bookings = await db.bookings.count_documents({"payment_status": "completed"})
    pending_reviews = await db.reviews.count_documents({"approved": False})
    
    bookings = await db.bookings.find({"payment_status": "completed"}, {"_id": 0, "total_amount": 1}).to_list(10000)
    total_revenue = sum(b.get('total_amount', 0) for b in bookings)
    
    return {
        "total_treks": total_treks,
        "total_bookings": total_bookings,
        "completed_bookings": completed_bookings,
        "pending_reviews": pending_reviews,
        "total_revenue": total_revenue
    }

# Send test email endpoint
@api_router.post("/send-test-email")
async def send_test_email(token: str = Depends(verify_admin)):
    try:
        params = {
            "from": f"Sahyadri Souls Trek <{SENDER_EMAIL}>",
            "to": [REPLY_TO_EMAIL],
            "reply_to": REPLY_TO_EMAIL,
            "subject": "Test Email - Sahyadri Souls Trek",
            "html": "<h1>Email Setup Working!</h1><p>Your booking confirmation emails are ready to go.</p>"
        }
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "success", "email_id": email.get("id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email failed: {str(e)}")

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

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Object storage initialized successfully")
    except Exception as e:
        logger.error(f"Storage init failed (will retry on first upload): {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
