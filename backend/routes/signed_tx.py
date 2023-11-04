import os
from time import sleep
from typing import List

from fastapi import HTTPException, APIRouter, Request
from web3.exceptions import TransactionNotFound

from backend.models import SignedTx
from backend.models.signed_tx import SignedTxCreate, NewPendingTx

router = APIRouter()


@router.post("/", response_model=SignedTx)
async def create_signed_tx(signed_tx_create: SignedTxCreate):
    signed_tx = SignedTx(**signed_tx_create.model_dump())
    await signed_tx.insert()
    return signed_tx


@router.get("/")
async def get_signed_txs(request: Request):
    signed_txs = await SignedTx.find_all().to_list()

    if not signed_txs:
        raise HTTPException(status_code=400, detail="Txs not found.")

    return {
        "data": signed_txs,
    }


@router.get("/pending")
async def check_if_gas_is_right(request: Request):
    from web3 import Web3, HTTPProvider
    from web3.gas_strategies.rpc import rpc_gas_price_strategy
    from web3.middleware import geth_poa_middleware

    w3 = Web3(HTTPProvider("https://rpc.sepolia.org/"))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    w3.eth.set_gas_price_strategy(rpc_gas_price_strategy)

    signed_txs: List[SignedTx] = await SignedTx.find_many(SignedTx.is_sent == False).to_list()

    if not signed_txs:
        raise HTTPException(status_code=400, detail="No unsigned transactions pending")

    for tx in signed_txs:
        current_gas_price = w3.eth.gas_price
        if current_gas_price > tx.gwei_threshold:
            print("Gas price still not low enough...")
            continue

        print("Gas price is acceptable. Sending the transaction...")
        tx_receipt = None
        tx_hash = w3.eth.send_raw_transaction(transaction=tx.signed_tx_hex)
        retries = 5
        while retries > 0:
            try:
                tx_receipt = w3.eth.get_transaction_receipt(transaction_hash=tx_hash)
                break
            except TransactionNotFound as e:
                print("sleeping...")
                sleep(10)
                print(e)
                retries -= 1

        if tx_receipt:
            tx_status = tx_receipt["status"]

            print(f"Transaction hash: {tx_hash.hex()} -> status: {tx_status}")
            if tx_status == 1:
                tx.is_sent = True
                tx.is_successful = True
                await tx.save()

    return {"data": signed_txs}


@router.post("/pending", response_model=SignedTx)
async def generate_pending_tx(new_tx: NewPendingTx):
    from web3 import Web3, HTTPProvider
    from web3.gas_strategies.rpc import rpc_gas_price_strategy
    from web3.middleware import geth_poa_middleware

    w3 = Web3(HTTPProvider("https://rpc.sepolia.org/"))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    w3.eth.set_gas_price_strategy(rpc_gas_price_strategy)

    current_gas_price = w3.eth.gas_price
    print(f"Current Gas Price: {current_gas_price} Gwei")

    tx_create = w3.eth.account.sign_transaction(
        {
            "nonce": w3.eth.get_transaction_count(Web3.to_checksum_address(new_tx.recipient)),
            "gasPrice": w3.eth.generate_gas_price(),
            "gas": 21000,
            "to": Web3.to_checksum_address(new_tx.beneficiary),
            "value": w3.to_wei(new_tx.transfer_amount, "ether"),
            "chainId": 11155111,
        },
        os.environ.get("PK")
    )

    print(tx_create.rawTransaction)
    signature_hash_str = tx_create.rawTransaction.hex()
    print(f"Signed tx hash: {signature_hash_str}")

    signed_tx = SignedTx(signed_tx_hex=signature_hash_str, gwei_threshold=new_tx.gwei_threshold)
    await signed_tx.save()
    return signed_tx

