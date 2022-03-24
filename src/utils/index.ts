import {
  JsonRpcSigner,
  Provider,
  Web3Provider,
} from "@ethersproject/providers";
import { getAddress, getCreate2Address } from "@ethersproject/address";
import { AddressZero } from "@ethersproject/constants";
import { simpleRpcProvider } from "./web3React";
import { Contract } from "@ethersproject/contracts";
import type { Signer } from "@ethersproject/abstract-signer";
import {
  Currency,
  ETHER,
  SwapParameters,
  Token,
  TokenAmount,
  Trade,
  TradeOptions,
  TradeOptionsDeadline,
  TradeType,
} from "@uniswap/sdk";
import { pack, keccak256 } from "@ethersproject/solidity";
import { INIT_CODE_HASH, WETH } from "@/configs/networks";
import invariant from "tiny-invariant";
import { validateAndParseAddress } from "@uniswap/sdk-core";

export const formatAddress = (account: string) => {
  const length = account.length;
  return length > 12
    ? `${account.slice(0, 7)}...${account.slice(length - 5, length)}`
    : account;
};

export const removeNumericKey = (object: { [key: string]: any }) => {
  let obj = { ...object };
  for (let key in obj) {
    if (!Number.isNaN(+key)) {
      delete obj[key];
    }
  }
  return obj;
};

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

// account is not optional
export function getSigner(
  library: Web3Provider,
  account: string
): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked();
}

// account is optional
export function getProviderOrSigner(
  library: Web3Provider,
  account?: string
): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library;
}

// account is optional
export function getContract(
  address: string,
  ABI: any,
  library: Web3Provider,
  account?: string
): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account));
}

export const computePairAddress = ({
  chainId,
  factoryAddress,
  tokenA,
  tokenB,
}: {
  chainId: number;
  factoryAddress: string;
  tokenA: Token;
  tokenB: Token;
}): string => {
  if (!INIT_CODE_HASH[chainId]) return "";
  const [token0, token1] = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks
  return getCreate2Address(
    factoryAddress,
    keccak256(
      ["bytes"],
      [pack(["address", "address"], [token0.address, token1.address])]
    ),
    INIT_CODE_HASH[chainId]
  );
};

export const wrappedCurrency = (
  currency: Token | undefined,
  chainId: number | undefined
): Token | undefined => {
  return chainId && currency instanceof Token ? currency : undefined;
};

const ZERO_HEX = "0x0";

export const swapCallParameters = (
  chainId: number,
  trade: Trade & {
    inputAmount: {
      currency: Token;
    };
    outputAmount: {
      currency: Token;
    };
  },
  options: TradeOptions | TradeOptionsDeadline
): SwapParameters => {
  const etherIn = trade.inputAmount.currency.address === WETH[chainId].address;
  const etherOut =
    trade.outputAmount.currency.address === WETH[chainId].address;
  // the router does not support both ether in and out
  invariant(!(etherIn && etherOut), "ETHER_IN_OUT");
  invariant(!("ttl" in options) || options.ttl > 0, "TTL");

  const to: string = validateAndParseAddress(options.recipient);
  const amountIn: string = trade
    .maximumAmountIn(options.allowedSlippage)
    .raw.toString();
  const amountOut: string = trade
    .minimumAmountOut(options.allowedSlippage)
    .raw.toString();
  const path: string[] = trade.route.path.map((token: Token) => token.address);
  const deadline =
    "ttl" in options
      ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(
          16
        )}`
      : `0x${options.deadline.toString(16)}`;

  const useFeeOnTransfer = Boolean(options.feeOnTransfer);

  let methodName: string;
  let args: (string | string[])[];
  let value: string;
  switch (trade.tradeType) {
    case TradeType.EXACT_INPUT:
      if (etherIn) {
        methodName = useFeeOnTransfer
          ? "swapExactETHForTokensSupportingFeeOnTransferTokens"
          : "swapExactETHForTokens";
        // (uint amountOutMin, address[] calldata path, address to, uint deadline)
        args = [amountOut, path, to, deadline];
        value = amountIn;
      } else if (etherOut) {
        methodName = useFeeOnTransfer
          ? "swapExactTokensForETHSupportingFeeOnTransferTokens"
          : "swapExactTokensForETH";
        // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        args = [amountIn, amountOut, path, to, deadline];
        value = ZERO_HEX;
      } else {
        methodName = useFeeOnTransfer
          ? "swapExactTokensForTokensSupportingFeeOnTransferTokens"
          : "swapExactTokensForTokens";
        // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        args = [amountIn, amountOut, path, to, deadline];
        value = ZERO_HEX;
      }
      break;
    case TradeType.EXACT_OUTPUT:
      invariant(!useFeeOnTransfer, "EXACT_OUT_FOT");
      if (etherIn) {
        methodName = "swapETHForExactTokens";
        // (uint amountOut, address[] calldata path, address to, uint deadline)
        args = [amountOut, path, to, deadline];
        value = amountIn;
      } else if (etherOut) {
        methodName = "swapTokensForExactETH";
        // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        args = [amountOut, amountIn, path, to, deadline];
        value = ZERO_HEX;
      } else {
        methodName = "swapTokensForExactTokens";
        // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        args = [amountOut, amountIn, path, to, deadline];
        value = ZERO_HEX;
      }
      break;
  }
  return {
    methodName,
    args,
    value,
  };
};
