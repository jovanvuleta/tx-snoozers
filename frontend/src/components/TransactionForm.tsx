import getTokensInWallet from "@/utils/getTokensInWallet";
import React, { FC, ReactNode, useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useAccount, useBalance, useNetwork, useWalletClient } from "wagmi";
import axios from "axios";
import Spinner from "./Spinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { parseGwei } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import Web3 from "web3";
import { toast } from "react-toastify";

import { erc20ABI } from "wagmi";
import { Wallet } from "ethers";

type FormData = {
  amount: string;
  tokenAddress: string;
  destinationAddress: string;
  maxGas: string;
  privateKey: string;
};

export const provider = new Web3.providers.HttpProvider(
  process.env.NEXT_PUBLIC_RPC_PROVIDER_URL!
);
export const web3 = new Web3(provider);

const TransactionForm: FC = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<FormData>();

  const tokenAddress = watch("tokenAddress");

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const contract = new web3.eth.Contract(erc20ABI, data.tokenAddress);

    try {
      const account = privateKeyToAccount(
        ("0x" + data.privateKey) as `0x${string}`
      );

      const value = BigInt(Number(data.amount) * 10 ** 18);

      const nonce = await web3.eth.getTransactionCount(
        address as `0x${string}`
      );

      const signature = await account.signTransaction({
        chainId: chain?.id,
        account: address,
        to: data.destinationAddress as `0x${string}`,
        value,
        nonce: Number(nonce),
        gas: BigInt(50000),
        gasPrice: BigInt(Number(data.maxGas) * 10 ** 9),
      });

      console.log(signature);
      mutate(
        { signed_tx_hex: signature, gwei_threshold: data.maxGas },
        {
          onSuccess: () => {
            toast("Transaction submitted", {
              toastId: "transaction-success",
              type: "success",
            });
          },
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  // const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
  //   queryKey: ["tokens"],
  //   queryFn: async () => {
  //     if (!address || !chain?.id) return;
  //     try {
  //       const walletTokens = await getTokensInWallet({
  //         address,
  //         chainId: chain.id,
  //       });

  //       if (!tokenAddress) {
  //         setValue("tokenAddress", walletTokens[0]?.address);
  //       }

  //       return walletTokens;
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   },
  // });

  const { mutate } = useMutation({
    mutationFn: async (data: any) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/tx`;
        const headers = { "Content-Type": "application/json" };
        const response = await axios.post(url, data, { headers });

        return response;
      } catch (err) {
        console.error(err);
      }
    },
  });

  useEffect(() => {
    setValue("privateKey", process.env.NEXT_PUBLIC_PRIVATE_KEY!);
  });

  return (
    <div className="relative max-w-xl w-full m-auto">
      <div
        className="absolute scale-110 blur-3xl h-full w-full top-0 z-0"
        style={{
          backgroundColor: "rgba(183, 131, 255, 0.125)",
        }}
      />
      <div
        //bg-[#131313]
        className="flex items-center justify-center w-full z-10 relative border rounded-xl p-6 bg-[#0e050b]"
        style={{
          borderColor: "#ffffff11",
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2">
              <InputCard>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <div className="text-sm mb-2">Amount</div>
                    <input
                      {...register("amount", { required: true })}
                      placeholder="Value"
                      className="placeholder-[#3b3b3b] text-white pointer-events-auto relative text-[25px] w-full outline-0 bg-transparent whitespace-nowrap overflow-hidden text-ellipsis"
                    />
                  </div>

                  {/* <div className="flex items-center h-[42px]">
                    {isLoadingTokens ? (
                      <Spinner />
                    ) : (
                      <select
                        {...register("tokenAddress", { required: true })}
                        className="appearance-none h-full p-2 rounded-xl bg-[#0e050b] border-[#ffffff22] border text-white outline-0 text-center max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        <option disabled>Select token</option>
                        {tokens.map(({ address, symbol }, i) => (
                          <option key={address} value={address}>
                            {symbol}
                          </option>
                        ))}
                      </select>
                    )}
                  </div> */}
                </div>
              </InputCard>
              <InputCard>
                <div className="text-sm mb-2">Destination address</div>
                <input
                  {...register("destinationAddress", { required: true })}
                  placeholder="Address"
                  className="placeholder-[#3b3b3b] text-white pointer-events-auto relative text-[25px] w-full outline-0 bg-transparent whitespace-nowrap overflow-hidden text-ellipsis"
                />
              </InputCard>
              <div className="hidden">
                <InputCard>
                  <input
                    {...register("privateKey", { required: true })}
                    placeholder="Private key"
                    className="placeholder-[#3b3b3b] text-white pointer-events-auto relative text-[25px] w-full outline-0 bg-transparent whitespace-nowrap overflow-hidden text-ellipsis"
                  />
                </InputCard>
              </div>
            </div>

            <InputCard>
              <div className="text-sm mb-2">Max gas</div>
              <input
                {...register("maxGas", { required: true })}
                placeholder="Value"
                className="placeholder-[#3b3b3b] text-white pointer-events-auto relative text-xl w-full outline-0 bg-transparent whitespace-nowrap overflow-hidden text-ellipsis"
              />
            </InputCard>

            <InputCard>
              <div className="text-sm mb-2">Telegram handle (optional)</div>
              <input
                placeholder="Handle"
                className="placeholder-[#3b3b3b] text-white pointer-events-auto relative text-xl w-full outline-0 bg-transparent whitespace-nowrap overflow-hidden text-ellipsis"
              />
            </InputCard>

            <div className="flex w-full items-center justify-between">
              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={!isValid}
              >
                Submit Transaction
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputCard = ({ children }: { children: ReactNode }) => (
  <div className="relative p-4 bg-[#1b1b1b] rounded-xl text-[#9b9b9b]">
    {children}
  </div>
);

export default TransactionForm;
