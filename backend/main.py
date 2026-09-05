from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, Body, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, text
from datetime import datetime
import os
import shutil
import uuid
import re
import base64
import hmac
import hashlib
import json
import logging
import database, models

# Setup structured logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("agriconnect")

app = FastAPI(title="AgriConnect API", version="3.0")

# --- EXPLICIT CORS FIX ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Auto-create tables
models.Base.metadata.create_all(bind=database.engine)

# --- BULLETPROOF DATABASE MIGRATION SCRIPT ---
# This automatically adds missing columns to old databases to prevent 500 CORS crashes
def ensure_columns():
    db = database.SessionLocal()
    try:
        cursor = database.engine.connect()
        
        # 1. Check users table
        user_cols = [row[1] for row in cursor.execute(text("PRAGMA table_info(users)")).fetchall()]
        needed_user_cols = {
            "sub_role": "TEXT DEFAULT 'individual'", "email": "TEXT", "password": "TEXT", "status": "TEXT DEFAULT 'active'",
            "fpo_name": "TEXT", "fpo_reg_id": "TEXT", "village_district": "TEXT", "state": "TEXT", "id_type": "TEXT", "id_number": "TEXT",
            "id_doc_url": "TEXT", "primary_crops": "TEXT", "upi_id": "TEXT", "bank_account": "TEXT", "bank_ifsc": "TEXT",
            "account_holder_name": "TEXT", "account_number": "TEXT", "ifsc_code": "TEXT", "bank_name": "TEXT", "branch_name": "TEXT",
            "account_type": "TEXT", "gstin": "TEXT", "contact_person": "TEXT", "business_type": "TEXT", "business_address": "TEXT",
            "delivery_address": "TEXT", "monthly_volume": "TEXT", "preferred_crops": "TEXT", "business_doc_url": "TEXT",
            "created_at": "DATETIME", "last_active_at": "DATETIME"
        }
        for col_name, col_type in needed_user_cols.items():
            if col_name not in user_cols:
                try: cursor.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                except Exception as e: print(f"User migration: {e}")

        # 2. Check products table
        prod_cols = [row[1] for row in cursor.execute(text("PRAGMA table_info(products)")).fetchall()]
        needed_prod_cols = {
            "farmer_id": "INTEGER", "status": "TEXT DEFAULT 'active'", "cancellation_window_hours": "INTEGER DEFAULT 24",
            "created_at": "DATETIME", "reserved_quantity_kg": "FLOAT DEFAULT 0.0"
        }
        for col_name, col_type in needed_prod_cols.items():
            if col_name not in prod_cols:
                try: cursor.execute(text(f"ALTER TABLE products ADD COLUMN {col_name} {col_type}"))
                except Exception as e: print(f"Product migration: {e}")

        # 3. Check orders table
        order_cols = [row[1] for row in cursor.execute(text("PRAGMA table_info(orders)")).fetchall()]
        needed_order_cols = {
            "order_group_id": "VARCHAR", "farmer_id": "INTEGER", "rejection_reason": "VARCHAR",
            "cancellation_window_hours": "INTEGER DEFAULT 24", "product_id": "INTEGER",
            "payment_method": "VARCHAR", "delivery_address": "VARCHAR", "order_note": "VARCHAR"
        }
        for col_name, col_type in needed_order_cols.items():
            if col_name not in order_cols:
                try: cursor.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}"))
                except Exception as e: print(f"Order migration: {e}")

        cursor.commit()
        cursor.close()
        logger.info("Database schema validated and migrations applied successfully.")
    except Exception as err:
        print("Migration error:", err)
    finally:
        db.close()

ensure_columns()

def get_db():
    db = database.SessionLocal()
    try: yield db
    finally: db.close()

# --- TOKEN AUTHENTICATION HELPERS ---
SECRET_KEY = "agriconnect-sih-secure-secret-key-2026"

def create_access_token(user_id: int, role: str, name: str) -> str:
    payload = {"user_id": user_id, "role": role, "name": name, "ts": int(datetime.utcnow().timestamp())}
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    b64_payload = base64.urlsafe_b64encode(payload_bytes).decode('utf-8').rstrip('=')
    sig = hmac.new(SECRET_KEY.encode('utf-8'), b64_payload.encode('utf-8'), hashlib.sha256).hexdigest()[:16]
    return f"{b64_payload}.{sig}"

def verify_access_token(token: Optional[str]) -> Optional[dict]:
    if not token: return None
    try:
        clean_token = token.replace("Bearer ", "").strip()
        parts = clean_token.split(".")
        if len(parts) != 2: return None
        b64_payload, sig = parts
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), b64_payload.encode('utf-8'), hashlib.sha256).hexdigest()[:16]
        if not hmac.compare_digest(sig, expected_sig): return None
        padding = 4 - (len(b64_payload) % 4)
        if padding != 4: b64_payload += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(b64_payload)
        return json.loads(payload_bytes.decode('utf-8'))
    except Exception as e:
        logger.warning(f"Failed to verify access token: {e}")
        return None

def parse_numeric_moq(moq_str: Optional[str]) -> float:
    if not moq_str: return 1.0
    match = re.search(r"(\d+(?:\.\d+)?)", str(moq_str))
    if match:
        try: return float(match.group(1))
        except ValueError: return 1.0
    return 1.0

# --- PYDANTIC MODELS ---
class UserCheckRequest(BaseModel): identifier: str; role: str
class SendOtpRequest(BaseModel): mobile: str; role: Optional[str] = "farmer"
class VerifyOtpRequest(BaseModel): mobile: str; otp: str
class FarmerRegisterRequest(BaseModel):
    name: str; mobile: str; password: str; language: Optional[str] = "English"; account_type: str = "individual"
    fpo_name: Optional[str] = None; fpo_reg_id: Optional[str] = None; village_district: str; state: str
    id_type: str = "Aadhaar"; id_number: str; primary_crops: List[str] = []; upi_id: Optional[str] = None
    account_holder_name: Optional[str] = None; account_number: Optional[str] = None; ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None; branch_name: Optional[str] = None; account_type_bank: Optional[str] = "Savings"
    bank_account: Optional[str] = None; bank_ifsc: Optional[str] = None
class BuyerRegisterRequest(BaseModel):
    buyer_type: str = "bulk"; name: str; mobile: str; email: Optional[str] = None; password: str
    delivery_address: Optional[str] = None; preferred_crops: Optional[str] = None; gstin: Optional[str] = None
    contact_person: Optional[str] = None; business_type: Optional[str] = "Retailer"; business_address: Optional[str] = None
    monthly_volume: Optional[str] = None; upi_id: Optional[str] = None; account_holder_name: Optional[str] = None
    account_number: Optional[str] = None; ifsc_code: Optional[str] = None; bank_name: Optional[str] = None
    branch_name: Optional[str] = None; account_type_bank: Optional[str] = "Current"
class UniversalLoginRequest(BaseModel): identifier: str; role: str; password: Optional[str] = None; auth_type: Optional[str] = "password"; otp: Optional[str] = None
class WithdrawalRequest(BaseModel): user_name: str; amount: float
class CartAddRequest(BaseModel): buyer_name: str; product_id: int; quantity_kg: float; cancellation_window_hours: Optional[int] = 24
class CartUpdateRequest(BaseModel): buyer_name: str; cart_item_id: int; quantity_kg: float
class CartRemoveRequest(BaseModel): buyer_name: str; cart_item_id: int
class CartClearRequest(BaseModel): buyer_name: str
class CheckoutItem(BaseModel): product_id: int; farmer_name: str; crop_name: str; quantity_kg: float; price_per_kg: float; cancellation_window_hours: Optional[int] = 24
class CheckoutRequest(BaseModel): buyer_name: str; items: List[CheckoutItem]; delivery_address: Optional[str] = None; order_note: Optional[str] = None; payment_method: Optional[str] = "Bank Transfer (NEFT/RTGS)"
class OrderStatusUpdate(BaseModel): order_id: int; status: str; rejection_reason: Optional[str] = None
class CancelOrderRequest(BaseModel): order_id: int
class ProductUpdateRequest(BaseModel): crop_name: Optional[str] = None; price_per_kg: Optional[float] = None; add_quantity: Optional[float] = None; quality_grade: Optional[str] = None; harvest_date: Optional[str] = None; negotiable: Optional[str] = None; status: Optional[str] = None

# --- AUTH & USER ENDPOINTS ---
@app.post("/api/admin/clear-all-data")
def clear_all_data(db: Session = Depends(get_db)):
    db.query(models.User).delete(); db.query(models.Product).delete(); db.query(models.Order).delete(); db.query(models.Transaction).delete(); db.query(models.CartItem).delete(); db.commit()
    return {"message": "All records cleared."}

@app.post("/api/check-user")
def check_user(req: UserCheckRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip(); target_role = req.role.strip().lower()
    user = db.query(models.User).filter(or_(models.User.mobile == ident, models.User.email == ident, models.User.name.ilike(ident))).first()
    if not user: return {"exists": False, "registered_role": None, "message": f"No registered {target_role.title()} account found."}
    if user.role != target_role: return {"exists": True, "matches_role": False, "registered_role": user.role, "name": user.name, "message": f"This account is registered as a {user.role.upper()}. Please switch portals."}
    return {"exists": True, "matches_role": True, "registered_role": user.role, "name": user.name, "message": f"Account verified for {user.name}."}

@app.post("/api/send-otp")
def send_otp(req: SendOtpRequest):
    clean_mobile = req.mobile.strip()
    if len(clean_mobile) != 10 or not clean_mobile.isdigit(): raise HTTPException(status_code=400, detail="Mobile number must be exactly 10 digits.")
    return {"message": f"OTP sent to +91 {clean_mobile}", "otp": "4920", "cooldown_seconds": 30}

@app.post("/api/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    clean_otp = req.otp.strip()
    if not clean_otp or len(clean_otp) < 4: raise HTTPException(status_code=400, detail="Please enter a valid 4-digit OTP.")
    if clean_otp in ["4920", "1234", "0000"] or len(clean_otp) == 4: return {"verified": True, "message": "OTP verified successfully!"}
    raise HTTPException(status_code=400, detail="Invalid OTP.")

@app.post("/api/register/farmer")
def register_farmer(data: FarmerRegisterRequest, db: Session = Depends(get_db)):
    clean_mobile = data.mobile.strip(); clean_name = data.name.strip()
    if len(clean_mobile) != 10 or not clean_mobile.isdigit(): raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")
    if not data.password or len(data.password) < 4: raise HTTPException(status_code=400, detail="Password must be at least 4 characters.")
    existing = db.query(models.User).filter(or_(models.User.mobile == clean_mobile, models.User.name.ilike(clean_name))).first()
    if existing: raise HTTPException(status_code=400, detail="Account already exists.")
    crops_str = ", ".join(data.primary_crops) if data.primary_crops else "Vegetables, Fruits"
    acct_num = data.account_number or data.bank_account; ifsc = data.ifsc_code or data.bank_ifsc
    new_user = models.User(
        role="farmer", sub_role=data.account_type, name=clean_name, mobile=clean_mobile, password=data.password, language=data.language or "English",
        fpo_name=data.fpo_name, fpo_reg_id=data.fpo_reg_id, village_district=data.village_district, state=data.state, id_type=data.id_type, id_number=data.id_number,
        primary_crops=crops_str, upi_id=data.upi_id or f"{clean_name.lower().replace(' ', '')}@upi", bank_account=acct_num, bank_ifsc=ifsc,
        account_holder_name=data.account_holder_name or clean_name, account_number=acct_num, ifsc_code=ifsc, bank_name=data.bank_name, branch_name=data.branch_name,
        account_type=data.account_type_bank or "Savings", status="active"
    )
    db.add(new_user); db.commit(); db.refresh(new_user)
    token = create_access_token(new_user.id, new_user.role, new_user.name)
    return {"message": "Registered successfully!", "token": token, "user_id": new_user.id, "name": new_user.name, "role": new_user.role, "profile": {"id": new_user.id, "name": new_user.name, "mobile": new_user.mobile, "role": new_user.role, "sub_role": new_user.sub_role, "village_district": new_user.village_district, "state": new_user.state, "primary_crops": new_user.primary_crops, "upi_id": new_user.upi_id, "account_holder_name": new_user.account_holder_name, "account_number": new_user.account_number, "ifsc_code": new_user.ifsc_code, "bank_name": new_user.bank_name, "branch_name": new_user.branch_name, "account_type": new_user.account_type}}

@app.post("/api/register/buyer")
def register_buyer(data: BuyerRegisterRequest, db: Session = Depends(get_db)):
    clean_mobile = data.mobile.strip(); clean_name = data.name.strip()
    if len(clean_mobile) != 10 or not clean_mobile.isdigit(): raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits.")
    if not data.password or len(data.password) < 4: raise HTTPException(status_code=400, detail="Password must be at least 4 characters.")
    existing = db.query(models.User).filter(or_(models.User.mobile == clean_mobile, models.User.name.ilike(clean_name), and_(models.User.email == data.email, data.email != None))).first()
    if existing: raise HTTPException(status_code=400, detail="Account already exists.")
    new_user = models.User(
        role="buyer", sub_role=data.buyer_type, name=clean_name, mobile=clean_mobile, email=data.email, password=data.password, gstin=data.gstin,
        contact_person=data.contact_person, business_type=data.business_type or "Retailer", business_address=data.business_address, delivery_address=data.delivery_address,
        monthly_volume=data.monthly_volume or "10-20 Tonnes", preferred_crops=data.preferred_crops, upi_id=data.upi_id, account_holder_name=data.account_holder_name or clean_name,
        account_number=data.account_number, ifsc_code=data.ifsc_code, bank_name=data.bank_name, branch_name=data.branch_name, account_type=data.account_type_bank or "Current", status="active"
    )
    db.add(new_user); db.commit(); db.refresh(new_user)
    token = create_access_token(new_user.id, new_user.role, new_user.name)
    return {"message": "Registered successfully!", "token": token, "user_id": new_user.id, "name": new_user.name, "role": new_user.role, "profile": {"id": new_user.id, "name": new_user.name, "mobile": new_user.mobile, "email": new_user.email, "role": new_user.role, "sub_role": new_user.sub_role, "gstin": new_user.gstin, "business_type": new_user.business_type, "delivery_address": new_user.delivery_address, "monthly_volume": new_user.monthly_volume, "upi_id": new_user.upi_id, "account_holder_name": new_user.account_holder_name, "account_number": new_user.account_number, "ifsc_code": new_user.ifsc_code, "bank_name": new_user.bank_name, "branch_name": new_user.branch_name, "account_type": new_user.account_type}}

@app.post("/api/login")
def login(req: UniversalLoginRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip(); target_role = req.role.strip().lower()
    db_user = db.query(models.User).filter(or_(models.User.name.ilike(ident), models.User.mobile == ident, models.User.email.ilike(ident))).first()
    if not db_user: raise HTTPException(status_code=404, detail=f"No registered account found with '{ident}'.")
    if db_user.role != target_role: raise HTTPException(status_code=403, detail=f"This account is registered as a {db_user.role.upper()}. Please select the {db_user.role.upper()} portal.")
    if req.auth_type == "otp":
        if not req.otp or (req.otp not in ["4920", "1234", "0000"] and len(req.otp) != 4): raise HTTPException(status_code=401, detail="Invalid OTP code.")
    else:
        if not req.password: raise HTTPException(status_code=400, detail="Password is required.")
        if db_user.password != req.password: raise HTTPException(status_code=401, detail="Incorrect password.")
    db_user.last_active_at = datetime.utcnow(); db.commit()
    token = create_access_token(db_user.id, db_user.role, db_user.name)
    return {"message": "Login successful", "token": token, "role": db_user.role, "sub_role": db_user.sub_role, "name": db_user.name, "user_id": db_user.id, "user": {"id": db_user.id, "name": db_user.name, "mobile": db_user.mobile, "email": db_user.email, "role": db_user.role, "sub_role": db_user.sub_role, "village_district": db_user.village_district, "state": db_user.state, "id_type": db_user.id_type, "id_number": db_user.id_number, "primary_crops": db_user.primary_crops, "upi_id": db_user.upi_id, "account_holder_name": db_user.account_holder_name, "account_number": db_user.account_number, "ifsc_code": db_user.ifsc_code, "bank_name": db_user.bank_name, "branch_name": db_user.branch_name, "account_type": db_user.account_type, "gstin": db_user.gstin, "business_type": db_user.business_type, "delivery_address": db_user.delivery_address, "monthly_volume": db_user.monthly_volume, "preferred_crops": db_user.preferred_crops}}

@app.get("/api/user/profile")
def get_user_profile(identifier: str = Query(...), db: Session = Depends(get_db)):
    ident = identifier.strip()
    user = db.query(models.User).filter(or_(models.User.name.ilike(ident), models.User.mobile == ident, models.User.email.ilike(ident))).first()
    if not user: raise HTTPException(status_code=404, detail="User profile not found")
    return {"id": user.id, "name": user.name, "mobile": user.mobile, "email": user.email, "role": user.role, "sub_role": user.sub_role, "language": user.language, "fpo_name": user.fpo_name, "fpo_reg_id": user.fpo_reg_id, "village_district": user.village_district, "state": user.state, "id_type": user.id_type, "id_number": user.id_number, "primary_crops": user.primary_crops, "upi_id": user.upi_id, "account_holder_name": user.account_holder_name, "account_number": user.account_number, "ifsc_code": user.ifsc_code, "bank_name": user.bank_name, "branch_name": user.branch_name, "account_type": user.account_type, "gstin": user.gstin, "contact_person": user.contact_person, "business_type": user.business_type, "business_address": user.business_address, "delivery_address": user.delivery_address, "monthly_volume": user.monthly_volume, "preferred_crops": user.preferred_crops}

# --- PRODUCT ENDPOINTS ---
@app.post("/api/products/")
async def create_product(
    farmer_name: str = Form(...), farmer_id: Optional[int] = Form(None), crop_name: str = Form(...),
    category: str = Form("Vegetable"), variety: str = Form(""), quantity_kg: float = Form(...),
    unit: str = Form("kg"), moq: str = Form(""), price_per_kg: float = Form(...), negotiable: str = Form("Yes"),
    harvest_date: str = Form(""), available_from: str = Form(""), shelf_life: str = Form(""),
    organic: str = Form("No"), pickup_location: str = Form(""), pickup_window: str = Form("Morning"),
    quality_grade: str = Form("Grade A"), cancellation_window_hours: int = Form(24),
    image: UploadFile = File(None), authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
):
    try:
        image_url = None
        if image and image.filename:
            safe_filename = f"{int(datetime.utcnow().timestamp())}_{image.filename}"
            file_location = f"uploads/{safe_filename}"
            with open(file_location, "wb") as buffer: shutil.copyfileobj(image.file, buffer)
            image_url = f"http://127.0.0.1:8000/uploads/{safe_filename}"

        farmer_user = None
        token_data = verify_access_token(authorization)
        if token_data and token_data.get("user_id"): farmer_user = db.query(models.User).filter(models.User.id == token_data["user_id"]).first()
        if not farmer_user and farmer_id: farmer_user = db.query(models.User).filter(models.User.id == farmer_id).first()
        clean_farmer_name = farmer_name.strip()
        if not farmer_user and clean_farmer_name: farmer_user = db.query(models.User).filter(models.User.name.ilike(clean_farmer_name)).first()
        if not farmer_user:
            clean_mobile = f"999{int(datetime.utcnow().timestamp()) % 10000000:07d}"
            farmer_user = models.User(role="farmer", sub_role="individual", name=clean_farmer_name, mobile=clean_mobile, village_district="Pune", state="Maharashtra", status="active")
            db.add(farmer_user); db.commit(); db.refresh(farmer_user)

        new_prod = models.Product(
            farmer_id=farmer_user.id, farmer_name=farmer_user.name, crop_name=crop_name.strip(), category=category, variety=variety,
            quantity_kg=float(quantity_kg), reserved_quantity_kg=0.0, unit=unit or "kg", moq=moq or "10", price_per_kg=float(price_per_kg),
            negotiable=negotiable, harvest_date=harvest_date, available_from=available_from, shelf_life=shelf_life, organic=organic,
            pickup_location=pickup_location or "Farm Gate", pickup_window=pickup_window, quality_grade=quality_grade, image_url=image_url,
            status="active", cancellation_window_hours=cancellation_window_hours
        )
        db.add(new_prod); db.commit(); db.refresh(new_prod)
        return {"message": "Produce listed successfully!", "product": {"id": new_prod.id, "farmer_id": new_prod.farmer_id, "farmer_name": new_prod.farmer_name, "crop_name": new_prod.crop_name, "category": new_prod.category, "variety": new_prod.variety, "quantity_kg": new_prod.quantity_kg, "reserved_quantity_kg": new_prod.reserved_quantity_kg or 0.0, "available_quantity_kg": new_prod.quantity_kg, "unit": new_prod.unit, "moq": new_prod.moq, "price_per_kg": new_prod.price_per_kg, "negotiable": new_prod.negotiable, "harvest_date": new_prod.harvest_date, "available_from": new_prod.available_from, "shelf_life": new_prod.shelf_life, "organic": new_prod.organic, "pickup_location": new_prod.pickup_location, "pickup_window": new_prod.pickup_window, "quality_grade": new_prod.quality_grade, "image_url": new_prod.image_url, "status": new_prod.status, "cancellation_window_hours": new_prod.cancellation_window_hours, "created_at": new_prod.created_at.isoformat() if new_prod.created_at else None}}
    except Exception as e:
        db.rollback(); logger.error(f"Error creating product: {e}", exc_info=True); raise HTTPException(status_code=500, detail=f"Failed to create product: {str(e)}")

@app.get("/api/products/")
def get_products(category: Optional[str] = None, farmer_name: Optional[str] = Query(None), farmer_id: Optional[int] = Query(None), authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    token_data = verify_access_token(authorization)
    query = db.query(models.Product)
    if category and category not in ["All Crops", "All"]: query = query.filter(models.Product.category == category)
    is_farmer_query = False
    if farmer_id: query = query.filter(models.Product.farmer_id == farmer_id); is_farmer_query = True
    elif farmer_name and farmer_name.strip(): query = query.filter(or_(models.Product.farmer_name.ilike(farmer_name.strip()), models.Product.farmer_name.ilike(f"%{farmer_name.strip()}%"))); is_farmer_query = True
    elif token_data and token_data.get("role") == "farmer" and not category: query = query.filter(models.Product.farmer_id == token_data["user_id"]); is_farmer_query = True
    if not is_farmer_query: query = query.filter(models.Product.status == "active", models.Product.quantity_kg > 0)
    products = query.order_by(models.Product.id.desc()).all()
    result = []
    for p in products:
        reserved = p.reserved_quantity_kg or 0.0; avail = max(0.0, round(p.quantity_kg - reserved, 2))
        result.append({"id": p.id, "farmer_id": p.farmer_id, "farmer_name": p.farmer_name, "crop_name": p.crop_name, "category": p.category, "variety": p.variety, "quantity_kg": p.quantity_kg, "reserved_quantity_kg": reserved, "available_quantity_kg": avail, "unit": p.unit, "moq": p.moq, "price_per_kg": p.price_per_kg, "negotiable": p.negotiable, "harvest_date": p.harvest_date, "available_from": p.available_from, "shelf_life": p.shelf_life, "organic": p.organic, "pickup_location": p.pickup_location, "pickup_window": p.pickup_window, "quality_grade": p.quality_grade, "image_url": p.image_url, "status": p.status, "cancellation_window_hours": p.cancellation_window_hours, "created_at": p.created_at.isoformat() if p.created_at else None})
    return result

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod: raise HTTPException(status_code=404, detail="Product not found")
    db.query(models.CartItem).filter(models.CartItem.product_id == product_id).delete()
    db.delete(prod); db.commit()
    return {"message": "Product removed successfully"}

@app.put("/api/products/{product_id}")
def update_product(product_id: int, req: ProductUpdateRequest, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    if req.crop_name is not None: product.crop_name = req.crop_name
    if req.price_per_kg is not None: product.price_per_kg = req.price_per_kg
    if req.quality_grade is not None: product.quality_grade = req.quality_grade
    if req.harvest_date is not None: product.harvest_date = req.harvest_date
    if req.negotiable is not None: product.negotiable = req.negotiable
    if req.add_quantity is not None and req.add_quantity > 0: product.quantity_kg += req.add_quantity; product.status = "active"
    if req.status is not None: product.status = req.status
    db.commit(); db.refresh(product)
    return {"message": "Product updated successfully", "product": product}

# --- SERVER-SIDE CART & SOFT STOCK RESERVATION ENDPOINTS ---
@app.get("/api/cart")
def get_cart(buyer_name: str = Query(...), db: Session = Depends(get_db)):
    clean_buyer = buyer_name.strip()
    cart_items = db.query(models.CartItem).filter(models.CartItem.buyer_name.ilike(clean_buyer)).all()
    items_data = []; grouped = {}; grand_total = 0.0
    for ci in cart_items:
        product = db.query(models.Product).filter(models.Product.id == ci.product_id).first()
        if not product or product.status == "deleted": db.delete(ci); continue
        reserved = product.reserved_quantity_kg or 0.0
        available_stock = max(0.0, round(product.quantity_kg - reserved + ci.quantity_kg, 2))
        subtotal = round(ci.quantity_kg * ci.price_per_kg, 2); grand_total += subtotal
        item_dict = {"id": ci.id, "product_id": ci.product_id, "farmer_name": ci.farmer_name, "farmer_id": ci.farmer_id, "crop_name": ci.crop_name, "quantity_kg": ci.quantity_kg, "orderQty": ci.quantity_kg, "price_per_kg": ci.price_per_kg, "subtotal": subtotal, "unit": ci.unit or "kg", "moq": ci.moq or product.moq or "10", "min_moq_num": parse_numeric_moq(ci.moq or product.moq), "max_available_stock": available_stock, "image_url": product.image_url, "quality_grade": product.quality_grade, "pickup_location": product.pickup_location, "cancellation_window_hours": ci.cancellation_window_hours or 24}
        items_data.append(item_dict)
        f_name = ci.farmer_name
        if f_name not in grouped: grouped[f_name] = []
        grouped[f_name].append(item_dict)
    db.commit()
    return {"buyer_name": clean_buyer, "items": items_data, "grouped_by_farmer": grouped, "total_items": len(items_data), "grand_total": round(grand_total, 2)}

@app.post("/api/cart/add")
def add_to_cart(req: CartAddRequest, db: Session = Depends(get_db)):
    clean_buyer = req.buyer_name.strip()
    product = db.query(models.Product).filter(models.Product.id == req.product_id).first()
    if not product: raise HTTPException(status_code=404, detail="Product not found.")
    if product.status != "active": raise HTTPException(status_code=400, detail="This product is currently not available.")
    min_moq = parse_numeric_moq(product.moq)
    if req.quantity_kg < min_moq: raise HTTPException(status_code=400, detail=f"Minimum order quantity for {product.crop_name} is {min_moq}kg. Please adjust quantity.")
    existing_item = db.query(models.CartItem).filter(models.CartItem.buyer_name.ilike(clean_buyer), models.CartItem.product_id == req.product_id).first()
    existing_qty = existing_item.quantity_kg if existing_item else 0.0
    current_reserved = product.reserved_quantity_kg or 0.0
    max_available = round(product.quantity_kg - current_reserved + existing_qty, 2)
    if req.quantity_kg > max_available: raise HTTPException(status_code=400, detail=f"Only {max_available}kg of {product.crop_name} available. Cannot add {req.quantity_kg}kg.")
    delta_qty = req.quantity_kg - existing_qty
    product.reserved_quantity_kg = max(0.0, round(current_reserved + delta_qty, 2))
    if existing_item:
        existing_item.quantity_kg = req.quantity_kg; existing_item.price_per_kg = product.price_per_kg; existing_item.updated_at = datetime.utcnow()
    else:
        new_item = models.CartItem(buyer_name=clean_buyer, product_id=product.id, farmer_name=product.farmer_name, farmer_id=product.farmer_id, crop_name=product.crop_name, quantity_kg=req.quantity_kg, price_per_kg=product.price_per_kg, unit=product.unit or "kg", moq=product.moq or "10", cancellation_window_hours=req.cancellation_window_hours or product.cancellation_window_hours or 24)
        db.add(new_item)
    db.commit()
    return get_cart(buyer_name=clean_buyer, db=db)

@app.post("/api/cart/update")
def update_cart_item(req: CartUpdateRequest, db: Session = Depends(get_db)):
    clean_buyer = req.buyer_name.strip()
    item = db.query(models.CartItem).filter(models.CartItem.id == req.cart_item_id, models.CartItem.buyer_name.ilike(clean_buyer)).first()
    if not item: raise HTTPException(status_code=404, detail="Cart item not found.")
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product: db.delete(item); db.commit(); return get_cart(buyer_name=clean_buyer, db=db)
    if req.quantity_kg <= 0:
        product.reserved_quantity_kg = max(0.0, round((product.reserved_quantity_kg or 0.0) - item.quantity_kg, 2)); db.delete(item); db.commit(); return get_cart(buyer_name=clean_buyer, db=db)
    min_moq = parse_numeric_moq(product.moq)
    if req.quantity_kg < min_moq: raise HTTPException(status_code=400, detail=f"Minimum order quantity for {product.crop_name} is {min_moq}kg.")
    current_reserved = product.reserved_quantity_kg or 0.0; max_available = round(product.quantity_kg - current_reserved + item.quantity_kg, 2)
    if req.quantity_kg > max_available: raise HTTPException(status_code=400, detail=f"Only {max_available}kg available for {product.crop_name}.")
    delta_qty = req.quantity_kg - item.quantity_kg; product.reserved_quantity_kg = max(0.0, round(current_reserved + delta_qty, 2))
    item.quantity_kg = req.quantity_kg; item.updated_at = datetime.utcnow(); db.commit()
    return get_cart(buyer_name=clean_buyer, db=db)

@app.post("/api/cart/remove")
def remove_cart_item(req: CartRemoveRequest, db: Session = Depends(get_db)):
    clean_buyer = req.buyer_name.strip()
    item = db.query(models.CartItem).filter(models.CartItem.id == req.cart_item_id, models.CartItem.buyer_name.ilike(clean_buyer)).first()
    if not item: return get_cart(buyer_name=clean_buyer, db=db)
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if product: product.reserved_quantity_kg = max(0.0, round((product.reserved_quantity_kg or 0.0) - item.quantity_kg, 2))
    db.delete(item); db.commit()
    return get_cart(buyer_name=clean_buyer, db=db)

@app.post("/api/cart/clear")
def clear_cart(req: CartClearRequest, db: Session = Depends(get_db)):
    clean_buyer = req.buyer_name.strip()
    items = db.query(models.CartItem).filter(models.CartItem.buyer_name.ilike(clean_buyer)).all()
    for item in items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product: product.reserved_quantity_kg = max(0.0, round((product.reserved_quantity_kg or 0.0) - item.quantity_kg, 2))
        db.delete(item)
    db.commit()
    return {"message": "Cart cleared successfully and reserved stock released."}

# --- STATS & WALLET ENDPOINTS ---
@app.get("/api/stats/overview")
def get_platform_overview_stats(db: Session = Depends(get_db)):
    active_farmers_count = db.query(models.User).filter(models.User.role == "farmer", models.User.status == "active").count()
    products_count = db.query(models.Product).filter(models.Product.status == "active").count()
    buyers_count = db.query(models.User).filter(models.User.role == "buyer").count()
    return {"active_farmers_count": active_farmers_count, "total_active_farmers_display": f"{active_farmers_count} Active Farmers" if active_farmers_count > 0 else "0 Active Farmers", "products_listed_count": products_count, "total_products_display": f"{products_count} Lots Listed" if products_count > 0 else "0 Lots Listed", "buyers_online_count": buyers_count, "buyers_online_display": f"{buyers_count} Buyers Registered" if buyers_count > 0 else "0 Buyers Registered", "avg_mandi_saving": "+32.8%", "escrow_settled_pct": "100%"}

@app.get("/api/wallet/{user_name}")
def get_user_wallet(user_name: str, db: Session = Depends(get_db)):
    clean_name = user_name.strip()
    trxs = db.query(models.Transaction).filter(models.Transaction.user_name.ilike(clean_name)).order_by(models.Transaction.id.desc()).all()
    total_credit = sum(t.amount for t in trxs if t.type == "credit"); total_debit = sum(t.amount for t in trxs if t.type == "debit")
    balance = max(0.0, total_credit - total_debit)
    return {"user_name": clean_name, "balance": balance, "formatted_balance": f"₹{balance:,.2f}", "total_earnings": total_credit, "middleman_saving_pct": "+34.8%", "transactions": [{"id": t.id, "title": t.title, "description": t.description, "amount": t.amount, "formatted_amount": f"{'+' if t.type == 'credit' else '-'}₹{t.amount:,.2f}", "type": t.type, "status": t.status, "reference_id": t.reference_id, "created_at": t.created_at.strftime("%b %d, %I:%M %p") if t.created_at else "Today"} for t in trxs]}

@app.post("/api/wallet/withdraw")
def withdraw_wallet(req: WithdrawalRequest, db: Session = Depends(get_db)):
    if req.amount <= 0: raise HTTPException(status_code=400, detail="Invalid withdrawal amount")
    debit_trx = models.Transaction(user_name=req.user_name, type="debit", amount=req.amount, title="Withdrawal to Bank Account (**4910)", description="Bank IMPS Transfer Completed", reference_id=f"WTH-{int(datetime.utcnow().timestamp())}", status="completed")
    db.add(debit_trx); db.commit()
    return {"message": f"₹{req.amount:,.2f} transferred successfully!", "transaction_id": debit_trx.reference_id}

# --- ORDERS & CHECKOUT ENDPOINTS ---
@app.get("/api/orders/")
def get_orders(farmer_name: Optional[str] = Query(None), farmer_id: Optional[int] = Query(None), buyer_name: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.Order)
    if farmer_id: query = query.filter(models.Order.farmer_id == farmer_id)
    elif farmer_name and farmer_name.strip(): query = query.filter(or_(models.Order.farmer_name.ilike(farmer_name.strip()), models.Order.farmer_name.ilike(f"%{farmer_name.strip()}%")))
    if buyer_name and buyer_name.strip(): query = query.filter(models.Order.buyer_name.ilike(buyer_name.strip()))
    return query.order_by(models.Order.id.desc()).all()

@app.post("/api/checkout")
def process_checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    if not req.items: raise HTTPException(status_code=400, detail="No items in checkout request.")
    created_orders = []
    group_id = f"AG-{int(datetime.utcnow().timestamp())}-{uuid.uuid4().hex[:4].upper()}"
    try:
        for item in req.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if not product: raise HTTPException(status_code=404, detail=f"Product {item.crop_name} not found.")
            if product.quantity_kg < item.quantity_kg: raise HTTPException(status_code=400, detail=f"Only {product.quantity_kg}kg of {item.crop_name} available. Please adjust your order.")

            # PERMANENTLY DEDUCT STOCK AT CHECKOUT
            product.quantity_kg = max(0.0, round(product.quantity_kg - item.quantity_kg, 2))
            # Release the soft-reservation that was made in the cart
            product.reserved_quantity_kg = max(0.0, round((product.reserved_quantity_kg or 0.0) - item.quantity_kg, 2))
            
            if product.quantity_kg <= 0:
                product.quantity_kg = 0.0
                product.status = "sold"

            order_num = f"{group_id}-{item.product_id}"
            new_order = models.Order(
                order_group_id=group_id, order_number=order_num, buyer_name=req.buyer_name.strip(),
                farmer_name=product.farmer_name or item.farmer_name, farmer_id=product.farmer_id,
                crop_name=item.crop_name, quantity_kg=item.quantity_kg, price_per_kg=item.price_per_kg,
                total_amount=round(item.quantity_kg * item.price_per_kg, 2), status="Pending Farmer Confirmation",
                cancellation_window_hours=item.cancellation_window_hours or 24, product_id=item.product_id,
                payment_method=req.payment_method or "Bank Transfer (NEFT/RTGS)", delivery_address=req.delivery_address or "Direct APMC Depot", order_note=req.order_note
            )
            db.add(new_order); db.flush(); created_orders.append(new_order)

            # Clear this item from buyer's CartItem
            db.query(models.CartItem).filter(models.CartItem.buyer_name.ilike(req.buyer_name.strip()), models.CartItem.product_id == item.product_id).delete()

        db.commit()
        for o in created_orders: db.refresh(o)
        orders_list = [{"id": o.id, "order_group_id": o.order_group_id, "order_number": o.order_number, "buyer_name": o.buyer_name, "farmer_name": o.farmer_name, "farmer_id": o.farmer_id, "crop_name": o.crop_name, "quantity_kg": o.quantity_kg, "price_per_kg": o.price_per_kg, "total_amount": o.total_amount, "status": o.status, "cancellation_window_hours": o.cancellation_window_hours, "product_id": o.product_id, "payment_method": o.payment_method, "delivery_address": o.delivery_address, "order_note": o.order_note, "created_at": o.created_at.isoformat() if o.created_at else None} for o in created_orders]
        logger.info(f"Checkout completed. Created {len(created_orders)} sub-orders under Group ID {group_id}. Stock deducted instantly.")
        return {"message": "Order placed successfully! Stock deducted instantly.", "order_group_id": group_id, "orders": orders_list}
    except HTTPException:
        db.rollback(); raise
    except Exception as e:
        db.rollback(); logger.error(f"Error during checkout: {e}", exc_info=True); raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orders/update_status")
def update_order_status(req: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == req.order_id).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    prev_status = (order.status or "").lower(); target_status = req.status.strip(); target_lower = target_status.lower()
    product = db.query(models.Product).filter(models.Product.id == order.product_id).first() if order.product_id else None

    # 1. REJECT ORDER -> ADD STOCK BACK
    if target_lower in ["rejected", "reject"]:
        if prev_status not in ["rejected", "cancelled"]:
            if product:
                product.quantity_kg = round(product.quantity_kg + order.quantity_kg, 2)
                if product.status == "sold" and product.quantity_kg > 0: product.status = "active"
            order.status = "Rejected"
            if req.rejection_reason: order.rejection_reason = req.rejection_reason
            logger.info(f"Order #{order.order_number} REJECTED. Stock {order.quantity_kg}kg added back to Product #{order.product_id}.")

    # 2. ACCEPT ORDER (CONFIRMED) -> DO NOT DEDUCT AGAIN (Already deducted at checkout)
    elif target_lower in ["confirmed", "confirm", "accepted", "accept"]:
        if prev_status in ["pending farmer confirmation", "placed", "pending"]:
            order.status = "Confirmed"
            credit_trx = models.Transaction(user_name=order.farmer_name, type="credit", amount=order.total_amount, title=f"Order #{order.order_number} Accepted", description=f"Escrow released for {order.quantity_kg}kg {order.crop_name} (Buyer: {order.buyer_name})", reference_id=order.order_number, status="completed")
            db.add(credit_trx)
            logger.info(f"Order #{order.order_number} ACCEPTED. Escrow credited to {order.farmer_name}.")

    # 3. LIFECYCLE PROGRESSION
    elif target_lower in ["picked up", "picked_up"]: order.status = "Picked Up"
    elif target_lower in ["in transit", "in_transit"]: order.status = "In Transit"
    elif target_lower in ["delivered", "deliver"]: order.status = "Delivered"
    else: order.status = target_status

    db.commit(); db.refresh(order)
    return {"message": f"Order status updated to {order.status}", "status": order.status, "order_id": order.id, "order_number": order.order_number}

@app.post("/api/orders/cancel")
def cancel_order(req: CancelOrderRequest, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == req.order_id).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    prev_status = (order.status or "").lower()
    if prev_status not in ["pending farmer confirmation", "placed", "pending"]: raise HTTPException(status_code=400, detail="Order cannot be cancelled at this stage.")
        
    product = db.query(models.Product).filter(models.Product.id == order.product_id).first() if order.product_id else None
    if product:
        # ADD STOCK BACK because it was deducted at checkout
        product.quantity_kg = round(product.quantity_kg + order.quantity_kg, 2)
        if product.status == "sold" and product.quantity_kg > 0: product.status = "active"
        
    order.status = "Cancelled"
    db.commit()
    logger.info(f"Order #{order.order_number} cancelled by buyer. Stock added back.")
    return {"message": "Order cancelled successfully", "status": order.status}

@app.get("/")
def read_root(): return {"message": "AgriConnect API v3.0 is running! (Demand Forecasting + Route Optimization) 🌾🚚"}

@app.get("/health")
def health_check(): return {"status": "healthy", "version": "3.0"}

# ===========================================================================
# DEMAND FORECASTING INTEGRATION
# ===========================================================================
# Mount the demand_forecasting forecast_api routes directly into this FastAPI
# app so the frontend can call /api/forecast/* without a separate service.
# ---------------------------------------------------------------------------
import sys as _sys, os as _os
_FORECAST_DIR_INTERNAL = _os.path.normpath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'demand_forecasting'))
_FORECAST_DIR_SIBLING = _os.path.normpath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', 'demand_forecasting'))
_FORECAST_DIR = _FORECAST_DIR_INTERNAL if _os.path.isdir(_FORECAST_DIR_INTERNAL) else _FORECAST_DIR_SIBLING

if _os.path.isdir(_FORECAST_DIR) and _FORECAST_DIR not in _sys.path:
    _sys.path.insert(0, _FORECAST_DIR)

try:
    from forecast_api import forecast_router as _forecast_router
    app.include_router(_forecast_router)
    logger.info(f"[AgriConnect] Demand Forecasting routes mounted at /api/forecast/*")
except Exception as _fe:
    logger.warning(f"[AgriConnect] Forecasting module not loaded: {_fe}. "
                   "Run 'pip install prophet xgboost scikit-learn joblib pandas' and ensure "
                   "demand_forecasting/ is a sibling of this backend/ directory.")

# ===========================================================================
# ROUTE OPTIMIZATION INTEGRATION (VERSION 3)
# ===========================================================================
# Mount the Google OR-Tools PDP-VRPTW multi-vehicle route optimization router
# directly into this FastAPI app for /api/v1/* and /api/route/* endpoints.
# ---------------------------------------------------------------------------
_ROUTE_SRC_INTERNAL = _os.path.normpath(os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'Route-Optimization-model', 'src'))
_ROUTE_SRC_SIBLING = _os.path.normpath(os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', '..', 'Route-Optimization-model', 'src'))
_ROUTE_SRC_DIR = _ROUTE_SRC_INTERNAL if _os.path.isdir(_ROUTE_SRC_INTERNAL) else _ROUTE_SRC_SIBLING

if _os.path.isdir(_ROUTE_SRC_DIR) and _ROUTE_SRC_DIR not in _sys.path:
    _sys.path.insert(0, _ROUTE_SRC_DIR)

try:
    from route_api import route_router as _route_router
    app.include_router(_route_router)
    logger.info(f"[AgriConnect] Route Optimization routes mounted at /api/v1/* and /api/route/*")
except Exception as _re:
    logger.warning(f"[AgriConnect] Route optimization module not loaded: {_re}. "
                   "Ensure Route-Optimization-model/ is present.")

