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
    "0x51Ba566222d88996658c39CBe38e17efa84b69e5",
    18,
    "USDC",
    "USDC"
  ),
  new Token(
    NETWORKS_SUPPORTED.chainId,
    "0xB6d64fcA199893409EbE8b90b8d54aa3aCb02d86",
    18,
    "USDT",
    "USDT"
  ),
  new Token(
    NETWORKS_SUPPORTED.chainId,
    "0x87Bc2d3a2eDBbE8Df5f6929Be15A4A87879Aa5FB",
    18,
    "DAI",
    "DAI"
  ),
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

export const BUNDLE_ID = "1";

export const timeframeOptions = {
  WEEK: "1 week",
  MONTH: "1 month",
  // THREE_MONTHS: '3 months',
  // YEAR: '1 year',
  HALF_YEAR: "6 months",
  ALL_TIME: "All time",
};

// token list urls to fetch tokens from - use for warnings on tokens and pairs
export const SUPPORTED_LIST_URLS__NO_ENS = [
  "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
  "https://www.coingecko.com/tokens_list/uniswap/defi_100/v_0_0_0.json",
];

// hide from overview list
export const TOKEN_BLACKLIST = [];

// pair blacklist
export const PAIR_BLACKLIST = [];

// warnings to display if page contains info about blocked token
export const BLOCKED_WARNINGS = {
  "0xf4eda77f0b455a12f3eb44f8653835f377e36b76":
    "TikTok Inc. has asserted this token is violating its trademarks and therefore is not available.",
};

/**
 * For tokens that cause erros on fee calculations
 */
export const FEE_WARNING_TOKENS = [];

export const UNTRACKED_COPY =
  "Derived USD values may be inaccurate without liquid stablecoin or ETH pairings.";

// pairs that should be tracked but arent due to lag in subgraph
export const TRACKED_OVERRIDES_PAIRS = [];

// tokens that should be tracked but arent due to lag in subgraph
// all pairs that include token will be tracked
export const TRACKED_OVERRIDES_TOKENS = [];
