import ListTokensModal from "@/components/ListTokensModal";
import { BIPS_BASE, Field, ROUTER_ADDRESS } from "@/configs/networks";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { approves, getAllowances } from "@/state/erc20";
import {
  EmptyPool,
  getCurrencyBalances,
  getPoolInfo,
  PoolState,
} from "@/state/liquidity";
import { getDerivedSwapInfo, swapCallback } from "@/state/swap";
import {
  Box,
  Button,
  HStack,
  Icon,
  Input,
  useDisclosure,
} from "@chakra-ui/react";
import { parseUnits } from "@ethersproject/units";
import {
  CurrencyAmount,
  Fraction,
  JSBI,
  Percent,
  Token,
  TokenAmount,
  Trade,
} from "@uniswap/sdk";
import type { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { MdSwapVert } from "react-icons/md";

const Swap: NextPage = () => {
  const { account, library } = useActiveWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [tokens, setTokens] = useState<{ [key in Field]: Token | undefined }>({
    [Field.INPUT]: undefined,
    [Field.OUTPUT]: undefined,
  });
  const [balances, setBalances] = useState<
    (CurrencyAmount | undefined)[] | undefined
  >();

  const [typedValue, setTypedValue] = useState("");
  const [independentField, setIndependentField] = useState<Field>(Field.INPUT);
  const [reloadPool, setReloadPool] = useState<boolean>(false);
  const [poolInfo, setPoolInfo] = useState<PoolState>(EmptyPool);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [tokensNeedApproved, setTokensNeedApproved] = useState<Token[]>([]);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [slippage, setSlippage] = useState<number>(0.5);
  const [disabledMultihops, setDisabledMultihops] = useState<boolean>(false);
  const [loadedPool, setLoadedPool] = useState<boolean>(false);

  // console.count("render");
  // useEffect(() => {
  //   chainId && setToken0(WETH[chainId]);
  // }, [chainId]);

  useEffect(() => {
    (async () => {
      if (!account || !library) return;
      try {
        const [balances, poolInfo] = await Promise.all([
          getCurrencyBalances(account, library, [
            tokens[Field.INPUT],
            tokens[Field.OUTPUT],
          ]),
          getPoolInfo(account, library, [
            tokens[Field.INPUT],
            tokens[Field.OUTPUT],
          ]),
        ]);
        poolInfo && setPoolInfo(poolInfo);
        balances && setBalances(balances);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [account, library, tokens, reloadPool]);

  useEffect(() => {
    (async () => {
      try {
        if (!account) return;
        setLoadedPool(false);
        const trade = await getDerivedSwapInfo({
          library,
          independentField,
          typedValue,
          currencies: tokens,
          singlehops: disabledMultihops,
        });
        setTrade(trade);
        setLoadedPool(true);
      } catch (error) {
        setLoadedPool(false);
        console.error(error);
      }
    })();
  }, [
    account,
    library,
    tokens,
    typedValue,
    independentField,
    disabledMultihops,
  ]);

  useEffect(() => {
    if (!account || !library || !trade || !tokens[Field.INPUT] || !typedValue)
      return;

    const decimals = tokens[Field.INPUT]?.decimals ?? 18;
    const parsedAmount = new Fraction(
      parseUnits(typedValue, decimals).toString()
    );
    const inputAmount: TokenAmount =
      independentField === Field.INPUT
        ? new TokenAmount(
            tokens?.[Field.INPUT] as any,
            parsedAmount.quotient.toString()
          )
        : (trade.inputAmount as TokenAmount);
    getAllowances(
      library,
      account,
      ROUTER_ADDRESS,
      [tokens[Field.INPUT]],
      [inputAmount]
    )
      .then(setTokensNeedApproved)
      .catch(console.error);
  }, [account, library, trade, tokens, independentField, typedValue]);

  const handleOpenModal = (independentField: Field) => {
    setIndependentField(independentField);
    onOpen();
  };

  const handleSelectToken = (token: Token) => {
    let _tokens = { ...tokens };
    _tokens[independentField] = token;
    if (independentField === Field.INPUT) {
      if (tokens[Field.OUTPUT] && token.equals(tokens[Field.OUTPUT] as any)) {
        if (tokens[Field.INPUT]) _tokens[Field.OUTPUT] = tokens[Field.INPUT];
        else _tokens[Field.OUTPUT] = undefined;
      }
    } else {
      if (tokens[Field.INPUT] && token.equals(tokens[Field.INPUT] as any)) {
        if (tokens[Field.OUTPUT]) _tokens[Field.INPUT] = tokens[Field.OUTPUT];
        else _tokens[Field.INPUT] = undefined;
      }
    }
    setTokens(_tokens);
    onClose();
  };

  const handleChangeAmounts = (value: string, independentField: Field) => {
    setTypedValue(value);
    setIndependentField(independentField);
  };

  const isDisableBtn: boolean = useMemo(() => {
    if (!trade) return true;
    return false;
  }, [trade]);

  const isNeedApproved: boolean = useMemo(
    () => (tokensNeedApproved.length > 0 ? true : false),
    [tokensNeedApproved]
  );

  const onSwapCallback = useCallback(async () => {
    try {
      setSubmitting(true);
      await swapCallback(library, account, trade, slippage);
      setReloadPool((pre) => !pre);
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }, [account, library, trade, slippage]);

  const onApproveTokens = useCallback(async () => {
    try {
      if (!account || !library) return;
      setSubmitting(true);
      const result = await approves(
        library,
        account,
        ROUTER_ADDRESS,
        tokensNeedApproved
      );
      if (result) setTokensNeedApproved([]);
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }, [account, library, tokensNeedApproved]);

  const onSubmit = () => {
    if (isNeedApproved) {
      onApproveTokens();
    } else if (!isDisableBtn) {
      onSwapCallback();
    }
  };

  return (
    <Box>
      <ListTokensModal
        isOpen={isOpen}
        onClose={onClose}
        callback={handleSelectToken}
      />

      <HStack justify="center">
        <Box
          w="24em"
          border="1px solid"
          borderColor="gray.200"
          p="6"
          borderRadius="xl"
        >
          {/* <HStack align="flex-end" justify="flex-end">
              <Box> slippage</Box>
              <InputGroup size="sm" w="32">
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => {
                    const value = +e.target.value;
                    if (value === 0 || value >= 100) return;
                    setSlippage(+e.target.value);
                  }}
                />
                <InputRightAddon
                  // eslint-disable-next-line react/no-children-prop
                  children={<Box>%</Box>}
                />
              </InputGroup>
            </HStack>

            <HStack align="flex-end" justify="flex-end">
              <Box>disable multihops</Box>
              <Switch
                isChecked={disabledMultihops}
                onChange={(_) => setDisabledMultihops((pre) => !pre)}
              />
            </HStack> */}

          <Box p="4" bg="gray.100" borderRadius="xl">
            <HStack justify="space-between">
              <Box>from</Box>
              <Box>balance: {balances?.[0]?.toSignificant(6) ?? "--"}</Box>
            </HStack>
            <HStack>
              <HStack
                _hover={{ color: "gray.500", cursor: "pointer" }}
                onClick={() => handleOpenModal(Field.INPUT)}
              >
                <Box whiteSpace="nowrap">
                  {tokens[Field.INPUT]?.symbol ?? "--"}
                </Box>
                <Box borderRight="1px solid" pr="4">
                  <Icon w="3" h="3" as={IoIosArrowDown} />
                </Box>
              </HStack>
              <Input
                type="number"
                border="none"
                _hover={{
                  border: "none",
                }}
                _focus={{
                  border: "none",
                }}
                textAlign="right"
                value={
                  independentField === Field.INPUT
                    ? typedValue
                    : trade?.inputAmount.toSignificant(6) ?? ""
                }
                onChange={(e) =>
                  handleChangeAmounts(e.target.value, Field.INPUT)
                }
              />
            </HStack>
          </Box>
          <HStack justify="center" p="4">
            <Icon
              h="8"
              w="8"
              as={MdSwapVert}
              cursor="pointer"
              bg="gray.100"
              p="1"
              borderRadius="3em"
              onClick={() => {
                const [_input, _output] = [
                  tokens[Field.INPUT],
                  tokens[Field.OUTPUT],
                ];
                // console.log(_output, _input);
                setTokens({
                  [Field.INPUT]: _output,
                  [Field.OUTPUT]: _input,
                });
              }}
            />
          </HStack>
          <Box p="4" bg="gray.100" borderRadius="xl">
            <HStack justify="space-between">
              <Box>to</Box>
              <Box>balance: {balances?.[1]?.toSignificant(6)}</Box>
            </HStack>
            <HStack>
              <HStack
                _hover={{ color: "gray.500", cursor: "pointer" }}
                onClick={() => handleOpenModal(Field.OUTPUT)}
              >
                <Box whiteSpace="nowrap">
                  {tokens[Field.OUTPUT]?.symbol ?? "--"}
                </Box>

                <Box borderRight="1px solid" pr="4">
                  <Icon w="3" h="3" as={IoIosArrowDown} />
                </Box>
              </HStack>
              <Input
                type="number"
                border="none"
                _hover={{
                  border: "none",
                }}
                _focus={{
                  border: "none",
                }}
                textAlign="right"
                value={
                  independentField === Field.OUTPUT
                    ? typedValue
                    : trade?.outputAmount.toSignificant(6) ?? ""
                }
                onChange={(e) =>
                  handleChangeAmounts(e.target.value, Field.OUTPUT)
                }
              />
            </HStack>
          </Box>
          {trade && (
            <>
              <Box>price: {trade?.executionPrice.toSignificant(6)}</Box>
              <Box>
                price impact: -
                {parseFloat(trade?.priceImpact.toSignificant(6)).toFixed(2)}%
              </Box>
              <Box>
                {slippage
                  ? independentField === Field.INPUT
                    ? `minimum received: ${trade
                        ?.minimumAmountOut(
                          new Percent(JSBI.BigInt(slippage * 100), BIPS_BASE)
                        )
                        .toSignificant(6)}`
                    : `maximum sent: ${trade
                        ?.maximumAmountIn(
                          new Percent(JSBI.BigInt(slippage * 100), BIPS_BASE)
                        )
                        .toSignificant(6)}`
                  : ""}
              </Box>
              <Box>
                route path: {trade?.route.path.map((t) => t.symbol).join(" - ")}
              </Box>
            </>
          )}

          <Box pt="4">
            <Button
              colorScheme="teal"
              w="100%"
              isDisabled={isDisableBtn}
              isLoading={submitting}
              onClick={onSubmit}
            >
              {loadedPool && !trade
                ? "no route"
                : poolInfo.noLiquidity && poolInfo.pair
                ? "no liquidity"
                : isNeedApproved
                ? "approve token"
                : "swap"}
            </Button>
          </Box>
        </Box>
      </HStack>
    </Box>
  );
};

export default Swap;
