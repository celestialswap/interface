import { ChainId, JSBI, Percent, Token } from "@uniswap/sdk";

export interface Network {
  name: string;
  chainId: number;
  rpc: string[];
}

export const NETWORKS_SUPPORTED: { [key: string]: Network } = {
  bsc_testnet: {
    name: "Binance Smart Chain Testnet",
    chainId: 97,
    rpc: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  },
};

export const CHAIN_IDS_SUPPORTED: number[] = [
  NETWORKS_SUPPORTED.bsc_testnet.chainId,
];

export const WETH: { [key: number]: Token } = {
  [NETWORKS_SUPPORTED.bsc_testnet.chainId]: new Token(
    NETWORKS_SUPPORTED.bsc_testnet.chainId,
    "0xae13d989dac2f0debff460ac112a837c89baa7cd",
    18,
    "BNB",
    "BNB"
  ),
};

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: { [key: number]: Token[] } = {
  [NETWORKS_SUPPORTED.bsc_testnet.chainId]: [
    WETH[NETWORKS_SUPPORTED.bsc_testnet.chainId],
  ],
};

export const CUSTOM_BASES: { [key: string]: { [key: string]: Token[] } } = {
  [NETWORKS_SUPPORTED.bsc_testnet.chainId]: {},
};

export const TOKEN_LIST: { [key: number]: Token[] } = {
  [NETWORKS_SUPPORTED.bsc_testnet.chainId]: [
    WETH[NETWORKS_SUPPORTED.bsc_testnet.chainId],
    new Token(
      NETWORKS_SUPPORTED.bsc_testnet.chainId,
      "0x8C8147156799CCf40454DAbB31eDbb0FAa8B7394",
      18,
      "TEST1",
      "Token1"
    ),
    new Token(
      NETWORKS_SUPPORTED.bsc_testnet.chainId,
      "0x7eafdf1ce07988b1f58deb017ad1e1aabe215ee4",
      18,
      "TEST2",
      "Token2"
    ),
    new Token(
      NETWORKS_SUPPORTED.bsc_testnet.chainId,
      "0x86E009Af3B3A64A3FA1A4f1bD23C000156D8ae8D",
      18,
      "TEST3",
      "Token3"
    ),
  ],
};

export const MULTICALL_ADDRESSES: { [key: number]: string } = {
  [NETWORKS_SUPPORTED.bsc_testnet.chainId]:
    "0xB9Dc10D9532f5103bDE775e11861AF6C66fEa564",
};

export const FACTORY_ADDRESSES: { [key: number]: string } = {
  [NETWORKS_SUPPORTED.bsc_testnet.chainId]:
    "0x4a565E356d82D3F51B469902BA78922D2cd88b78",
};

export const ROUTER_ADDRESSES: { [key: number]: string } = {
  [NETWORKS_SUPPORTED.bsc_testnet.chainId]:
    "0x85a668dd0F2d1859777e84df885bfD1Bb87ec19A",
};

export const INIT_CODE_HASH: { [key: number]: string } = {
  [NETWORKS_SUPPORTED.bsc_testnet.chainId]:
    "0xaae7dc513491fb17b541bd4a9953285ddf2bb20a773374baecc88c4ebada0767",
};

export enum Field {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
}

export const MAX_TRADE_HOPS: number = 3;

export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(
  JSBI.BigInt(50),
  JSBI.BigInt(10000)
);

export const ZERO_PERCENT = new Percent("0");
export const ONE_HUNDRED_PERCENT = new Percent("1");

export const BIPS_BASE = JSBI.BigInt(10000);
