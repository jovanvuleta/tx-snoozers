from typing import Optional

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic.v1.env_settings import BaseSettings

import models


class Settings(BaseSettings):
    # database configurations
    DATABASE_URL: Optional[str] = None

    class Config:
        env_file = ".env"
        orm_mode = True


async def initiate_database():
    client = AsyncIOMotorClient(Settings().DATABASE_URL)
    await init_beanie(database=client.get_default_database(), document_models=models.__all__)
