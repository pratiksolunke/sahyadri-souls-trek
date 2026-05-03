import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_treks():
    # Check if treks already exist
    existing_count = await db.treks.count_documents({})
    if existing_count > 0:
        print(f"Database already has {existing_count} treks. Skipping seed.")
        return
    
    treks = [
        {
            "id": str(uuid.uuid4()),
            "name": "Kalsubai Peak Trek",
            "location": "Bhandardara, Maharashtra",
            "duration": "1 Day",
            "difficulty": "Moderate",
            "price": 1200,
            "description": "Kalsubai is the highest peak in Maharashtra at 1,646 meters. This trek offers breathtaking views of the Sahyadri ranges and is perfect for adventure seekers looking for a challenging day trek.",
            "highlights": [
                "Highest peak in Maharashtra",
                "Stunning sunrise and sunset views",
                "Ancient Kalsubai temple at summit",
                "360-degree panoramic views",
                "Iron ladders and chains for climbing"
            ],
            "included": [
                "Professional trek leader",
                "First aid kit",
                "Forest permits and entry fees",
                "Breakfast and lunch",
                "Transportation from base"
            ],
            "excluded": [
                "Personal expenses",
                "Any meals not mentioned",
                "Travel insurance",
                "Tips and gratuities"
            ],
            "images": [
                "https://images.unsplash.com/photo-1693725045062-905d5328b73d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHx0cmVra2luZyUyMG1vdW50YWluc3xlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85",
                "https://images.unsplash.com/photo-1693725045204-83223dcd6865?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHx0cmVra2luZyUyMG1vdW50YWluc3xlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85",
                "https://images.unsplash.com/photo-1643559310339-eebc1a58a241?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHN1bnNldHxlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85"
            ],
            "max_group_size": 20,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Harishchandragad Fort Trek",
            "location": "Malshej, Maharashtra",
            "duration": "2 Days 1 Night",
            "difficulty": "Difficult",
            "price": 2500,
            "description": "One of the most spectacular treks in the Sahyadris, featuring the famous Konkankada cliff and ancient caves. This overnight trek is perfect for experienced trekkers seeking adventure.",
            "highlights": [
                "Konkankada - the cliff with valley views",
                "Ancient Harishchandreshwar temple",
                "Natural rock-cut water cisterns",
                "Camping under the stars",
                "Kedareshwar cave with Shivling"
            ],
            "included": [
                "Experienced trek leaders",
                "Camping equipment and tents",
                "All meals (dinner, breakfast, lunch)",
                "First aid and safety equipment",
                "Forest permits"
            ],
            "excluded": [
                "Transportation to base village",
                "Personal trekking gear",
                "Any additional food or beverages",
                "Insurance"
            ],
            "images": [
                "https://images.pexels.com/photos/20315033/pexels-photo-20315033.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "https://images.unsplash.com/photo-1698521653388-db9ee7fae6d8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwzfHxjYW1waW5nJTIwdGVudCUyMGZvcmVzdHxlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85",
                "https://images.unsplash.com/photo-1766852254215-ec02eeec50fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHx0cmVra2luZyUyMGdyb3VwfGVufDB8fHx8MTc3NjI3Mjg4MHww&ixlib=rb-4.1.0&q=85"
            ],
            "max_group_size": 15,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Rajmachi Fort Trek",
            "location": "Lonavala, Maharashtra",
            "duration": "1 Day",
            "difficulty": "Easy",
            "price": 800,
            "description": "A beginner-friendly trek perfect for families and first-time trekkers. Rajmachi offers beautiful views of the surrounding valleys and the historic twin forts of Shrivardhan and Manaranjan.",
            "highlights": [
                "Perfect for beginners and families",
                "Twin forts - Shrivardhan and Manaranjan",
                "Lush green landscapes during monsoon",
                "Ancient architecture and ruins",
                "Scenic village trek"
            ],
            "included": [
                "Trek guide",
                "Breakfast and lunch",
                "First aid kit",
                "Entry permits"
            ],
            "excluded": [
                "Transportation",
                "Personal expenses",
                "Any beverages",
                "Travel insurance"
            ],
            "images": [
                "https://images.pexels.com/photos/19716647/pexels-photo-19716647.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "https://images.unsplash.com/photo-1693725045062-905d5328b73d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHx0cmVra2luZyUyMG1vdW50YWluc3xlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85",
                "https://images.unsplash.com/photo-1766852254215-ec02eeec50fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHx0cmVra2luZyUyMGdyb3VwfGVufDB8fHx8MTc3NjI3Mjg4MHww&ixlib=rb-4.1.0&q=85"
            ],
            "max_group_size": 25,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ratangad Night Trek",
            "location": "Bhandardara, Maharashtra",
            "duration": "1 Night",
            "difficulty": "Moderate",
            "price": 1500,
            "description": "Experience the magic of trekking under the stars! This night trek to Ratangad offers a unique adventure with the chance to witness a spectacular sunrise from the summit.",
            "highlights": [
                "Night trekking experience",
                "Stunning sunrise views",
                "Famous needle hole (Nedhe)",
                "Historic fort ruins",
                "Cave camping at summit"
            ],
            "included": [
                "Night trek guide with flashlights",
                "Dinner and breakfast",
                "Safety equipment",
                "Forest permits",
                "Group bonfire (weather permitting)"
            ],
            "excluded": [
                "Transportation to base",
                "Personal trekking gear",
                "Lunch",
                "Insurance"
            ],
            "images": [
                "https://images.unsplash.com/photo-1643559310339-eebc1a58a241?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHN1bnNldHxlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85",
                "https://images.unsplash.com/photo-1698521653388-db9ee7fae6d8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwzfHxjYW1waW5nJTIwdGVudCUyMGZvcmVzdHxlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85",
                "https://images.unsplash.com/photo-1693725045204-83223dcd6865?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHx0cmVra2luZyUyMG1vdW50YWluc3xlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85"
            ],
            "max_group_size": 18,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sandhan Valley Trek",
            "location": "Igatpuri, Maharashtra",
            "duration": "1 Day",
            "difficulty": "Moderate",
            "price": 1800,
            "description": "Known as the Valley of Shadows, Sandhan Valley offers a thrilling experience with rock climbing, rappelling, and walking through narrow gorges with towering cliffs on both sides.",
            "highlights": [
                "Valley of Shadows experience",
                "Water rappelling (seasonal)",
                "Rock climbing sections",
                "200 feet deep valley",
                "Unique geological formations"
            ],
            "included": [
                "Professional climbing instructors",
                "All safety gear and ropes",
                "Breakfast and lunch",
                "First aid and emergency equipment",
                "Photography support"
            ],
            "excluded": [
                "Transportation",
                "Personal climbing gear (can be rented)",
                "Any meals not mentioned",
                "Medical insurance"
            ],
            "images": [
                "https://images.pexels.com/photos/20315033/pexels-photo-20315033.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "https://images.unsplash.com/photo-1693725045062-905d5328b73d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHx0cmVra2luZyUyMG1vdW50YWluc3xlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85",
                "https://images.pexels.com/photos/19716647/pexels-photo-19716647.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            ],
            "max_group_size": 12,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Torna Fort Trek",
            "location": "Pune, Maharashtra",
            "duration": "1 Day",
            "difficulty": "Moderate",
            "price": 1000,
            "description": "Historically significant as the first fort captured by Shivaji Maharaj, Torna Fort offers a moderate trek with stunning views and rich Maratha history.",
            "highlights": [
                "First fort of Shivaji Maharaj",
                "Ancient Menghai Devi temple",
                "Panoramic valley views",
                "Historic bastions and ruins",
                "Rich Maratha history"
            ],
            "included": [
                "Experienced guide",
                "Breakfast and lunch",
                "Entry fees",
                "First aid kit",
                "Historical tour of the fort"
            ],
            "excluded": [
                "Transportation to/from Pune",
                "Personal expenses",
                "Any beverages",
                "Tips"
            ],
            "images": [
                "https://images.unsplash.com/photo-1693725045204-83223dcd6865?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHx0cmVra2luZyUyMG1vdW50YWluc3xlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85",
                "https://images.pexels.com/photos/19716647/pexels-photo-19716647.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "https://images.unsplash.com/photo-1643559310339-eebc1a58a241?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMHN1bnNldHxlbnwwfHx8fDE3NzYyNzI4NzF8MA&ixlib=rb-4.1.0&q=85"
            ],
            "max_group_size": 20,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result = await db.treks.insert_many(treks)
    print(f"✓ Successfully seeded {len(result.inserted_ids)} treks")
    
    # Seed some sample reviews
    reviews = [
        {
            "id": str(uuid.uuid4()),
            "trek_id": treks[0]["id"],
            "customer_name": "Priya Sharma",
            "rating": 5,
            "comment": "Amazing experience! The trek to Kalsubai was challenging but absolutely worth it. Our guide was knowledgeable and the views from the top were breathtaking.",
            "approved": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "trek_id": treks[1]["id"],
            "customer_name": "Raj Patel",
            "rating": 5,
            "comment": "Harishchandragad is a must-do trek! The overnight camping experience was incredible. The Konkankada cliff views at sunset were magical.",
            "approved": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "trek_id": treks[2]["id"],
            "customer_name": "Anita Desai",
            "rating": 4,
            "comment": "Perfect trek for beginners like me. The team was very supportive and patient. Rajmachi fort has beautiful views and interesting history.",
            "approved": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "trek_id": treks[0]["id"],
            "customer_name": "Vikram Singh",
            "rating": 5,
            "comment": "Best trekking company in Maharashtra! Professional guides, well-organized, and safety is their priority. Highly recommended!",
            "approved": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "trek_id": treks[3]["id"],
            "customer_name": "Sneha Kulkarni",
            "rating": 5,
            "comment": "Night trek to Ratangad was an unforgettable experience! Watching the sunrise from the summit was worth every step. Great team!",
            "approved": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "trek_id": treks[4]["id"],
            "customer_name": "Amit Mehta",
            "rating": 4,
            "comment": "Sandhan Valley is thrilling! The rappelling and rock climbing sections were exciting. Good equipment and experienced instructors.",
            "approved": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result = await db.reviews.insert_many(reviews)
    print(f"✓ Successfully seeded {len(result.inserted_ids)} reviews")

async def main():
    print("Starting database seed...")
    await seed_treks()
    print("✓ Database seeding completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
