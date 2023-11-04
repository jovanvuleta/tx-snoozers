from dotenv import load_dotenv
from fastapi import FastAPI

from backend.config import initiate_database
from backend.helpers.logger import get_logger
from backend.routes.signed_tx import router as SignedTx

load_dotenv()
app = FastAPI()

logger = get_logger()


@app.on_event("startup")
async def start_database():
    logger.info("Startup event...")
    await initiate_database()


@app.get("/ping", tags=["Ping"])
async def get_ping():
    return {"message": "Server alive."}


app.include_router(SignedTx, tags=["SignedTx"], prefix="/tx")
