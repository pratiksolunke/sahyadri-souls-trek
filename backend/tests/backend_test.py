"""Backend API tests for Sahyadri Souls Trek"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sahyadri-trek.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Trek tests
class TestTreks:
    def test_get_treks(self, session):
        r = session.get(f"{API}/treks", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6, f"Expected at least 6 seeded treks, got {len(data)}"
        trek = data[0]
        for k in ["id", "name", "location", "duration", "difficulty", "price", "description", "highlights", "images"]:
            assert k in trek, f"Missing key {k}"

    def test_get_trek_by_id(self, session):
        r = session.get(f"{API}/treks", timeout=15)
        trek_id = r.json()[0]["id"]
        r2 = session.get(f"{API}/treks/{trek_id}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["id"] == trek_id

    def test_get_trek_404(self, session):
        r = session.get(f"{API}/treks/nonexistent-id", timeout=15)
        assert r.status_code == 404

    def test_filter_difficulty(self, session):
        r = session.get(f"{API}/treks?difficulty=Moderate", timeout=15)
        assert r.status_code == 200
        for t in r.json():
            assert t["difficulty"] == "Moderate"


# Reviews tests
class TestReviews:
    def test_get_approved_reviews(self, session):
        r = session.get(f"{API}/reviews?approved_only=true", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6, f"Expected at least 6 approved reviews, got {len(data)}"
        for rev in data:
            assert rev["approved"] is True

    def test_get_all_reviews(self, session):
        r = session.get(f"{API}/reviews", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# Admin tests
class TestAdmin:
    def test_admin_login_success(self, session):
        r = session.post(f"{API}/admin/login", json={"username": "admin", "password": "admin123"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["token"].startswith("admin_token_")

    def test_admin_login_invalid(self, session):
        r = session.post(f"{API}/admin/login", json={"username": "admin", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_admin_stats(self, session):
        r = session.get(f"{API}/admin/stats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ["total_treks", "total_bookings", "completed_bookings", "pending_reviews", "total_revenue"]:
            assert k in data
        assert data["total_treks"] >= 6


# Booking tests
class TestBooking:
    def test_create_order_and_persist(self, session):
        treks = session.get(f"{API}/treks", timeout=15).json()
        trek = treks[0]
        payload = {
            "trek_id": trek["id"],
            "trek_name": trek["name"],
            "customer_name": "TEST_Customer",
            "customer_email": "test_pytest@example.com",
            "customer_phone": "+919876543210",
            "age": 25,
            "num_members": 2,
            "total_amount": trek["price"] * 2
        }
        r = session.post(f"{API}/bookings/create-order", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ["booking_id", "order_id", "amount", "key_id"]:
            assert k in data
        assert data["amount"] == trek["price"] * 2
        # Verify persisted
        r2 = session.get(f"{API}/bookings/{data['booking_id']}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["customer_name"] == "TEST_Customer"
        assert r2.json()["payment_status"] == "pending"

    def test_create_order_invalid_email(self, session):
        payload = {
            "trek_id": "x", "trek_name": "x",
            "customer_name": "TEST_X", "customer_email": "not-an-email",
            "customer_phone": "+91", "age": 25, "num_members": 1, "total_amount": 100
        }
        r = session.post(f"{API}/bookings/create-order", json=payload, timeout=15)
        assert r.status_code == 422

    def test_get_bookings_list(self, session):
        r = session.get(f"{API}/bookings", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# Trek CRUD test
class TestTrekCRUD:
    created_id = None

    def test_create_update_delete_trek(self, session):
        payload = {
            "name": "TEST_Trek_Pytest",
            "location": "TEST Location",
            "duration": "1 Day",
            "difficulty": "Easy",
            "price": 999,
            "description": "test",
            "highlights": ["a"],
            "included": ["b"],
            "excluded": ["c"],
            "images": ["http://example.com/x.jpg"],
            "max_group_size": 10
        }
        r = session.post(f"{API}/treks", json=payload, timeout=15)
        assert r.status_code == 200
        trek_id = r.json()["id"]

        # Update
        payload["price"] = 1500
        r2 = session.put(f"{API}/treks/{trek_id}", json=payload, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["price"] == 1500

        # Delete
        r3 = session.delete(f"{API}/treks/{trek_id}", timeout=15)
        assert r3.status_code == 200

        # Verify deleted
        r4 = session.get(f"{API}/treks/{trek_id}", timeout=15)
        assert r4.status_code == 404
