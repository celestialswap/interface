import { JSBI, Percent, Token } from "@uniswap/sdk";

export interface Network {
  name: string;
  chainId: number;
  rpc: string[];
}

export const NETWORKS_SUPPORTED: Network = {
  name: "Binance Smart Chain Testnet",
  chainId: 97,
  rpc: ["https://data-seed-prebsc-1-s2.binance.org:8545/"],
};

export const WETH: Token = new Token(
  NETWORKS_SUPPORTED.chainId,
  "0xae13d989dac2f0debff460ac112a837c89baa7cd",
  18,
  "WBNB",
  "WBNB"
);

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: Token[] = [WETH];

export const CUSTOM_BASES: { [address: string]: Token[] } = {};

export const TOKEN_LIST: Token[] = [
  WETH,
  new Token(
    NETWORKS_SUPPORTED.chainId,
    "0x8C8147156799CCf40454DAbB31eDbb0FAa8B7394",
    18,
    "TEST1",
    "Token1"
  ),
  new Token(
    NETWORKS_SUPPORTED.chainId,
    "0x7eafdf1ce07988b1f58deb017ad1e1aabe215ee4",
    18,
    "TEST2",
    "Token2"
  ),
  new Token(
    NETWORKS_SUPPORTED.chainId,
    "0x86E009Af3B3A64A3FA1A4f1bD23C000156D8ae8D",
    18,
    "TEST3",
    "Token3"
  ),
];

export const MULTICALL_ADDRESS: string =
  "0xB9Dc10D9532f5103bDE775e11861AF6C66fEa564";

export const FACTORY_ADDRESS: string =
  "0x4a565E356d82D3F51B469902BA78922D2cd88b78";

export const ROUTER_ADDRESS: string =
  "0x85a668dd0F2d1859777e84df885bfD1Bb87ec19A";

export const INIT_CODE_HASH: string =
  "0xaae7dc513491fb17b541bd4a9953285ddf2bb20a773374baecc88c4ebada0767";

export const MASTER_CHIEF_ADDRESS =
  "0x45b6bF33BF2135300DEa1BFf95D5B6D8b0a8cDBB";

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
export const FIVE_PERCENT = new Percent(JSBI.BigInt(5), JSBI.BigInt(100));
export const SWAP_FEE_PERCENT = new Percent(JSBI.BigInt(97), JSBI.BigInt(100));

export const BIPS_BASE = JSBI.BigInt(10000);
