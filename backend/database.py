from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Creates a file called agriconnect.db in your backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./agriconnect.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()