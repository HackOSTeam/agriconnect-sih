from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgriConnect API")

# Allow React frontend to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DUMMY AUTH (Hardcoded as per your stack) ---
@app.get("/api/login/{role}")
def dummy_login(role: str):
    if role == "farmer":
        return {"user": "Farmer ABC", "role": "farmer", "location": "Pune"}
    elif role == "buyer":
        return {"user": "Buyer XYZ", "role": "buyer", "location": "Mumbai"}
    return {"error": "Invalid role"}

@app.get("/")
def read_root():
    return {"message": "AgriConnect FastAPI Backend is running! 🌾"}