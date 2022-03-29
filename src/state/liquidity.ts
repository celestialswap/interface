import {
  FACTORY_ADDRESS,
  Field,
  ROUTER_ADDRESS,
  WETH,
} from "@/configs/networks";
import {
  callContract,
  getERC20Contract,
  getFactoryContract,
  getPairContract,
  getRouterContract,
} from "@/hooks/useContract";
import { getSingleContractMultipleDataMultipleMethods } from "@/utils/muticall";
import { BigNumber } from "@ethersproject/bignumber";
import { Zero } from "@ethersproject/constants";
import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import {
  CurrencyAmount,
  Pair,
  Percent,
  Price,
  Token,
  TokenAmount,
} from "@uniswap/sdk";
import { getBNBBalances, getPairInfo, getTokenBalances } from "state";
import { computePairAddress } from "../utils";

export const getCurrencyBalances = async (
  chainId: number,
  account: string,
  library: Web3Provider,
  currencies: (Token | undefined)[]
): Promise<(TokenAmount | CurrencyAmount | undefined)[] | undefined> => {
  try {
    if (!currencies.filter((currency) => !!currency).length) return undefined;
    const tokens =
      currencies?.filter(
        (currency): currency is Token =>
          currency instanceof Token && !currency.equals(WETH)
      ) ?? [];
    const containsBNB: boolean = !chainId
      ? false
      : currencies?.some((currency) => currency === WETH) ?? false;
    const ethBalance = await getBNBBalances(
      chainId,
      library,
      containsBNB ? [account] : []
    );
    const tokenBalances = await getTokenBalances(
      chainId,
      account,
      library,
      tokens
    );
    return (
      currencies?.map((currency) => {
        if (!account || !currency || !chainId) return undefined;
        if (currency === WETH) return ethBalance[account];
        if (currency instanceof Token) return tokenBalances[currency.address];
        return undefined;
      }) ?? []
    );
  } catch (error) {
    throw error;
  }
};

export interface PoolState {
  pair?: Pair | undefined;
  inputIsToken0?: boolean;
  prices: {
    [key in Field]: Price | undefined;
  };
  shareOfPool: Percent | undefined;
  totalSupply: TokenAmount | CurrencyAmount | undefined;
  balanceOf?: TokenAmount | CurrencyAmount | undefined;
  noLiquidity?: boolean;
}

export const EmptyPool: PoolState = {
  pair: undefined,
  inputIsToken0: true,
  prices: {
    [Field.INPUT]: undefined,
    [Field.OUTPUT]: undefined,
  },
  shareOfPool: undefined,
  totalSupply: undefined,
  noLiquidity: true,
};

export const getPoolInfo = async (
  chainId: number,
  account: string,
  library: Web3Provider,
  currencies: (Token | undefined)[]
): Promise<PoolState | undefined> => {
  if (!WETH || !FACTORY_ADDRESS) return undefined;
  const [tokenA, tokenB] = currencies;
  if (!tokenA || !tokenB || tokenA.equals(tokenB)) return undefined;
  const computePair = computePairAddress({
    factoryAddress: FACTORY_ADDRESS,
    tokenA,
    tokenB,
  });
  if (!computePair) return EmptyPool;
  const pairContract = getPairContract(computePair, library);
  try {
    await pairContract?.getReserves();
  } catch (error) {
    return EmptyPool;
  }
  const pairInfo = await getPairInfo(chainId, library, account, pairContract);
  if (!pairInfo) return EmptyPool;
  const { token0, reserve0, reserve1, balanceOf, totalSupply } = pairInfo;
  const isTokenA0 = tokenA.address === token0;
  const pair = new Pair(
    new TokenAmount(isTokenA0 ? tokenA : tokenB, reserve0),
    new TokenAmount(isTokenA0 ? tokenB : tokenA, reserve1)
  );
  const price01 = new Price(
    isTokenA0 ? tokenA : tokenB,
    isTokenA0 ? tokenB : tokenA,
    reserve0,
    reserve1
  );
  const price10 = new Price(
    isTokenA0 ? tokenB : tokenA,
    isTokenA0 ? tokenA : tokenB,
    reserve1,
    reserve0
  );
  const prices = {
    [Field.INPUT]: price01,
    [Field.OUTPUT]: price10,
  };

  return {
    pair,
    inputIsToken0: isTokenA0,
    prices,
    shareOfPool: new Percent(balanceOf, totalSupply),
    totalSupply: new TokenAmount(pair.liquidityToken, totalSupply),
    noLiquidity: false,
  };
};
export const addLiquidityCallback = async (
  account: string | null | undefined,
  library: Web3Provider | null,
  tokens: {
    [Field.INPUT]: Token | undefined;
    [Field.OUTPUT]: Token | undefined;
  },
  amounts: {
    [Field.INPUT]: TokenAmount | undefined;
    [Field.OUTPUT]: TokenAmount | undefined;
  }
) => {
  try {
    if (
      !account ||
      !library ||
      [tokens, amounts].some((e) => !e[Field.INPUT] || !e[Field.OUTPUT])
    )
      return;

    const routerContract = getRouterContract(library, account);

    let args,
      overrides = {},
      methodName: string = "";

    // addLiquidityETH
    if (
      tokens[Field.INPUT]?.equals(WETH) ||
      tokens[Field.OUTPUT]?.equals(WETH)
    ) {
      methodName = "addLiquidityETH";
      const inputIsETH = tokens[Field.INPUT]?.equals(WETH);
      args = [
        (inputIsETH
          ? tokens[Field.OUTPUT]?.address
          : tokens[Field.INPUT]?.address) ?? "", // token
        (inputIsETH
          ? amounts[Field.OUTPUT]?.raw.toString()
          : amounts[Field.INPUT]?.raw.toString()) ?? 0, // token amount
        0, // token min
        0, // eth min
        account,
        Math.floor(Date.now() / 1000) + 30 * 60, // TODO deadline of user's settings
      ];
      overrides = {
        value: inputIsETH
          ? amounts[Field.INPUT]?.raw.toString()
          : amounts[Field.OUTPUT]?.raw.toString(),
      };
    } else {
      // addLiquidity
      methodName = "addLiquidity";
      args = [
        tokens[Field.INPUT]?.address ?? "", // token0
        tokens[Field.OUTPUT]?.address ?? "", // token1
        amounts[Field.INPUT]?.raw.toString() ?? 0, // token0 amount
        amounts[Field.OUTPUT]?.raw.toString() ?? 0, // token1 amount
        0, // token0 min
        0, // token1 min
        account,
        Math.floor(Date.now() / 1000) + 30 * 60, // TODO deadline of user's settings
      ];
    }
    return callContract(routerContract, methodName, args, overrides);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getOwnerLiquidityPools = async (
  chainId: number | undefined,
  library: Web3Provider | undefined,
  account: string | null | undefined
): Promise<(PoolState | undefined)[]> => {
  try {
    if (!chainId || !library || !account) return [];

    const factoryContract = getFactoryContract(library);
    const allPairsLength = await callContract(
      factoryContract,
      "allPairsLength",
      []
    );
    const allPairs = await Promise.all(
      new Array(+allPairsLength.toString())
        .fill("")
        .map((_, i) => callContract(factoryContract, "allPairs", [i]))
    );

    const pairContracts = allPairs.map((pair) =>
      getPairContract(pair, library)
    );

    // TODO call with multicall
    // const methodNames = ["token0", "token1"];
    // const results = await getMultipleContractMultipleDataMultipleMethods(
    //   chainId,
    //   library,
    //   pairContracts,
    //   methodNames,
    //   methodNames.map((_) => [])
    // );
    // console.log(pairContracts);
    let ownerPairsContracts: Contract[] = [];
    await Promise.all(
      pairContracts.map(async (pair) => {
        const balanceOf = await callContract(pair, "balanceOf", [account]);
        BigNumber.from(balanceOf).gt(BigNumber.from("0")) &&
          ownerPairsContracts.push(pair);
      })
    );

    const results = await Promise.all(
      ownerPairsContracts.map(async (pair) => {
        const [token0, token1, reserves, totalSupply, balanceOf] =
          await Promise.all([
            callContract(pair, "token0", []),
            callContract(pair, "token1", []),
            callContract(pair, "getReserves", []),
            callContract(pair, "totalSupply", []),
            callContract(pair, "balanceOf", [account]),
          ]);

        const { reserve0, reserve1 } = reserves;
        const [_token0, _token1] = await Promise.all(
          [token0, token1].map(async (token) => {
            const erc20Contract = getERC20Contract(token, library);
            const erc20Methods = ["name", "symbol", "decimals"];
            const results = await getSingleContractMultipleDataMultipleMethods(
              chainId,
              library,
              erc20Contract,
              erc20Methods,
              erc20Methods.map((_) => [])
            );
            if (!results?.length) return;
            const _token = results.reduce((memo, result, i) => {
              if (result?.[0]) memo[erc20Methods[i]] = result[0];
              return memo;
            }, {});
            if (
              Array.from(
                new Set([...Object.keys(_token), ...erc20Methods]).values()
              ).length !== erc20Methods.length
            )
              return;

            return new Token(
              chainId,
              token,
              _token["decimals"],
              _token["symbol"],
              _token["name"]
            );
          })
        );
        if (!_token0 || !_token1) return;

        const _pair = new Pair(
          new TokenAmount(_token0, reserve0),
          new TokenAmount(_token1, reserve1)
        );
        const price01 = new Price(_token0, _token1, reserve0, reserve1);
        const price10 = new Price(_token1, _token0, reserve1, reserve0);
        const prices = {
          [Field.INPUT]: price01,
          [Field.OUTPUT]: price10,
        };

        return {
          pair: _pair,
          totalSupply: new TokenAmount(_pair.liquidityToken, totalSupply),
          balanceOf: new TokenAmount(_pair.liquidityToken, balanceOf),
          prices,
          shareOfPool: new Percent(balanceOf, totalSupply),
        };
      })
    );
    return results;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const removeLiquidityCallback = async (
  chainId: number | undefined,
  account: string | null | undefined,
  library: Web3Provider | null,
  pair: Pair,
  removeAmount: BigNumber
) => {
  try {
    if (
      !chainId ||
      !account ||
      !library ||
      !WETH ||
      removeAmount.lte(BigNumber.from("0"))
    )
      return;
    let token0: Token, token1: Token;
    [token0, token1] = [pair.token0, pair.token1];

    const routerContract = getRouterContract(library, account);

    const deadline = Math.floor(Date.now() / 1000) + 30 * 60;

    let args,
      overrides = {},
      methodName: string = "";

    // removeLiquidityETH
    if (token0.equals(WETH) || token1.equals(WETH)) {
      methodName = "removeLiquidityETH";
      const token0IsETH = token0.equals(WETH);
      args = [
        (token0IsETH ? token1.address : token0.address) ?? "", // token
        removeAmount.toString(), // liquidity remove
        0, // token min
        0, // eth min
        account,
        deadline, // TODO deadline of user's settings
      ];
    } else {
      // removeLiquidity
      methodName = "removeLiquidity";
      args = [
        token0.address ?? "", // token0
        token1.address ?? "", // token1
        removeAmount.toString(), // liquidity remove
        0, // token0 min
        0, // token1 min
        account,
        deadline, // TODO deadline of user's settings
      ];
    }
    const _pair = computePairAddress({
      factoryAddress: FACTORY_ADDRESS,
      tokenA: token0,
      tokenB: token1,
    });
    const pairContract = getPairContract(_pair, library, account);
    await callContract(pairContract, "approve", [ROUTER_ADDRESS, removeAmount]);
    return callContract(routerContract, methodName, args, overrides);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
