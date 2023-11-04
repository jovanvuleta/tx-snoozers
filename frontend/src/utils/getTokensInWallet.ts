import { Alchemy, Network } from "alchemy-sdk";
import { polygon, polygonMumbai, sepolia } from "viem/chains";

type GetTokensInWalletProps = {
  address: string;
  chainId: number;
};

const getTokensInWallet = async ({
  address,
  chainId,
}: GetTokensInWalletProps) => {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    network: chainIdToNetwork[chainId as keyof typeof chainIdToNetwork],
  };

  const alchemy = new Alchemy(config);

  const balances = await alchemy.core.getTokenBalances(address);

  const tokens = await Promise.all(
    balances.tokenBalances.map(async ({ contractAddress }) => {
      const metadata = await alchemy.core.getTokenMetadata(contractAddress);
      return { ...metadata, address: contractAddress };
    })
  );
  return tokens;
};

const chainIdToNetwork = {
  137: Network.MATIC_MAINNET,
  80001: Network.MATIC_MUMBAI,
  11155111: Network.ETH_SEPOLIA,
};

export default getTokensInWallet;
