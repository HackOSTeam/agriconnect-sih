from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True) # "farmer", "buyer", or "logistics"
    sub_role = Column(String, default="individual")
    name = Column(String)
    mobile = Column(String, unique=True, index=True)
    email = Column(String, nullable=True, index=True)
    password = Column(String, nullable=True)
    language = Column(String, default="English")
    status = Column(String, default="active") # "active", "busy", "offline"
    
    # Farmer / Buyer specific fields
    fpo_name = Column(String, nullable=True)
    fpo_reg_id = Column(String, nullable=True)
    village_district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    id_type = Column(String, nullable=True)
    id_number = Column(String, nullable=True)
    id_doc_url = Column(String, nullable=True)
    primary_crops = Column(String, nullable=True)
    upi_id = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    account_holder_name = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    branch_name = Column(String, nullable=True)
    account_type = Column(String, nullable=True)
    gstin = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    business_type = Column(String, nullable=True)
    business_address = Column(String, nullable=True)
    delivery_address = Column(String, nullable=True)
    monthly_volume = Column(String, nullable=True)
    preferred_crops = Column(String, nullable=True)
    business_doc_url = Column(String, nullable=True)
    
    # Logistics Partner Specific Fields
    account_category = Column(String, nullable=True) # "individual_driver", "transport_company", "vehicle_owner"
    company_name = Column(String, nullable=True)
    driving_license = Column(String, nullable=True)
    vehicle_type = Column(String, nullable=True) # mini-truck, tempo, refrigerated van, bike
    num_vehicles = Column(Integer, default=1)
    load_capacity = Column(String, nullable=True) # e.g., "500 kg", "2 Tons"
    has_cold_storage = Column(String, default="No") # "Yes" or "No"
    vehicle_reg_number = Column(String, nullable=True)
    insurance_validity = Column(String, nullable=True)
    operating_region = Column(String, nullable=True)
    availability_schedule = Column(String, nullable=True)
    service_radius = Column(String, nullable=True) # e.g., "50 km"
    rate_per_km = Column(Float, nullable=True)
    rating = Column(Float, default=5.0)
    trips_completed = Column(Integer, default=0)
     
    
    # NEW: For multiple vehicles and license photo
    vehicles_json = Column(Text, nullable=True) # Will store a JSON array of vehicles
    license_doc_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, nullable=True, index=True)
    farmer_name = Column(String, index=True)
    crop_name = Column(String, index=True)
    category = Column(String, default="Vegetable")
    variety = Column(String, nullable=True)
    quantity_kg = Column(Float)
    unit = Column(String, default="kg")
    moq = Column(String, nullable=True)
    price_per_kg = Column(Float)
    negotiable = Column(String, default="Yes")
    harvest_date = Column(String, nullable=True)
    available_from = Column(String, nullable=True)
    shelf_life = Column(String, nullable=True)
    organic = Column(String, default="No")
    pickup_location = Column(String, nullable=True)
    pickup_window = Column(String, nullable=True)
    quality_grade = Column(String, default="Pending")
    image_url = Column(String, nullable=True)
    status = Column(String, default="active")
    cancellation_window_hours = Column(Integer, default=24) # NEW
    reserved_quantity_kg = Column(Float, default=0.0) # Soft reservation
    created_at = Column(DateTime, default=datetime.utcnow)

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    buyer_name = Column(String, index=True)
    product_id = Column(Integer, index=True)
    farmer_name = Column(String, index=True)
    farmer_id = Column(Integer, nullable=True)
    crop_name = Column(String)
    quantity_kg = Column(Float)
    price_per_kg = Column(Float)
    unit = Column(String, default="kg")
    moq = Column(String, nullable=True)
    cancellation_window_hours = Column(Integer, default=24)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, index=True)
    type = Column(String)
    amount = Column(Float)
    title = Column(String)
    description = Column(String, nullable=True)
    reference_id = Column(String, nullable=True)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_group_id = Column(String, index=True, nullable=True) # Groups sub-orders from one checkout
    order_number = Column(String, unique=True, index=True)
    buyer_name = Column(String, index=True)
    farmer_name = Column(String, index=True)
    farmer_id = Column(Integer, nullable=True, index=True)
    crop_name = Column(String)
    quantity_kg = Column(Float)
    price_per_kg = Column(Float)
    total_amount = Column(Float)
    status = Column(String, default="Pending Farmer Confirmation")
    rejection_reason = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    driver_phone = Column(String, nullable=True)
    driver_otp = Column(String, nullable=True)
    cancellation_window_hours = Column(Integer, default=24)
    product_id = Column(Integer, nullable=True) # THIS IS REQUIRED
    payment_method = Column(String, nullable=True)
    delivery_address = Column(String, nullable=True)
    order_note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)