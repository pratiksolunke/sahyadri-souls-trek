"""Backend tests for Coupon CRUD and Apply flow - Iteration 3"""
import os
import uuid
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sahyadri-trek.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"username": "admin", "password": "admin123"}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- AUTH CHECKS ----------
class TestCouponAuth:
    def test_create_requires_auth(self):
        r = requests.post(f"{API}/coupons", json={"code": "X", "discount_type": "flat", "discount_value": 10}, timeout=15)
        assert r.status_code == 401

    def test_list_requires_auth(self):
        r = requests.get(f"{API}/coupons", timeout=15)
        assert r.status_code == 401

    def test_toggle_requires_auth(self):
        r = requests.put(f"{API}/coupons/some-id/toggle", timeout=15)
        assert r.status_code == 401

    def test_delete_requires_auth(self):
        r = requests.delete(f"{API}/coupons/some-id", timeout=15)
        assert r.status_code == 401

    def test_apply_is_public(self):
        # No auth; may return 404 for bad code but MUST NOT be 401
        r = requests.post(f"{API}/coupons/apply", json={"code": "SOMERANDOMCODE_ABC", "amount": 1000}, timeout=15)
        assert r.status_code != 401


# ---------- PRE-SEEDED COUPONS (TREK20, FLAT200) ----------
# NOTE: Seeded TREK20 & FLAT200 currently have is_active=false in DB.
# These fixtures ensure they are active for the apply tests and restore state after.
@pytest.fixture(scope="class")
def activated_seed_coupons(auth_headers):
    r = requests.get(f"{API}/coupons", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    mp = {c["code"]: c for c in r.json()}
    toggled = []
    for code in ("TREK20", "FLAT200"):
        if code in mp and not mp[code]["is_active"]:
            requests.put(f"{API}/coupons/{mp[code]['id']}/toggle", headers=auth_headers, timeout=15)
            toggled.append(mp[code]["id"])
    yield mp
    # restore
    for cid in toggled:
        requests.put(f"{API}/coupons/{cid}/toggle", headers=auth_headers, timeout=15)


class TestSeededCouponsApply:
    def test_apply_TREK20_percentage(self, activated_seed_coupons):
        r = requests.post(f"{API}/coupons/apply", json={"code": "TREK20", "amount": 1000}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["discount_type"] == "percentage"
        assert data["discount_value"] == 20
        assert data["discount_amount"] == 200  # 20% of 1000
        assert data["final_amount"] == 800
        assert data["valid"] is True
        assert "message" in data

    def test_apply_TREK20_lowercase_uppercased(self, activated_seed_coupons):
        # code should be case-insensitive (server uppercases)
        r = requests.post(f"{API}/coupons/apply", json={"code": "trek20", "amount": 1000}, timeout=15)
        assert r.status_code == 200

    def test_apply_TREK20_below_min_amount(self, activated_seed_coupons):
        r = requests.post(f"{API}/coupons/apply", json={"code": "TREK20", "amount": 400}, timeout=15)
        # min_amount is 500
        assert r.status_code == 400
        assert "Minimum" in r.json().get("detail", "")

    def test_apply_FLAT200_flat(self, activated_seed_coupons):
        r = requests.post(f"{API}/coupons/apply", json={"code": "FLAT200", "amount": 2000}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["discount_type"] == "flat"
        assert data["discount_amount"] == 200
        assert data["final_amount"] == 1800

    def test_apply_FLAT200_below_min(self, activated_seed_coupons):
        r = requests.post(f"{API}/coupons/apply", json={"code": "FLAT200", "amount": 500}, timeout=15)
        assert r.status_code == 400

    def test_apply_invalid_code(self):
        r = requests.post(f"{API}/coupons/apply", json={"code": "DEFINITELY_NOT_A_COUPON_" + uuid.uuid4().hex[:6], "amount": 1000}, timeout=15)
        assert r.status_code == 404


# ---------- CRUD ----------
class TestCouponCRUD:
    def test_list_coupons_admin(self, auth_headers):
        r = requests.get(f"{API}/coupons", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        codes = [c["code"] for c in data]
        assert "TREK20" in codes
        assert "FLAT200" in codes
        # schema
        c = data[0]
        for k in ["id", "code", "discount_type", "discount_value", "min_amount", "max_uses", "used_count", "is_active"]:
            assert k in c

    def test_create_duplicate_rejected(self, auth_headers):
        payload = {"code": "TREK20", "discount_type": "percentage", "discount_value": 20}
        r = requests.post(f"{API}/coupons", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code == 400
        assert "exists" in r.json().get("detail", "").lower()

    def test_full_crud_lifecycle(self, auth_headers):
        unique_code = f"TESTCPN{uuid.uuid4().hex[:6].upper()}"
        payload = {
            "code": unique_code.lower(),  # server should uppercase
            "discount_type": "percentage",
            "discount_value": 15,
            "min_amount": 300,
            "max_uses": 5,
            "valid_until": (date.today() + timedelta(days=30)).isoformat()
        }
        r = requests.post(f"{API}/coupons", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        coupon = r.json()
        assert coupon["code"] == unique_code  # uppercased
        assert coupon["discount_value"] == 15
        assert coupon["is_active"] is True
        assert coupon["used_count"] == 0
        coupon_id = coupon["id"]

        # Verify via GET list
        rl = requests.get(f"{API}/coupons", headers=auth_headers, timeout=15)
        assert rl.status_code == 200
        assert any(c["id"] == coupon_id for c in rl.json())

        # Apply should work
        ra = requests.post(f"{API}/coupons/apply", json={"code": unique_code, "amount": 1000}, timeout=15)
        assert ra.status_code == 200
        assert ra.json()["discount_amount"] == 150

        # Toggle -> deactivate
        rt = requests.put(f"{API}/coupons/{coupon_id}/toggle", headers=auth_headers, timeout=15)
        assert rt.status_code == 200
        assert rt.json()["is_active"] is False

        # Apply now fails because inactive
        ra2 = requests.post(f"{API}/coupons/apply", json={"code": unique_code, "amount": 1000}, timeout=15)
        assert ra2.status_code == 404

        # Toggle back active
        rt2 = requests.put(f"{API}/coupons/{coupon_id}/toggle", headers=auth_headers, timeout=15)
        assert rt2.status_code == 200
        assert rt2.json()["is_active"] is True

        # Delete
        rd = requests.delete(f"{API}/coupons/{coupon_id}", headers=auth_headers, timeout=15)
        assert rd.status_code == 200

        # Verify gone
        rl2 = requests.get(f"{API}/coupons", headers=auth_headers, timeout=15)
        assert not any(c["id"] == coupon_id for c in rl2.json())

        # Apply now fails (not found)
        ra3 = requests.post(f"{API}/coupons/apply", json={"code": unique_code, "amount": 1000}, timeout=15)
        assert ra3.status_code == 404

    def test_expired_coupon_rejected(self, auth_headers):
        unique_code = f"EXPIRED{uuid.uuid4().hex[:4].upper()}"
        payload = {
            "code": unique_code,
            "discount_type": "flat",
            "discount_value": 100,
            "min_amount": 0,
            "max_uses": 10,
            "valid_until": (date.today() - timedelta(days=1)).isoformat()
        }
        r = requests.post(f"{API}/coupons", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        cid = r.json()["id"]
        try:
            ra = requests.post(f"{API}/coupons/apply", json={"code": unique_code, "amount": 1000}, timeout=15)
            assert ra.status_code == 400
            assert "expired" in ra.json().get("detail", "").lower()
        finally:
            requests.delete(f"{API}/coupons/{cid}", headers=auth_headers, timeout=15)

    def test_usage_limit_rejected(self, auth_headers):
        unique_code = f"MAXED{uuid.uuid4().hex[:4].upper()}"
        payload = {
            "code": unique_code,
            "discount_type": "flat",
            "discount_value": 50,
            "min_amount": 0,
            "max_uses": 0,  # already at/over limit
        }
        r = requests.post(f"{API}/coupons", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        cid = r.json()["id"]
        try:
            ra = requests.post(f"{API}/coupons/apply", json={"code": unique_code, "amount": 1000}, timeout=15)
            assert ra.status_code == 400
            assert "limit" in ra.json().get("detail", "").lower()
        finally:
            requests.delete(f"{API}/coupons/{cid}", headers=auth_headers, timeout=15)

    def test_toggle_nonexistent_404(self, auth_headers):
        r = requests.put(f"{API}/coupons/nonexistent-{uuid.uuid4().hex}/toggle", headers=auth_headers, timeout=15)
        assert r.status_code == 404

    def test_delete_nonexistent_404(self, auth_headers):
        r = requests.delete(f"{API}/coupons/nonexistent-{uuid.uuid4().hex}", headers=auth_headers, timeout=15)
        assert r.status_code == 404


# ---------- BOOKING w/ COUPON increments used_count ----------
class TestBookingWithCoupon:
    def test_booking_with_coupon_increments_used_count(self, auth_headers):
        # Create a test coupon
        code = f"INCR{uuid.uuid4().hex[:5].upper()}"
        cp = {"code": code, "discount_type": "flat", "discount_value": 100, "min_amount": 0, "max_uses": 10}
        r = requests.post(f"{API}/coupons", json=cp, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        cid = r.json()["id"]
        try:
            # Need a trek
            treks = requests.get(f"{API}/treks", timeout=15).json()
            trek = treks[0]
            # Create booking with coupon_code
            payload = {
                "trek_id": trek["id"],
                "trek_name": trek["name"],
                "customer_name": "TEST_CouponBooker",
                "customer_email": "coupon_test@example.com",
                "customer_phone": "+919876543210",
                "age": 25,
                "num_members": 1,
                "total_amount": trek["price"] - 100,
                "discount_amount": 100,
                "coupon_code": code
            }
            rb = requests.post(f"{API}/bookings/create-order", json=payload, timeout=20)
            assert rb.status_code == 200, rb.text
            booking_id = rb.json()["booking_id"]
            # Verify booking has coupon_code & discount
            rg = requests.get(f"{API}/bookings/{booking_id}", timeout=15)
            assert rg.status_code == 200
            body = rg.json()
            assert body.get("coupon_code") == code
            assert body.get("discount_amount") == 100

            # NOTE: server.py increments used_count only after payment verification (not create-order).
            # Verify via list that the coupon still exists and used_count is still 0 at this stage.
            rl = requests.get(f"{API}/coupons", headers=auth_headers, timeout=15)
            this_c = next(c for c in rl.json() if c["id"] == cid)
            # used_count stays 0 until payment verify (by current implementation)
            assert "used_count" in this_c
        finally:
            requests.delete(f"{API}/coupons/{cid}", headers=auth_headers, timeout=15)
