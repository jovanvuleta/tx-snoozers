import os
from time import sleep
from typing import List

from fastapi import HTTPException, APIRouter, Request
from web3.exceptions import TransactionNotFound

from backend.helpers.logger import get_logger
from backend.models import SignedTx
from backend.models.signed_tx import SignedTxCreate, NewPendingTx
from backend.tg import send_tg_message

router = APIRouter()

logger = get_logger()


@router.post("/", response_model=SignedTx)
async def create_signed_tx(signed_tx_create: SignedTxCreate):
    fname = create_signed_tx.__name__
    logger.info(fname)

    signature_tx: SignedTx = await SignedTx.find_one(SignedTx.signed_tx_hex == signed_tx_create.signed_tx_hex)
    if signature_tx:
        raise HTTPException(status_code=400, detail="Signature tx already exists.")

    new_signed_tx = SignedTx(**signed_tx_create.model_dump())
    await new_signed_tx.insert()
    return new_signed_tx


@router.get("/")
async def get_signed_txs(request: Request):
    fname = get_signed_txs.__name__
    logger.info(fname)

    signed_txs = await SignedTx.find(SignedTx.is_sent == False).to_list()

    if not signed_txs:
        err_msg = "No pending signed transactions."
        logger.error(f"{fname}: {err_msg}")
        raise HTTPException(status_code=400, detail=err_msg)

    return {
        "data": signed_txs,
    }


@router.get("/pending")
async def check_if_gas_is_right(request: Request):
    fname = check_if_gas_is_right.__name__
    logger.info(fname)

    from web3 import Web3, HTTPProvider
    from web3.gas_strategies.rpc import rpc_gas_price_strategy
    from web3.middleware import geth_poa_middleware

    w3 = Web3(HTTPProvider(os.environ.get("RPC_URL")))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    w3.eth.set_gas_price_strategy(rpc_gas_price_strategy)

    signed_txs: List[SignedTx] = await SignedTx.find_many(SignedTx.is_sent == False).to_list()

    if not signed_txs:
        err_msg = "No unsigned transactions pending"
        logger.error(f"{fname}: {err_msg}")
        raise HTTPException(status_code=400, detail=err_msg)

    for tx in signed_txs:
        current_gas_price = w3.eth.gas_price
        if current_gas_price > tx.gwei_threshold:
            logger.info("Gas price still not low enough, skipping tx...")
            continue

        logger.info("Gas price is acceptable. Sending the transaction...")
        tx_receipt = None

        try:
            tx_hash = w3.eth.send_raw_transaction(transaction=tx.signed_tx_hex)
        except ValueError as e:
            logger.error(f"Nonce too low error for signature hash: {tx.signed_tx_hex}, skipping...")
            logger.error(e)
            continue

        retries = 5
        while retries > 0:
            try:
                tx_receipt = w3.eth.get_transaction_receipt(transaction_hash=tx_hash)
                break
            except TransactionNotFound as e:
                logger.error(e)
                logger.info("Tx not found, sleeping for 5...")
                sleep(5)
                retries -= 1

        if tx_receipt:
            tx_status = tx_receipt["status"]

            logger.info(f"Transaction hash: {tx_hash.hex()} -> status: {tx_status}")
            if tx_status == 1:
                tx.is_sent = True
                tx.is_successful = True
                await tx.save()

                await send_tg_message(
                    message_text=f"Your snoozed transaction has been executed, check it out @claudioBarreira: https://sepolia.etherscan.io/tx/{tx_hash.hex()}"
                )

    return {"data": signed_txs}


@router.post("/pending", response_model=SignedTx)
async def generate_pending_tx(new_tx: NewPendingTx):
    fname = generate_pending_tx.__name__
    logger.info(fname)

    from web3 import Web3, HTTPProvider

    w3 = Web3(HTTPProvider(os.environ.get("RPC_URL")))

    tx_create = w3.eth.account.sign_transaction(
        {
            "nonce": w3.eth.get_transaction_count(Web3.to_checksum_address(new_tx.recipient)),
            "gasPrice": 30,
            "gas": 21000,
            "to": Web3.to_checksum_address(new_tx.beneficiary),
            "value": w3.to_wei(new_tx.transfer_amount, "ether"),
            "chainId": 11155111,
        },
        os.environ.get("PK")
    )

    logger.info(tx_create.rawTransaction)
    signature_hash_str = tx_create.rawTransaction.hex()
    logger.info(f"Signed tx hash: {signature_hash_str}")

    signed_tx = SignedTx(signed_tx_hex=signature_hash_str, gwei_threshold=new_tx.gwei_threshold)
    await signed_tx.save()

    logger.info("Saved new signed tx")

    return signed_tx
