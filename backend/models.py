from sqlalchemy import Column, Integer, String, Float
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String)
    name = Column(String)
    mobile = Column(String, unique=True, index=True)
    password = Column(String)
    language = Column(String, default="English")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_name = Column(String)
    crop_name = Column(String)
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