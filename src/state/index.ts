import {
  BASES_TO_CHECK_TRADES_AGAINST,
  BETTER_TRADE_LESS_HOPS_THRESHOLD,
  CUSTOM_BASES,
  FACTORY_ADDRESSES,
  MAX_TRADE_HOPS,
  ONE_HUNDRED_PERCENT,
  ZERO_PERCENT,
} from "@/configs/networks";
import {
  getERC20Contract,
  getMulticallContract,
  getPairContract,
} from "@/hooks/useContract";
import {
  getMultipleContractMultipleData,
  getSingleContractMultipleData,
  getSingleContractMultipleDataMultipleMethods,
} from "@/utils/muticall";
import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import {
  Currency,
  CurrencyAmount,
  currencyEquals,
  JSBI,
  Pair,
  Percent,
  Token,
  TokenAmount,
  Trade,
} from "@uniswap/sdk";
import {
  computePairAddress,
  isAddress,
  removeNumericKey,
  wrappedCurrency,
} from "../utils";
import flatMap from "lodash/flatMap";

/**
 * Returns a map of the given addresses to their eventually consistent BNB balances.
 */
export const getBNBBalances = async (
  chainId: number,
  library: Web3Provider,
  uncheckedAddresses?: (string | undefined | null)[]
): Promise<{
  [address: string]: CurrencyAmount | undefined;
}> => {
  const multicallContract = await getMulticallContract(chainId, library);
  const addresses: string[] = uncheckedAddresses
    ? uncheckedAddresses
        .map(isAddress)
        .filter((a): a is string => a !== false)
        .sort()
    : [];
  const results = await getSingleContractMultipleData(
    chainId,
    library,
    multicallContract,
    "getEthBalance",
    addresses.map((address) => [address])
  );
  return addresses.reduce<{ [address: string]: CurrencyAmount }>(
    (memo, address, i) => {
      const value = results?.[i];
      if (value) memo[address] = CurrencyAmount.ether(JSBI.BigInt(value + ""));
      return memo;
    },
    {}
  );
};

/**
 * Returns a map of the given addresses to their eventually consistent token balances.
 */
export const getTokenBalances = async (
  chainId: number,
  account: string,
  library: Web3Provider,
  tokens: Token[]
): Promise<{
  [address: string]: TokenAmount | undefined;
}> => {
  try {
    const tokenContracts = tokens.map((token) =>
      getERC20Contract(token.address, library)
    );
    const results = await getMultipleContractMultipleData(
      chainId,
      library,
      tokenContracts,
      "balanceOf",
      tokenContracts.map((_) => [account])
    );

    return tokens.reduce<{ [address: string]: TokenAmount }>(
      (memo, token, i) => {
        const value = results?.[i][0];
        if (value)
          memo[token.address] = new TokenAmount(token, JSBI.BigInt(value + ""));
        return memo;
      },
      {}
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Returns pair info
 */
export const getPairInfo = async (
  chainId: number,
  library: Web3Provider,
  account: string,
  pairContract: Contract
) => {
  try {
    const methodNames = [
      "token0",
      "token1",
      "getReserves",
      "balanceOf",
      "totalSupply",
    ];
    const results = await getSingleContractMultipleDataMultipleMethods(
      chainId,
      library,
      pairContract,
      methodNames,
      [[], [], [], [account], []]
    );
    return methodNames.reduce<{ [address: string]: any }>((memo, method, i) => {
      const value = results?.[i][0];
      // console.log("value + ", value + "");
      if (value) {
        if (i !== 2) memo[method] = value + "";
        else memo = { ...memo, ...removeNumericKey(results[i]) };
      }
      return memo;
    }, {});
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export enum PairState {
  LOADING = 0,
  NOT_EXISTS = 1,
  EXISTS = 2,
  INVALID = 3,
}

export const getPairs = async (
  chainId: number,
  library: Web3Provider,
  currencies: Token[][]
) => {
  const tokens = currencies.map(([currencyA, currencyB]) => [
    wrappedCurrency(currencyA, chainId),
    wrappedCurrency(currencyB, chainId),
  ]);

  const pairAddresses = tokens.map(([tokenA, tokenB]) => {
    return chainId && tokenA && tokenB && !tokenA.equals(tokenB)
      ? computePairAddress({
          chainId,
          factoryAddress: FACTORY_ADDRESSES[chainId],
          tokenA,
          tokenB,
        })
      : undefined;
  });
  const pairContracts = pairAddresses
    .filter((pair) => !!pair)
    .map((pair) => getPairContract(pair as string, library));

  const results = await getMultipleContractMultipleData(
    chainId,
    library,
    pairContracts,
    "getReserves",
    pairContracts.map((_) => [])
  );

  if (!results) return [];

  return results.map((reserves, i) => {
    const tokenA = tokens[i][0];
    const tokenB = tokens[i][1];
    if (!tokenA || !tokenB || tokenA.equals(tokenB))
      return [PairState.INVALID, null];
    if (!reserves) return [PairState.NOT_EXISTS, null];
    const { reserve0, reserve1 } = reserves;
    const [token0, token1] = tokenA.sortsBefore(tokenB)
      ? [tokenA, tokenB]
      : [tokenB, tokenA];
    return [
      PairState.EXISTS,
      new Pair(
        new TokenAmount(token0, reserve0.toString()),
        new TokenAmount(token1, reserve1.toString())
      ),
    ];
  });
};

export const getAllCommonPairs = async (
  chainId: number | undefined,
  library: Web3Provider | null | undefined,
  currencyA: Token | undefined,
  currencyB: Token | undefined
): Promise<Pair[]> => {
  if (!chainId || !library) return [];
  const [tokenA, tokenB] = chainId
    ? [
        // wrappedCurrency(currencyA, chainId),
        // wrappedCurrency(currencyB, chainId),
        currencyA,
        currencyB,
      ]
    : [undefined, undefined];
  if (!tokenA || !tokenB) return [];

  const bases =
    chainId && BASES_TO_CHECK_TRADES_AGAINST[chainId]
      ? BASES_TO_CHECK_TRADES_AGAINST[chainId]
      : [];

  const basePairs = flatMap(bases, (base) =>
    bases.map((otherBase) => [base, otherBase])
  ).filter(([t0, t1]) => t0.address !== t1.address);

  const allPairCombinations: Token[][] =
    tokenA && tokenB
      ? [
          // the direct pair
          [tokenA, tokenB],
          // token A against all bases
          ...bases.map((base): [Token, Token] => [tokenA, base]),
          // token B against all bases
          ...bases.map((base): [Token, Token] => [tokenB, base]),
          // each base against all bases
          ...basePairs,
        ]
          .filter((tokens) => Boolean(tokens[0] && tokens[1]))
          .filter(([t0, t1]) => t0.address !== t1.address)
          .filter(([tokenA, tokenB]) => {
            if (!chainId) return true;
            const customBases = CUSTOM_BASES[chainId];
            if (!customBases) return true;

            const customBasesA = customBases[tokenA.address];
            const customBasesB = customBases[tokenB.address];

            if (!customBasesA && !customBasesB) return true;

            if (
              customBasesA &&
              !customBasesA.find((base) => tokenB.equals(base))
            )
              return false;
            if (
              customBasesB &&
              !customBasesB.find((base) => tokenA.equals(base))
            )
              return false;

            return true;
          })
      : [];

  const allPairs = await getPairs(chainId, library, allPairCombinations);

  return Object.values(
    allPairs
      // filter out invalid pairs
      .filter((result): result is [PairState.EXISTS, Pair] =>
        Boolean(result[0] === PairState.EXISTS && result[1])
      )
      // filter out duplicated pairs
      .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
        memo[curr.liquidityToken.address] =
          memo[curr.liquidityToken.address] ?? curr;
        return memo;
      }, {})
  );
};

// returns whether tradeB is better than tradeA by at least a threshold percentage amount
export function isTradeBetter(
  tradeA: Trade | undefined | null,
  tradeB: Trade | undefined | null,
  minimumDelta: Percent = ZERO_PERCENT
): boolean | undefined {
  if (tradeA && !tradeB) return false;
  if (tradeB && !tradeA) return true;
  if (!tradeA || !tradeB) return undefined;

  if (
    tradeA.tradeType !== tradeB.tradeType ||
    !currencyEquals(tradeA.inputAmount.currency, tradeB.inputAmount.currency) ||
    !currencyEquals(tradeA.outputAmount.currency, tradeB.outputAmount.currency)
  ) {
    throw new Error("Trades are not comparable");
  }

  if (minimumDelta.equalTo(ZERO_PERCENT)) {
    return tradeA.executionPrice.lessThan(tradeB.executionPrice);
  }
  return tradeA.executionPrice.raw
    .multiply(minimumDelta.add(ONE_HUNDRED_PERCENT))
    .lessThan(tradeB.executionPrice);
}

export const getTradeExactIn = async (
  chainId: number,
  library: Web3Provider,
  currencyA: Token,
  currencyB: Token,
  currencyAmountIn: TokenAmount | CurrencyAmount,
  currencyOut: Token,
  singleHopOnly: boolean = true
): Promise<Trade | null> => {
  const allowedPairs = await getAllCommonPairs(
    chainId,
    library,
    currencyA,
    currencyB
  );
  if (!allowedPairs.length) return null;

  if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
    if (singleHopOnly) {
      return (
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, {
          maxHops: 1,
          maxNumResults: 1,
        })[0] ?? null
      );
    }
    // search through trades with varying hops, find best trade out of them
    let bestTradeSoFar = null;
    for (let i = 1; i <= MAX_TRADE_HOPS; i++) {
      const currentTrade =
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, {
          maxHops: i,
          maxNumResults: 1,
        })[0] ?? null;
      // if current trade is best yet, save it
      if (
        isTradeBetter(
          bestTradeSoFar,
          currentTrade,
          BETTER_TRADE_LESS_HOPS_THRESHOLD
        )
      ) {
        bestTradeSoFar = currentTrade;
      }
    }
    return bestTradeSoFar;
  }
  return null;
};

export const getTradeExactOut = async (
  chainId: number,
  library: Web3Provider,
  currencyA: Token,
  currencyB: Token,
  currencyAmountOut: TokenAmount | CurrencyAmount,
  currencyIn: Token,
  singleHopOnly: boolean
): Promise<Trade | null> => {
  const allowedPairs = await getAllCommonPairs(
    chainId,
    library,
    currencyA,
    currencyB
  );
  if (!allowedPairs.length) return null;

  if (currencyAmountOut && currencyIn && allowedPairs.length > 0) {
    if (singleHopOnly) {
      return (
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, {
          maxHops: 1,
          maxNumResults: 1,
        })[0] ?? null
      );
    }
    // search through trades with varying hops, find best trade out of them
    let bestTradeSoFar = null;
    for (let i = 1; i <= MAX_TRADE_HOPS; i++) {
      const currentTrade =
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, {
          maxHops: i,
          maxNumResults: 1,
        })[0] ?? null;
      // if current trade is best yet, save it
      if (
        isTradeBetter(
          bestTradeSoFar,
          currentTrade,
          BETTER_TRADE_LESS_HOPS_THRESHOLD
        )
      ) {
        bestTradeSoFar = currentTrade;
      }
    }
    return bestTradeSoFar;
  }
  return null;
};
