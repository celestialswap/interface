import ListTokensModal from "@/components/ListTokensModal";
import { APP_ROUTE } from "@/configs/index";
import {
  BIPS_BASE,
  Field,
  FIVE_PERCENT,
  ROUTER_ADDRESS,
  WETH,
} from "@/configs/networks";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import useCurrentRoute from "@/hooks/useCurrentRoute";
import useListTokens from "@/hooks/useListTokens";
import { approves, getAllowances, getToken } from "@/state/erc20";
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
  Checkbox,
  Grid,
  HStack,
  Icon,
  Image,
  Input,
  InputGroup,
  InputRightAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { BigNumber } from "@ethersproject/bignumber";
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "@ethersproject/units";
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
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AiOutlineWarning } from "react-icons/ai";
import { IoIosArrowDown } from "react-icons/io";
import { MdSwapVert } from "react-icons/md";

const Swap: NextPage = () => {
  const { account, library } = useActiveWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenConfirmHighSlippage,
    onOpen: onOpenConfirmHighSlippage,
    onClose: onCloseConfirmHighSlippage,
  } = useDisclosure();
  const currentRoute = useCurrentRoute();
  const { query } = useRouter();
  const listTokens = useListTokens();

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
  const [slippage, setSlippage] = useState<string>("0.5");
  const [disabledMultihops, setDisabledMultihops] = useState<boolean>(true);
  const [loadedPool, setLoadedPool] = useState<boolean>(false);
  const [isCheckedHighPriceImpact, setIsCheckedHighPriceImpact] =
    useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { input, output } = query;
      let _input = tokens[Field.INPUT],
        _output = tokens[Field.OUTPUT];
      if (
        input &&
        input.toString().toLowerCase() !== WETH.address.toLowerCase()
      ) {
        const exits = listTokens.find(
          (t) => t.address.toLowerCase() === input.toString().toLowerCase()
        );
        if (exits) {
          _input = exits;
        } else {
          try {
            let _t = await getToken(input.toString().toLowerCase(), library);
            if (_t) _input = _t;
          } catch (error) {}
        }
      }

      if (
        output &&
        output.toString().toLowerCase() !== WETH.address.toLowerCase()
      ) {
        const exits = listTokens.find(
          (t) => t.address.toLowerCase() === output.toString().toLowerCase()
        );
        if (exits) {
          _output = exits;
        } else {
          try {
            let _t = await getToken(output.toString().toLowerCase(), library);
            if (_t) _output = _t;
          } catch (error) {}
        }
      } else {
        _output = WETH;
      }
      if (_input && _output && _input.equals(_output)) _output = undefined;
      setTokens({
        [Field.INPUT]: _input,
        [Field.OUTPUT]: _output,
      });
    })();
  }, [library, query, listTokens]);

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
    if (+value <= 0) return setTypedValue("");
    setTypedValue(value);
    setIndependentField(independentField);
  };

  const isDisableBtn: boolean = useMemo(() => {
    if (!trade || !balances?.[0] || !tokens[Field.INPUT] || !typedValue)
      return true;
    let input =
      independentField === Field.INPUT
        ? parseUnits(typedValue, tokens[Field.INPUT]?.decimals).toString()
        : trade.inputAmount.raw.toString();

    if (
      BigNumber.from(input).gt(
        BigNumber.from(balances[0]?.raw.toString() ?? "0")
      )
    ) {
      return true;
    }
    return false;
  }, [trade, balances]);

  const isNeedApproved: boolean = useMemo(
    () => (tokensNeedApproved.length > 0 ? true : false),
    [tokensNeedApproved]
  );

  const onSwapCallback = useCallback(async () => {
    try {
      setSubmitting(true);
      await swapCallback(library, account, trade, +slippage);
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

  const isHighPriceImpact = useMemo(
    () => (trade ? trade.priceImpact.greaterThan(FIVE_PERCENT) : false),
    [trade]
  );

  const onSubmit = () => {
    if (isHighPriceImpact) return onOpenConfirmHighSlippage();
    if (isNeedApproved) {
      return onApproveTokens();
    } else if (!isDisableBtn) {
      return onSwapCallback();
    }
  };

  const onSubmitHighSlippage = () => {
    if (isNeedApproved) {
      return onApproveTokens();
    } else if (!isDisableBtn) {
      return onSwapCallback().then(onCloseConfirmHighSlippage);
    }
  };

  const buttonText = useMemo((): string => {
    if (!account) return "Connect wallet";
    if (
      !loadedPool ||
      !tokens[Field.INPUT] ||
      !tokens[Field.OUTPUT] ||
      !balances ||
      !balances[0] ||
      !balances[1]
    )
      return "Swap";

    if (!trade) {
      if (poolInfo.pair) return "Swap";
      else return "No route";
    } else {
      let input =
        independentField === Field.INPUT
          ? parseUnits(typedValue, tokens[Field.INPUT]?.decimals).toString()
          : trade.inputAmount.raw.toString();

      if (
        BigNumber.from(input).gt(
          BigNumber.from(balances[0]?.raw.toString() ?? "0")
        )
      ) {
        return `Insufficient ${tokens[Field.INPUT]?.symbol} balance`;
      }
      if (poolInfo.noLiquidity && poolInfo.pair) return "No liquidity";
      else if (isNeedApproved) return "Approve token";
    }
    return "Swap";
  }, [loadedPool, tokens, trade, poolInfo, isNeedApproved, account]);

  return (
    <Box>
      <ListTokensModal
        isOpen={isOpen}
        onClose={onClose}
        callback={handleSelectToken}
      />

      <Modal
        isOpen={isOpenConfirmHighSlippage}
        onClose={onCloseConfirmHighSlippage}
      >
        <ModalOverlay />
        <ModalContent
          border="2px solid #00ADEE"
          borderRadius="3xl"
          bg="#0a2d74e6"
          color="white"
        >
          <ModalHeader textAlign="center">Price Impact Warning</ModalHeader>
          <ModalCloseButton borderRadius="3xl" _focus={{}} />
          <ModalBody>
            <VStack spacing="6" pb="4">
              {trade && (
                <Box color="#c53f45e6" fontWeight="medium">
                  This trade has an extremely high price impact, meaning you
                  will lose{" "}
                  <span style={{ fontWeight: 800, fontSize: "20px" }}>
                    {parseFloat(trade.priceImpact.toSignificant(6)).toFixed(2)}%
                  </span>{" "}
                  of your tokens
                </Box>
              )}
              <Checkbox
                checked={isCheckedHighPriceImpact}
                onChange={(v) => setIsCheckedHighPriceImpact(v.target.checked)}
              >
                I understand this will result in a loss of funds
              </Checkbox>

              <HStack justify="space-between">
                <Button
                  w="24"
                  bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
                  _hover={{}}
                  _focus={{}}
                  borderRadius="3xl"
                  isDisabled={isDisableBtn}
                  isLoading={submitting}
                  onClick={() =>
                    isCheckedHighPriceImpact ? onSubmitHighSlippage() : null
                  }
                >
                  {buttonText}
                </Button>
                <Button
                  w="24"
                  _hover={{}}
                  _focus={{}}
                  borderRadius="3xl"
                  bg="transparent"
                  border="2px solid #00ADEE"
                  onClick={onCloseConfirmHighSlippage}
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

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
                    if (isNaN(+e.target.value)) return;
                    setSlippage(e.target.value);
                  }}
                  onBlur={() => {
                    if (+slippage === 0 || +slippage >= 100) setSlippage("0.5");
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
                    src={`/images/${tokens[
                      Field.INPUT
                    ]?.address.toLowerCase()}.svg`}
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
              <Box pos="relative">
                <Input
                  type="number"
                  border="none"
                  pr="12"
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
                {tokens[Field.INPUT] && (
                  <Button
                    pos="absolute"
                    right="0"
                    top="0"
                    transform="translateY(25%);"
                    size="xs"
                    onClick={() => {
                      tokens[Field.INPUT] &&
                        balances?.[0] &&
                        handleChangeAmounts(
                          formatUnits(
                            balances[0].raw.toString(),
                            tokens[Field.INPUT]?.decimals
                          ),
                          Field.INPUT
                        );
                    }}
                    bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
                    _hover={{}}
                    _focus={{}}
                    borderRadius="3xl"
                  >
                    max
                  </Button>
                )}
              </Box>
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
                    src={`/images/${tokens[
                      Field.OUTPUT
                    ]?.address.toLowerCase()}.svg`}
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
              <Box pos="relative">
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
              </Box>
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
            {tokens[Field.INPUT] &&
              tokens[Field.OUTPUT] &&
              trade &&
              trade.priceImpact.greaterThan(FIVE_PERCENT) && (
                <HStack color="#c53f45e6">
                  <Icon as={AiOutlineWarning} w="6" h="6" />
                  <Box fontWeight="bold" fontSize="sm">
                    Price Impact is very high please double check the trade!
                  </Box>
                </HStack>
              )}
            <Button
              mt="2"
              w="100%"
              isDisabled={isDisableBtn}
              isLoading={submitting}
              onClick={onSubmit}
              bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
              _hover={{}}
              _focus={{}}
              borderRadius="3xl"
            >
              {buttonText}
            </Button>
          </Box>
          {trade && (
            <Box>
              <HStack justify="space-between">
                <Box>Price Impact</Box>
                <Box fontWeight="bold">
                  {trade.priceImpact.toSignificant(6)}%
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
                            new Percent(JSBI.BigInt(+slippage * 100), BIPS_BASE)
                          )
                          .toSignificant(6)
                      : trade
                          .maximumAmountIn(
                            new Percent(JSBI.BigInt(+slippage * 100), BIPS_BASE)
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
