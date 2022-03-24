// // import { useCurrency } from 'hooks/Tokens';
// // import { useCurrencyBalances } from 'state/wallet/hook';
// import { parseUnits } from '@ethersproject/units';
// import { CurrencyAmount, JSBI, Token, TokenAmount } from '@uniswap/sdk';
// import { useTradeExactIn, useTradeExactOut } from 'hooks/Trades';

import { BIPS_BASE, Field } from "@/configs/networks";
import { callContract, getRouterContract } from "@/hooks/useContract";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { Web3Provider } from "@ethersproject/providers";
import { parseUnits } from "@ethersproject/units";
import {
  CurrencyAmount,
  JSBI,
  Percent,
  Token,
  TokenAmount,
  Trade,
  TradeType,
} from "@uniswap/sdk";
import { swapCallParameters } from "../utils";
import { getAllCommonPairs, getTradeExactIn, getTradeExactOut } from "./index";

// try to parse a user entered amount for a given token
export const tryParseAmount = (
  value: string,
  currency: Token | undefined
): TokenAmount | CurrencyAmount | undefined => {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString();
    if (typedValueParsed !== "0") {
      return currency instanceof Token
        ? new TokenAmount(currency, JSBI.BigInt(typedValueParsed))
        : CurrencyAmount.ether(JSBI.BigInt(typedValueParsed));
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  // necessary for all paths to return a value
  return undefined;
};

// from the current swap inputs, compute the best trade and return it.
export const getDerivedSwapInfo = async ({
  chainId,
  library,
  independentField = Field.INPUT,
  typedValue,
  currencies,
  singlehops,
}: {
  chainId: number | undefined;
  library: Web3Provider | undefined | null;
  independentField: Field;
  typedValue: string | BigNumber;
  currencies: {
    [key in Field]: Token | undefined;
  };
  singlehops: boolean;
}): Promise<Trade | null> => {
  if (!chainId || !library) return null;
  // console.log(independentField, typedValue, currencies);
  const { [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurrency } =
    currencies;
  if (!inputCurrency || !outputCurrency) return null;

  const allowedPairs = await getAllCommonPairs(
    chainId,
    library,
    inputCurrency,
    outputCurrency
  );
  if (!allowedPairs.length) return null;

  const isExactIn = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(
    typedValue.toString(),
    (isExactIn ? inputCurrency : outputCurrency) ?? undefined
  );
  if (!parsedAmount) return null;

  const [bestTradeExactIn, bestTradeExactOut] = await Promise.all([
    getTradeExactIn(
      chainId,
      library,
      inputCurrency,
      outputCurrency,
      parsedAmount,
      isExactIn ? outputCurrency : inputCurrency,
      singlehops
    ),
    getTradeExactOut(
      chainId,
      library,
      inputCurrency,
      outputCurrency,
      parsedAmount,
      isExactIn ? outputCurrency : inputCurrency,
      singlehops
    ),
  ]);

  const trade = isExactIn ? bestTradeExactIn : bestTradeExactOut;

  return trade;
};

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 */
export const getSwapCallArguments = async (
  chainId: number | undefined,
  recipientAddressOrName: string, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender,
  deadline: number,
  allowedSlippage: number,
  routerContract: Contract,
  trade: Trade // trade to execute, required
) => {
  const recipient = recipientAddressOrName;

  if (!chainId || !trade || !recipient || !deadline || !routerContract)
    return [];

  const swapMethods = [];

  try {
    swapMethods.push(
      swapCallParameters(chainId, trade as any, {
        feeOnTransfer: false,
        allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
        recipient,
        deadline,
      })
    );
    if (trade.tradeType === TradeType.EXACT_INPUT) {
      swapMethods.push(
        swapCallParameters(chainId, trade as any, {
          feeOnTransfer: true,
          allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
          recipient,
          deadline,
        })
      );
    }

    return swapMethods.map((parameters) => ({
      parameters,
      routerContract,
    }));
  } catch (error) {
    throw error;
  }
};

export const swapCallback = async (
  chainId: number | undefined,
  library: Web3Provider | null | undefined,
  account: string | null | undefined, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender,
  trade: Trade | null, // trade to execute, required
  allowedSlippage: number
) => {
  try {
    if (!chainId || !library || !account || !trade) return;

    const routerContract = getRouterContract(chainId, library, account);
    const deadline = Math.floor(Date.now() / 1000) + 30 * 60;

    // swapCalls arguments
    const swapCalls = await getSwapCallArguments(
      chainId,
      account,
      deadline,
      Math.floor(allowedSlippage * 100),
      routerContract,
      trade
    );

    if (!trade || !account || !chainId || !swapCalls?.length || !routerContract)
      return;

    let {
      parameters: { methodName, args, value },
    } = swapCalls[0];

    // swapExactETHForTokens ETH -> Token
    // swapExactTokensForETH Token -> ETH

    // const params = {
    //   from: account,
    //   to: routerAddress,
    //   data,
    //   value, // = 0 if Token -> ETH
    //   // gasPrice: '0x01',
    //   // gasLimit,
    // };

    let options = { value };
    // const { gasLimit } = await estimateGas(
    //   routerContract,
    //   methodName,
    //   args,
    //   options
    // );
    // options = {
    //   ...options,
    //   gasLimit,
    // };
    console.log(methodName, args, options);
    return callContract(routerContract, methodName, args, options);
  } catch (error) {
    console.error("user reject transaction", error);
    throw error;
  }
};
