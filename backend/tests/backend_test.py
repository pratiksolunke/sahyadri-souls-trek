"""Backend API tests for Sahyadri Souls Trek - Iteration 2
Covers: admin auth middleware, image upload, departure_dates, email sending
"""
import io
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


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/admin/login", json={"username": "admin", "password": "admin123"}, timeout=15)
    assert r.status_code == 200
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# Trek read tests (public)
class TestTreks:
    def test_get_treks_with_departure_dates(self, session):
        r = session.get(f"{API}/treks", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6, f"Expected at least 6 seeded treks, got {len(data)}"
        trek = data[0]
        required = ["id", "name", "location", "duration", "difficulty", "price", "departure_dates"]
        for k in required:
            assert k in trek, f"Missing key {k}"
        assert isinstance(trek["departure_dates"], list)

    def test_seeded_treks_have_departure_dates(self, session):
        r = session.get(f"{API}/treks", timeout=15)
        data = r.json()
        treks_with_dates = [t for t in data if t.get("departure_dates")]
        assert len(treks_with_dates) >= 1, "Expected at least 1 trek with seeded departure_dates"

    def test_get_trek_by_id_has_departure_dates(self, session):
        r = session.get(f"{API}/treks", timeout=15)
        trek_id = r.json()[0]["id"]
        r2 = session.get(f"{API}/treks/{trek_id}", timeout=15)
        assert r2.status_code == 200
        body = r2.json()
        assert body["id"] == trek_id
        assert "departure_dates" in body
        assert isinstance(body["departure_dates"], list)

    def test_get_trek_404(self, session):
        r = session.get(f"{API}/treks/nonexistent-id", timeout=15)
        assert r.status_code == 404


# Reviews public read
class TestReviews:
    def test_get_approved_reviews(self, session):
        r = session.get(f"{API}/reviews?approved_only=true", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6

    def test_create_review_public(self, session):
        # Need a valid trek id
        treks = session.get(f"{API}/treks", timeout=15).json()
        payload = {
            "trek_id": treks[0]["id"],
            "customer_name": "TEST_Reviewer",
            "rating": 5,
            "comment": "TEST iteration2 review"
        }
        r = session.post(f"{API}/reviews", json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["approved"] is False


# Admin auth tests
class TestAdminAuth:
    def test_admin_login_success(self, session):
        r = session.post(f"{API}/admin/login", json={"username": "admin", "password": "admin123"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["token"].startswith("admin_token_")

    def test_admin_login_invalid(self, session):
        r = session.post(f"{API}/admin/login", json={"username": "admin", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_admin_stats_without_auth_rejected(self, session):
        r = requests.get(f"{API}/admin/stats", timeout=15)
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"

    def test_admin_stats_with_bad_token(self, session):
        r = requests.get(f"{API}/admin/stats", headers={"Authorization": "Bearer bogus"}, timeout=15)
        assert r.status_code == 401

    def test_admin_stats_with_auth(self, auth_headers):
        r = requests.get(f"{API}/admin/stats", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ["total_treks", "total_bookings", "completed_bookings", "pending_reviews", "total_revenue"]:
            assert k in data

    def test_bookings_list_requires_auth(self):
        r = requests.get(f"{API}/bookings", timeout=15)
        assert r.status_code == 401

    def test_bookings_list_with_auth(self, auth_headers):
        r = requests.get(f"{API}/bookings", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_trek_without_auth_rejected(self):
        r = requests.post(f"{API}/treks", json={}, timeout=15)
        assert r.status_code == 401

    def test_delete_trek_without_auth_rejected(self):
        r = requests.delete(f"{API}/treks/some-id", timeout=15)
        assert r.status_code == 401


# Trek CRUD (admin protected)
class TestTrekCRUD:
    def test_create_update_delete_trek(self, auth_headers):
        payload = {
            "name": "TEST_Trek_Iter2",
            "location": "TEST Location",
            "duration": "1 Day",
            "difficulty": "Easy",
            "price": 999,
            "description": "test",
            "highlights": ["a"],
            "included": ["b"],
            "excluded": ["c"],
            "images": ["http://example.com/x.jpg"],
            "max_group_size": 10,
            "departure_dates": ["2026-02-15", "2026-03-01"]
        }
        r = requests.post(f"{API}/treks", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        trek = r.json()
        trek_id = trek["id"]
        assert trek["departure_dates"] == ["2026-02-15", "2026-03-01"]

        # GET to verify persistence of departure_dates
        rg = requests.get(f"{API}/treks/{trek_id}", timeout=15)
        assert rg.status_code == 200
        assert rg.json()["departure_dates"] == ["2026-02-15", "2026-03-01"]

        # Update
        payload["price"] = 1500
        payload["departure_dates"] = ["2026-04-01"]
        r2 = requests.put(f"{API}/treks/{trek_id}", json=payload, headers=auth_headers, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["price"] == 1500
        assert r2.json()["departure_dates"] == ["2026-04-01"]

        # Delete
        r3 = requests.delete(f"{API}/treks/{trek_id}", headers=auth_headers, timeout=15)
        assert r3.status_code == 200

        # Verify deleted
        r4 = requests.get(f"{API}/treks/{trek_id}", timeout=15)
        assert r4.status_code == 404


# Booking tests with departure_date
class TestBooking:
    def test_create_order_with_departure_date(self, session):
        treks = session.get(f"{API}/treks", timeout=15).json()
        trek = treks[0]
        dep_date = (trek["departure_dates"] or ["2026-02-15"])[0]
        payload = {
            "trek_id": trek["id"],
            "trek_name": trek["name"],
            "customer_name": "TEST_Iter2_Customer",
            "customer_email": "test_iter2@example.com",
            "customer_phone": "+919876543210",
            "age": 25,
            "num_members": 2,
            "total_amount": trek["price"] * 2,
            "departure_date": dep_date
        }
        r = session.post(f"{API}/bookings/create-order", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ["booking_id", "order_id", "amount", "key_id"]:
            assert k in data
        # Verify persisted with departure_date
        r2 = session.get(f"{API}/bookings/{data['booking_id']}", timeout=15)
        assert r2.status_code == 200
        body = r2.json()
        assert body["customer_name"] == "TEST_Iter2_Customer"
        assert body["departure_date"] == dep_date
        assert body["payment_status"] == "pending"

    def test_create_order_without_departure_date(self, session):
        treks = session.get(f"{API}/treks", timeout=15).json()
        trek = treks[0]
        payload = {
            "trek_id": trek["id"],
            "trek_name": trek["name"],
            "customer_name": "TEST_Iter2_NoDate",
            "customer_email": "test_nodate@example.com",
            "customer_phone": "+919876543210",
            "age": 30,
            "num_members": 1,
            "total_amount": trek["price"]
        }
        r = session.post(f"{API}/bookings/create-order", json=payload, timeout=20)
        assert r.status_code == 200


# Image upload & file retrieval tests
class TestImageUpload:
    # 1x1 PNG
    PNG_BYTES = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
        b"\x00\x00\x00\x03\x00\x01\xe2!\xbc3\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    def test_upload_without_auth(self):
        files = {"file": ("t.png", io.BytesIO(self.PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/upload", files=files, timeout=30)
        assert r.status_code == 401

    def test_upload_invalid_content_type(self, auth_headers):
        files = {"file": ("t.txt", io.BytesIO(b"hello"), "text/plain")}
        r = requests.post(f"{API}/upload", files=files, headers=auth_headers, timeout=30)
        assert r.status_code == 400

    def test_upload_and_fetch(self, auth_headers):
        files = {"file": ("test.png", io.BytesIO(self.PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/upload", files=files, headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "file_id" in data
        assert "url" in data
        assert data["url"].startswith("/api/files/")
        file_id = data["file_id"]

        # GET the file
        rg = requests.get(f"{API}/files/{file_id}", timeout=30)
        assert rg.status_code == 200
        assert rg.headers.get("content-type", "").startswith("image/")
        assert len(rg.content) > 0

    def test_get_file_not_found(self):
        r = requests.get(f"{API}/files/nonexistent-file-id", timeout=15)
        assert r.status_code == 404
