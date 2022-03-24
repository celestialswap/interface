import { WETH } from "@/configs/networks";
import { callContract, getERC20Contract } from "@/hooks/useContract";
import { getMultipleContractMultipleData } from "@/utils/muticall";
import { BigNumber } from "@ethersproject/bignumber";
import { MaxUint256 } from "@ethersproject/constants";
import { Web3Provider } from "@ethersproject/providers";
import { Token, TokenAmount } from "@uniswap/sdk";
import { CurrencyAmount } from "@uniswap/sdk-core";

export const getAllowances = async (
  chainId: number,
  library: Web3Provider,
  owner: string,
  spender: string,
  tokens: (Token | undefined)[],
  amounts: (TokenAmount | undefined)[]
): Promise<Token[]> => {
  try {
    if (tokens.every((token) => !token)) return [];
    const onlyTokens = tokens.filter(
      (token) => typeof token !== "undefined" && !token.equals(WETH[chainId])
    );
    const onlyTokenAmounts = amounts.filter(
      (_, i) =>
        typeof tokens[i]?.address !== "undefined" &&
        !tokens?.[i]?.equals(WETH[chainId])
    );
    const erc20Contracts = onlyTokens.map((token) =>
      token?.address
        ? getERC20Contract(token?.address as any, library)
        : undefined
    );
    const results = await getMultipleContractMultipleData(
      chainId,
      library,
      erc20Contracts,
      "allowance",
      onlyTokens.map((_) => [owner, spender])
    );
    if (!results) return [];
    return results.reduce((memo, result, i) => {
      const value = result?.[0];
      if (
        (value && BigNumber.from(value.toString()).eq(BigNumber.from("0"))) ||
        (typeof onlyTokenAmounts[i]?.raw?.toString() !== "undefined" &&
          BigNumber.from(value.toString()).lt(
            BigNumber.from(onlyTokenAmounts[i]?.raw?.toString())
          ))
      ) {
        memo.push(onlyTokens[i]);
      }
      return memo;
    }, []);
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const approves = async (
  chainId: number,
  library: Web3Provider,
  account: string,
  spender: string,
  tokens: Token[]
): Promise<boolean> => {
  try {
    const onlyTokens = tokens.filter(
      (token) => typeof token !== "undefined" && !token.equals(WETH[chainId])
    );
    if (!onlyTokens.length) return true;
    const erc20Contracts = tokens.map((token) =>
      token?.address
        ? getERC20Contract(token?.address as any, library, account)
        : undefined
    );
    await Promise.all(
      erc20Contracts.map((contract) =>
        contract
          ? callContract(contract, "approve", [spender, MaxUint256])
          : undefined
      )
    );
    return true;
    // TODO research approves with multicall
    // const results = await getMultipleContractMultipleData(
    //   chainId,
    //   library,
    //   erc20Contracts,
    //   "approve",
    //   onlyTokens.map((_) => [spender, MaxUint256])
    // );
  } catch (error) {
    console.log(error);
    return true;
  }
};
