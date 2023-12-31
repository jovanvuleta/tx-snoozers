from pydantic import Field

from beanie import Document
from pydantic import BaseModel


class SignedTx(Document):
    signed_tx_hex: str
    gwei_threshold: int  # gwei
    is_sent: bool = Field(default=False)
    is_successful: bool = Field(default=False)

    class Config:
        json_schema_extra = {
            "example": {
                "signed_tx_hex": "0x0000000000000000000000000000000000000000",
                "gwei_threshold": 1,
                "is_sent": False,
                "is_successful": False,
            }
        }

    class Settings:
        name = "signedtx"


class SignedTxCreate(BaseModel):
    signed_tx_hex: str
    gwei_threshold: int


class NewPendingTx(BaseModel):
    recipient: str
    beneficiary: str
    gwei_threshold: int
    transfer_amount: float
