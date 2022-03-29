import ERC20ABI from "@/abis/ERC20.json";
import MulticallABI from "@/abis/Muticall2.json";
import PairABI from "@/abis/Pair.json";
import RouterABI from "@/abis/Router.json";
import FactoryABI from "@/abis/Factory.json";
import {
  FACTORY_ADDRESS,
  MULTICALL_ADDRESS,
  ROUTER_ADDRESS,
} from "@/configs/networks";
import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { getContract, isAddress } from "../utils";

export async function callContract(
  contract: Contract,
  method: string,
  args: any[],
  overrides: { [key: string]: any } = {}
) {
  try {
    // const estimateGas = await contract.estimateGas[method](...args, {
    //   ...overrides,
    // });

    // console.log(estimateGas);

    const tx = await contract[method](...args, {
      ...overrides,
    });
    if (typeof tx.wait !== "function") return tx;
    const res = await tx.wait();
    return res;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function callStaticContract(
  contract: Contract,
  method: string,
  args: any[],
  overrides = {}
) {
  try {
    // console.log(contract, method, args);
    const staticTx = await contract.callStatic[method](...args, {
      ...overrides,
    });
    // console.log(staticTx);
    if (typeof staticTx.wait !== "function") return staticTx;
    const res = await staticTx.wait();
    console.log(res);
    return res;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function getMulticallContract(library: Web3Provider, account?: string) {
  return getContract(MULTICALL_ADDRESS, MulticallABI, library, account);
}

export function getERC20Contract(
  token: string,
  library: Web3Provider,
  account?: string
): Contract {
  if (!isAddress(token)) throw Error("invalid token address");
  return getContract(token, ERC20ABI, library, account);
}

export function getPairContract(
  pair: string,
  library: Web3Provider,
  account?: string
) {
  if (!isAddress(pair)) throw Error("invalid pair address");
  return getContract(pair, PairABI, library, account);
}

export function getFactoryContract(library: Web3Provider, account?: string) {
  return getContract(FACTORY_ADDRESS, FactoryABI, library, account);
}

export function getRouterContract(library: Web3Provider, account?: string) {
  return getContract(ROUTER_ADDRESS, RouterABI, library, account);
}
