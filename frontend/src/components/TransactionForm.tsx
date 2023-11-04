import getTokensInWallet from "@/utils/getTokensInWallet";
import React, { FC, ReactNode } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useAccount, useBalance, useNetwork, useWalletClient } from "wagmi";

import Spinner from "./Spinner";
import { useQuery } from "@tanstack/react-query";
import { parseGwei } from "viem";

type FormData = {
  amount: string;
  tokenAddress: string;
  destinationAddress: string;
  maxGas: string;
};

const TransactionForm: FC = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();

  const { data: walletClient } = useWalletClient({ chainId: chain?.id });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid },
  } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const signature = await walletClient?.signTransaction({
        maxFeePerGas: parseGwei("20"),
        maxPriorityFeePerGas: parseGwei("3"),
        gas: 21000n,
        nonce: 69,
        to: data.destinationAddress as `0x${string}`,
      });
      console.log(signature);
    } catch (err) {
      console.error(err);
    }
  };

  const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: async () => {
      if (!address || !chain?.id) return;
      try {
        const walletTokens = await getTokensInWallet({
          address,
          chainId: chain.id,
        });

        setValue("tokenAddress", walletTokens[0]?.address);

        return walletTokens;
      } catch (err) {
        console.error(err);
      }
    },
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
                <div className="flex gap-2">
                  {/* <div className="text-sm mb-2">Amount</div> */}
                  <input
                    {...register("amount", { required: true })}
                    type="number"
                    placeholder="Amount"
                    className="placeholder-[#3b3b3b] text-white pointer-events-auto relative text-[25px] w-full outline-0 bg-transparent whitespace-nowrap overflow-hidden text-ellipsis"
                  />

                  <div className="flex items-center h-[42px]">
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
                  </div>
                </div>
              </InputCard>

              <InputCard>
                <input
                  {...register("destinationAddress", { required: true })}
                  placeholder="Destination address"
                  // placeholder="0x06d67c0F18a4B2055dF3C22201f351B131843970"
                  className="placeholder-[#3b3b3b] text-white pointer-events-auto relative text-[25px] w-full outline-0 bg-transparent whitespace-nowrap overflow-hidden text-ellipsis"
                />
              </InputCard>
            </div>

            <InputCard>
              <div className="text-sm mb-2">Max gas</div>
              <input
                {...register("maxGas", { required: true })}
                placeholder="Value"
                className="placeholder-[#3b3b3b] text-white pointer-events-auto relative text-xl w-full outline-0 bg-transparent whitespace-nowrap overflow-hidden text-ellipsis"
              />
            </InputCard>

            <div className="flex w-full items-center justify-between">
              <button
                className="btn btn-primary w-full"
                type="submit"
                // disabled={!isValid}
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
