import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import sample from "lodash/sample";
import { NETWORKS_SUPPORTED } from "@/configs/networks";

declare var window: any;
const chainId: number = parseInt(NETWORKS_SUPPORTED.chainId.toString(), 10);
const rpcNode: string | undefined = sample(NETWORKS_SUPPORTED.rpc);
if (!rpcNode) throw Error("One RPC node is not configured");

export const injected: InjectedConnector = new InjectedConnector({
  supportedChainIds: [chainId],
});

export const walletconnect: WalletConnectConnector = new WalletConnectConnector(
  {
    rpc: {
      [chainId]: rpcNode,
    },
    qrcode: true,
  }
);

export const connectorByNames: {
  [name: string]: InjectedConnector | WalletConnectConnector;
} = {
  injected,
  walletconnect,
};

export const simpleRpcProvider: StaticJsonRpcProvider =
  new StaticJsonRpcProvider(rpcNode);

export const setupDefaultNetwork = async () => {
  const provider = window.ethereum;
  if (provider) {
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: "Binance Smart Chain",
            nativeCurrency: {
              name: "BNB",
              symbol: "bnb",
              decimals: 18,
            },
            rpcUrls: [rpcNode],
          },
        ],
      });
      return true;
    } catch (error) {
      console.error("Failed to setup the network in Metamask:", error);
      return false;
    }
  } else {
    console.error(
      "Can't setup the BSC network on metamask because window.ethereum is undefined"
    );
    return false;
  }
};
