import { NETWORKS_SUPPORTED } from "@/configs/networks";
import {
  callContract,
  getERC20Contract,
  getMasterChiefContract,
  getPairContract,
} from "@/hooks/useContract";
import { getSingleContractMultipleDataMultipleMethods } from "@/utils/muticall";
import { BigNumber } from "@ethersproject/bignumber";
import { Web3Provider } from "@ethersproject/providers";
import { Token } from "@uniswap/sdk";

export interface FarmPool {
  lpToken: string;
  tokens: {
    token0: Token;
    token1: Token;
  };
  accStarPerShare: BigNumber;
  allocPoint: BigNumber;
  lastRewardTime: BigNumber;
}

export const getFarmPoolLength = async (
  library: Web3Provider
): Promise<number> => {
  try {
    const masterChiefContract = getMasterChiefContract(library);
    const poolLength = await callContract(
      masterChiefContract,
      "poolLength",
      []
    );
    return parseInt(poolLength.toString(), 10);
  } catch (error) {
    throw error;
  }
};

export const getPool = async (
  pid: number,
  library: Web3Provider,
  account: string | null | undefined
): Promise<FarmPool> => {
  try {
    const masterChiefContract = getMasterChiefContract(library);
    const poolInfo = await callContract(masterChiefContract, "poolInfo", [pid]);
    if (!poolInfo.lpToken) throw Error("invalid farm pool");
    const pairContract = getPairContract(poolInfo.lpToken, library);
    const [token0, token1] = await Promise.all([
      callContract(pairContract, "token0", []),
      callContract(pairContract, "token1", []),
    ]);
    const [_token0, _token1] = await Promise.all(
      [token0, token1].map(async (token) => {
        const erc20Contract = getERC20Contract(token, library);
        const erc20Methods = ["name", "symbol", "decimals"];
        const results = await getSingleContractMultipleDataMultipleMethods(
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
          NETWORKS_SUPPORTED.chainId,
          token,
          _token["decimals"],
          _token["symbol"],
          _token["name"]
        );
      })
    );
    return {
      ...poolInfo,
      tokens: {
        token0: _token0,
        token1: _token1,
      },
    };
  } catch (error) {
    throw error;
  }
};
