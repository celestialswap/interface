import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import sample from "lodash/sample";
import { RPC_CHAIN_ID, RPC_NODES } from "@/configs/constants";

declare var window: any;
if (!RPC_CHAIN_ID) throw Error("RPC chainId is not configured");
const chainId: number = parseInt(RPC_CHAIN_ID.toString(), 10);
const rpcNode: string | undefined = sample(NETWORKS_SUPPORTED.bsc_testnet.rpc);
if (!rpcNode) throw Error("One RPC node is not configured");

import { CHAIN_IDS_SUPPORTED, NETWORKS_SUPPORTED } from "@/configs/networks";

export const injected: InjectedConnector = new InjectedConnector({
  supportedChainIds: [...CHAIN_IDS_SUPPORTED],
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
