from dotenv import load_dotenv
from fastapi import FastAPI

from backend.config import initiate_database
from backend.routes.signed_tx import router as SignedTx

load_dotenv()
app = FastAPI()


@app.on_event("startup")
async def start_database():
    await initiate_database()


@app.get("/ping", tags=["Ping"])
async def get_ping():
    return {"message": "Server alive."}


app.include_router(SignedTx, tags=["SignedTx"], prefix="/tx")
