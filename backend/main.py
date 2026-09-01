from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
import os
import shutil
import database, models

app = FastAPI(title="AgriConnect API")

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
models.Base.metadata.create_all(bind=database.engine)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    role: str
    name: str
    mobile: str
    password: str
    language: str = "English"

class UserLogin(BaseModel):
    identifier: str
    password: str
    role: str

@app.post("/api/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.mobile == user.mobile).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    new_user = models.User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully!", "user_id": new_user.id}

@app.post("/api/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        or_(models.User.mobile == user.identifier, models.User.name == user.identifier)
    ).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found. Please register first.")
    if db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Incorrect password.")
    if db_user.role != user.role:
        raise HTTPException(status_code=403, detail=f"This account is registered as a {db_user.role}. Please select the correct role.")
        
    return {"message": "Login successful", "role": db_user.role, "name": db_user.name}

@app.post("/api/products/")
async def create_product(
    farmer_name: str = Form(...),
    crop_name: str = Form(...),
    category: str = Form("Vegetable"),
    variety: str = Form(""),
    quantity_kg: float = Form(...),
    unit: str = Form("kg"),
    moq: str = Form(""),
    price_per_kg: float = Form(...),
    negotiable: str = Form("Yes"),
    harvest_date: str = Form(""),
    available_from: str = Form(""),
    shelf_life: str = Form(""),
    organic: str = Form("No"),
    pickup_location: str = Form(""),
    pickup_window: str = Form("Morning"),
    quality_grade: str = Form("Pending"),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    image_url = None
    if image:
        file_location = f"uploads/{image.filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"http://127.0.0.1:8000/uploads/{image.filename}"

    db_product = models.Product(
        farmer_name=farmer_name, crop_name=crop_name, category=category, variety=variety,
        quantity_kg=quantity_kg, unit=unit, moq=moq, price_per_kg=price_per_kg, negotiable=negotiable,
        harvest_date=harvest_date, available_from=available_from, shelf_life=shelf_life,
        organic=organic, pickup_location=pickup_location, pickup_window=pickup_window,
        quality_grade=quality_grade, image_url=image_url
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return {"message": "Product added successfully!", "product": db_product}

@app.get("/api/products/")
def get_products(farmer_name: str = Query(None), db: Session = Depends(get_db)):
    if farmer_name:
        products = db.query(models.Product).filter(models.Product.farmer_name == farmer_name).all()
    else:
        products = db.query(models.Product).all()
    return products

@app.get("/")
def read_root():
    return {"message": "AgriConnect FastAPI Backend is running! 🌾"}