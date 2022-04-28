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
import { formatEther } from "@ethersproject/units";
import { Token, TokenAmount } from "@uniswap/sdk";

export interface FarmPool {
  lpToken: Token;
  tokens: {
    token0: Token;
    token1: Token;
  };
  accStarPerShare: BigNumber;
  allocPoint: BigNumber;
  lastRewardTime: BigNumber;
  pendingReward: BigNumber | undefined;
  userInfo:
    | {
        amount: BigNumber;
        userPoint: BigNumber;
        rewardDebt: BigNumber;
        unlockTime: BigNumber;
      }
    | undefined;
  lpBalance: TokenAmount | undefined;
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
        if (!results?.length) throw Error("invalid pair");
        const _token = results.reduce((memo, result, i) => {
          if (result?.[0]) memo[erc20Methods[i]] = result[0];
          return memo;
        }, {});
        if (
          Array.from(
            new Set([...Object.keys(_token), ...erc20Methods]).values()
          ).length !== erc20Methods.length
        )
          throw Error("invalid pair");

        return new Token(
          NETWORKS_SUPPORTED.chainId,
          token,
          _token["decimals"],
          _token["symbol"],
          _token["name"]
        );
      })
    );

    let pendingReward, userInfo, lpBalance;
    if (account) {
      [pendingReward, userInfo, lpBalance] = await Promise.all([
        callContract(masterChiefContract, "pendingStar", [pid, account]),
        callContract(masterChiefContract, "userInfo", [pid, account]),
        callContract(pairContract, "balanceOf", [account]),
      ]);
    }
    const _lpToken = new Token(
      NETWORKS_SUPPORTED.chainId,
      poolInfo.lpToken,
      18
    );
    return {
      lpToken: _lpToken,
      tokens: {
        token0: _token0,
        token1: _token1,
      },
      accStarPerShare: poolInfo.accStarPerShare,
      allocPoint: poolInfo.allocPoint,
      lastRewardTime: poolInfo.lastRewardTime,
      pendingReward,
      userInfo,
      lpBalance: new TokenAmount(_lpToken, lpBalance),
    };
  } catch (error) {
    throw error;
  }
};

export const startFarming = async (
  library: Web3Provider,
  account: string,
  pid: number,
  amount: TokenAmount | undefined,
  lockTime: number
) => {
  try {
    if (!amount) return;
    const masterChiefContract = getMasterChiefContract(library, account);
    return callContract(masterChiefContract, "deposit", [
      pid,
      amount.raw.toString(),
      lockTime,
    ]);
  } catch (error) {
    throw error;
  }
};

export const harvest = async (
  library: Web3Provider,
  account: string,
  pid: number,
  amount: BigNumber | undefined
) => {
  try {
    if (!amount) return;
    const masterChiefContract = getMasterChiefContract(library, account);
    return callContract(masterChiefContract, "withdraw", [pid, 0]);
  } catch (error) {
    throw error;
  }
};
