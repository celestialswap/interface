import ListTokensModal from "@/components/ListTokensModal";
import { APP_ROUTE } from "@/configs/index";
import {
  BIPS_BASE,
  Field,
  ROUTER_ADDRESS,
  SWAP_FEE_PERCENT,
  WETH,
} from "@/configs/networks";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import useCurrentRoute from "@/hooks/useCurrentRoute";
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
  Grid,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightAddon,
  Switch,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { BigNumber } from "@ethersproject/bignumber";
import { formatEther, parseEther, parseUnits } from "@ethersproject/units";
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
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { MdSwapVert } from "react-icons/md";

const Swap: NextPage = () => {
  const { account, library } = useActiveWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const currentRoute = useCurrentRoute();

  const [tokens, setTokens] = useState<{ [key in Field]: Token | undefined }>({
    [Field.INPUT]: WETH,
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

      <VStack justify="center">
        <Grid
          templateColumns="repeat(2,1fr)"
          p="1"
          borderRadius="3xl"
          gap="1"
          mb="8"
          border="2px solid #00ADEE"
          bg="#0a2d74b3"
        >
          <Link href="/swap">
            <Box
              cursor="pointer"
              bgImage={
                currentRoute === APP_ROUTE.SWAP
                  ? "linear-gradient(90deg,#00ADEE,#24CBFF)"
                  : ""
              }
              px="4"
              py="2"
              borderRadius="3xl"
              color="white"
              textAlign="center"
              fontWeight="semibold"
            >
              Swap
            </Box>
          </Link>
          <Link href="/liquidity">
            <Box
              flex="1"
              cursor="pointer"
              bgImage={
                currentRoute === APP_ROUTE.LIQUIDITY
                  ? "linear-gradient(90deg,#00ADEE,#24CBFF)"
                  : ""
              }
              px="4"
              py="2"
              borderRadius="3xl"
              color="white"
              textAlign="center"
              fontWeight="semibold"
            >
              Liquidity
            </Box>
          </Link>
        </Grid>

        <VStack
          align="stretch"
          spacing="4"
          w={{ base: "100%", lg: "24em" }}
          border="2px solid #00ADEE"
          bg="#0a2d74b3"
          p="6"
          borderRadius="3xl"
        >
          <HStack>
            <Box flex="1">
              <Box>Slippage</Box>
              <InputGroup
                size="sm"
                w="6em"
                border="1px solid #00ADEE"
                borderRadius="3xl"
                overflow="hidden"
              >
                <Input
                  type="number"
                  textAlign="center"
                  value={slippage}
                  borderRadius="3xl"
                  bg="transparent"
                  onChange={(e) => {
                    const value = +e.target.value;
                    if (value === 0 || value >= 100) return;
                    setSlippage(+e.target.value);
                  }}
                />
                <InputRightAddon
                  bg="transparent"
                  borderRadius="3xl"
                  // eslint-disable-next-line react/no-children-prop
                  children={<Box> %</Box>}
                />
              </InputGroup>
            </Box>

            <Box flex="1" textAlign="right">
              <Box>Multihops</Box>
              <Switch
                bg="#0a2d74b3"
                isChecked={disabledMultihops}
                onChange={(_) => setDisabledMultihops((pre) => !pre)}
              />
            </Box>
          </HStack>

          <Box p="4" border="2px solid #00ADEE" borderRadius="3xl">
            <HStack justify="space-between">
              <Box>From</Box>
              {balances?.[0] && (
                <Box>Balance: {balances?.[0]?.toSignificant(6) ?? "--"}</Box>
              )}
            </HStack>
            <HStack>
              <HStack
                _hover={{ color: "gray.500", cursor: "pointer" }}
                onClick={() => handleOpenModal(Field.INPUT)}
              >
                {tokens[Field.INPUT] && (
                  <Image
                    src={`/images/${tokens[Field.INPUT]?.symbol}.svg`}
                    fallbackSrc="/images/anonymous-token.svg"
                    alt="icon"
                    w="6"
                    h="6"
                  />
                )}
                <Box whiteSpace="nowrap">
                  {tokens[Field.INPUT]?.symbol ?? "--"}
                </Box>
                <VStack borderRight="1px solid" pr="4">
                  <Icon w="4" h="4" as={IoIosArrowDown} />
                </VStack>
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
          <HStack justify="center">
            <Icon
              h="8"
              w="8"
              as={MdSwapVert}
              cursor="pointer"
              border="2px solid #00ADEE"
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
          <Box p="4" border="2px solid #00ADEE" borderRadius="3xl">
            <HStack justify="space-between">
              <Box>To</Box>
              {balances?.[1] && (
                <Box>Balance: {balances?.[1]?.toSignificant(6)}</Box>
              )}
            </HStack>
            <HStack>
              <HStack
                _hover={{ color: "gray.500", cursor: "pointer" }}
                onClick={() => handleOpenModal(Field.OUTPUT)}
              >
                {tokens[Field.OUTPUT] && (
                  <Image
                    src={`/images/${tokens[Field.OUTPUT]?.symbol}.svg`}
                    fallbackSrc="/images/anonymous-token.svg"
                    alt="icon"
                    w="6"
                    h="6"
                  />
                )}
                <Box whiteSpace="nowrap">
                  {tokens[Field.OUTPUT]?.symbol ?? "--"}
                </Box>

                <VStack borderRight="1px solid" pr="4">
                  <Icon w="4" h="4" as={IoIosArrowDown} />
                </VStack>
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
            <HStack justify="space-between">
              <Box>Price</Box>
              <HStack>
                <Box fontWeight="bold">
                  {trade?.executionPrice.toSignificant(6)}
                </Box>
                <Box>
                  {tokens[Field.OUTPUT]?.symbol} / {tokens[Field.INPUT]?.symbol}
                </Box>
              </HStack>
            </HStack>
          )}

          <Box>
            <Button
              w="100%"
              isDisabled={isDisableBtn}
              isLoading={submitting}
              onClick={onSubmit}
              bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
              _hover={{}}
              _focus={{}}
              borderRadius="3xl"
            >
              {loadedPool && tokens[Field.INPUT] && tokens[Field.OUTPUT]
                ? !trade
                  ? poolInfo.pair
                    ? "Swap"
                    : "No route"
                  : poolInfo.noLiquidity && poolInfo.pair
                  ? "No liquidity"
                  : isNeedApproved
                  ? "Approve token"
                  : "Swap"
                : "Swap"}
            </Button>
          </Box>
          {trade && (
            <Box>
              <HStack justify="space-between">
                <Box>Price Impact</Box>
                <Box fontWeight="bold">
                  {parseFloat(trade.priceImpact.toSignificant(6)).toFixed(2)}%
                </Box>
              </HStack>
              <HStack justify="space-between">
                <Box>
                  {slippage
                    ? independentField === Field.INPUT
                      ? "Minimum received"
                      : "Maximum sent"
                    : ""}
                </Box>
                <Box fontWeight="bold">
                  {slippage
                    ? independentField === Field.INPUT
                      ? trade
                          .minimumAmountOut(
                            new Percent(JSBI.BigInt(slippage * 100), BIPS_BASE)
                          )
                          .toSignificant(6)
                      : trade
                          .maximumAmountIn(
                            new Percent(JSBI.BigInt(slippage * 100), BIPS_BASE)
                          )
                          .toSignificant(6)
                    : ""}
                </Box>
              </HStack>
              <HStack justify="space-between">
                <Box>Liquidity Provider Fee</Box>
                <Box fontWeight="bold">
                  {parseFloat(
                    formatEther(
                      BigNumber.from(trade.inputAmount.raw.toString())
                        .mul(BigNumber.from("3"))
                        .div(BigNumber.from("100"))
                    )
                  ).toFixed(4)}{" "}
                  {trade.route.input.symbol}
                </Box>
              </HStack>
              <HStack justify="space-between">
                <Box>Route</Box>
                <Box fontWeight="bold">
                  {trade?.route.path.map((t) => t.symbol).join(" > ")}
                </Box>
              </HStack>
            </Box>
          )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default Swap;
