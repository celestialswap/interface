import ListTokensModal from "@/components/ListTokensModal";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import {
  addLiquidityCallback,
  EmptyPool,
  getCurrencyBalances,
  getPoolInfo,
  PoolState,
} from "@/state/liquidity";
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
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import {
  CurrencyAmount,
  Fraction,
  JSBI,
  Token,
  TokenAmount,
} from "@uniswap/sdk";
import type { NextPage } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, ROUTER_ADDRESS, WETH } from "@/configs/networks";
import { parseUnits, formatUnits } from "@ethersproject/units";
import { approves, getAllowances, getToken } from "@/state/erc20";
import { IoIosArrowDown, IoIosAdd } from "react-icons/io";
import { AiOutlineSwap } from "react-icons/ai";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { useRouter } from "next/router";
import { BigNumber } from "@ethersproject/bignumber";
import useListTokens from "@/hooks/useListTokens";

const AddLiquidity: NextPage = () => {
  const { account, library } = useActiveWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const listTokens = useListTokens();

  const [tokens, setTokens] = useState<{ [key in Field]: Token | undefined }>({
    [Field.INPUT]: WETH,
    [Field.OUTPUT]: undefined,
  });
  const [balances, setBalances] = useState<
    (CurrencyAmount | undefined)[] | undefined
  >();
  const [tokenAmounts, setTokenAmounts] = useState<{ [key in Field]: string }>({
    [Field.INPUT]: "",
    [Field.OUTPUT]: "",
  });
  const [parsedTokenAmounts, setParsedTokenAmounts] = useState<{
    [key in Field]: TokenAmount | undefined;
  }>({
    [Field.INPUT]: undefined,
    [Field.OUTPUT]: undefined,
  });
  const [independentField, setIndependentField] = useState<Field>(Field.INPUT);
  const [reloadPool, setReloadPool] = useState<boolean>(false);
  const [poolInfo, setPoolInfo] = useState<PoolState>(EmptyPool);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [typePrice, setTypePrice] = useState<Field>(Field.INPUT);
  const [tokensNeedApproved, setTokensNeedApproved] = useState<Token[]>([]);

  useEffect(() => {
    (async () => {
      const { input, output } = router.query;
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
  }, [library, router, listTokens]);

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
    if (!account || !library) return;
    getAllowances(
      library,
      account,
      ROUTER_ADDRESS,
      [tokens[Field.INPUT], tokens[Field.OUTPUT]],
      [parsedTokenAmounts[Field.INPUT], parsedTokenAmounts[Field.OUTPUT]]
    )
      .then(setTokensNeedApproved)
      .catch(console.error);
  }, [account, library, tokens, parsedTokenAmounts]);

  useEffect(() => {
    if (!poolInfo.noLiquidity) {
      setTokenAmounts({ [Field.INPUT]: "", [Field.OUTPUT]: "" });
      // TODO change amount follow independentField
    }
  }, [poolInfo]);

  // console.log(poolInfo);

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
    if (value === "") {
      poolInfo.noLiquidity
        ? setTokenAmounts((amounts) => ({ ...amounts, [independentField]: "" }))
        : setTokenAmounts({ [Field.INPUT]: "", [Field.OUTPUT]: "" });
      return;
    }

    setIndependentField(independentField);
    const remainField =
      independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;
    const decimalsIndependent = tokens?.[independentField]?.decimals ?? 18;
    const remainDecimals = tokens?.[remainField]?.decimals ?? 18;
    let parsedAmount: Fraction | undefined;
    if (poolInfo.noLiquidity && !poolInfo.prices[independentField]) {
      setTokenAmounts((amounts) => ({ ...amounts, [independentField]: value }));
      try {
        parsedAmount = new Fraction(
          parseUnits(value, decimalsIndependent).toString()
        );
        tokens[independentField] &&
          setParsedTokenAmounts((amounts) => ({
            ...amounts,
            [independentField]: new TokenAmount(
              tokens[independentField] as any,
              parsedAmount?.quotient.toString() as any
            ),
          }));
      } catch (error) {
        console.error(error);
        return;
      }
    } else {
      try {
        parsedAmount = new Fraction(
          parseUnits(value, decimalsIndependent).toString()
        );
      } catch (error) {
        console.error(error);
        return;
      }
      if (!parsedAmount) return;
      const remainParsedAmount = parsedAmount.multiply(
        poolInfo.prices[remainField]?.raw ?? "1"
      );
      setParsedTokenAmounts({
        [independentField]: new TokenAmount(
          tokens[independentField] as any,
          parsedAmount.quotient.toString()
        ),
        [remainField]: new TokenAmount(
          tokens[remainField] as any,
          remainParsedAmount.quotient.toString()
        ),
      } as any);
      setTokenAmounts({
        [independentField]: value,
        [remainField]: formatUnits(
          remainParsedAmount.quotient.toString(),
          remainDecimals
        ),
      } as any);
    }
  };

  const isDisableBtn: boolean = useMemo(() => {
    if (
      [tokens, tokenAmounts, parsedTokenAmounts].some(
        (e) => !e[Field.INPUT] || !e[Field.OUTPUT]
      ) ||
      !balances?.[0] ||
      !balances?.[1] ||
      !parsedTokenAmounts[Field.INPUT] ||
      !parsedTokenAmounts[Field.OUTPUT]
    )
      return true;

    if (
      BigNumber.from(parsedTokenAmounts[Field.INPUT]?.raw.toString()).gt(
        BigNumber.from(balances[0].raw.toString())
      )
    ) {
      return true;
    }
    if (
      BigNumber.from(parsedTokenAmounts[Field.OUTPUT]?.raw.toString()).gt(
        BigNumber.from(balances[1].raw.toString())
      )
    ) {
      return true;
    }
    return false;
  }, [tokens, tokenAmounts, parsedTokenAmounts]);

  const isNeedApproved: boolean = useMemo(
    () => (tokensNeedApproved.length > 0 ? true : false),
    [tokensNeedApproved]
  );

  const onAddLiquidityCallback = useCallback(async () => {
    try {
      setSubmitting(true);
      await addLiquidityCallback(account, library, tokens, parsedTokenAmounts);
      setReloadPool((pre) => !pre);
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }, [account, library, tokens, parsedTokenAmounts]);

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
      onAddLiquidityCallback();
    }
  };

  const buttonText = useMemo((): string => {
    if (!account) return "Connect wallet";
    if (
      !parsedTokenAmounts[Field.INPUT] ||
      !parsedTokenAmounts[Field.OUTPUT] ||
      !balances?.[0] ||
      !balances?.[1]
    )
      return "Add liquidity";
    if (
      BigNumber.from(parsedTokenAmounts[Field.INPUT]?.raw.toString()).gt(
        BigNumber.from(balances[0].raw.toString())
      )
    ) {
      return `Insufficient ${tokens[Field.INPUT]?.symbol} balance`;
    }
    if (
      BigNumber.from(parsedTokenAmounts[Field.OUTPUT]?.raw.toString()).gt(
        BigNumber.from(balances[1].raw.toString())
      )
    ) {
      return `Insufficient ${tokens[Field.OUTPUT]?.symbol} balance`;
    }
    if (isNeedApproved) return "Approve tokens";
    return "Add liquidity";
  }, [isNeedApproved, parsedTokenAmounts, balances, account]);

  return (
    <Box>
      <ListTokensModal
        isOpen={isOpen}
        onClose={onClose}
        callback={handleSelectToken}
      />

      <VStack justify="center">
        <VStack
          align="stretch"
          spacing="4"
          w={{ base: "100%", lg: "24em" }}
          p="6"
          borderRadius="3xl"
          bg="#0a2d74b3"
          border="2px solid #00ADEE"
        >
          <Box>
            <Box
              bg="gray.200"
              borderRadius="3xl"
              fontWeight="bold"
              fontSize="lg"
              textAlign="center"
              pos="relative"
              bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
              px="4"
              py="4"
            >
              <Icon
                as={IoArrowBack}
                w="6"
                h="6"
                pos="absolute"
                left="4"
                cursor="pointer"
                onClick={() => router.push("/liquidity")}
              />
              Add Liquidity
            </Box>
          </Box>
          <Box p="4" border="2px solid #00ADEE" borderRadius="3xl">
            <HStack justify="flex-end">
              {balances?.[0] && (
                <Box>Balance: {balances?.[0]?.toSignificant(6)}</Box>
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
                  value={tokenAmounts[Field.INPUT]}
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
          <HStack justify="space-between">
            <Icon
              h="8"
              w="8"
              as={IoIosAdd}
              cursor="pointer"
              border="2px solid #00ADEE"
              p="1"
              borderRadius="3em"
            />
            {tokens[Field.INPUT] && tokens[Field.OUTPUT] && (
              <HStack>
                <Icon
                  h="8"
                  w="8"
                  as={AiOutlineSwap}
                  cursor="pointer"
                  border="2px solid #00ADEE"
                  p="1"
                  borderRadius="3em"
                  onClick={() => {
                    if (typePrice === Field.INPUT)
                      return setTypePrice(Field.OUTPUT);
                    return setTypePrice(Field.INPUT);
                  }}
                />
                <Box>
                  {typePrice === Field.INPUT
                    ? `1 ${tokens[Field.INPUT]?.symbol} ~ ${
                        poolInfo.prices[Field.INPUT]?.toSignificant(6) ?? "0"
                      }`
                    : `1 ${tokens[Field.OUTPUT]?.symbol} ~ ${
                        poolInfo.prices[Field.OUTPUT]?.toSignificant(6) ?? "0"
                      }`}
                </Box>
              </HStack>
            )}
          </HStack>
          <Box p="4" border="2px solid #00ADEE" borderRadius="3xl">
            <HStack justify="flex-end">
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
                  value={tokenAmounts[Field.OUTPUT]}
                  onChange={(e) =>
                    handleChangeAmounts(e.target.value, Field.OUTPUT)
                  }
                />
                {tokens[Field.OUTPUT] && (
                  <Button
                    pos="absolute"
                    right="0"
                    top="0"
                    transform="translateY(25%);"
                    size="xs"
                    onClick={() => {
                      tokens[Field.OUTPUT] &&
                        balances?.[1] &&
                        handleChangeAmounts(
                          formatUnits(
                            balances[1].raw.toString(),
                            tokens[Field.OUTPUT]?.decimals
                          ),
                          Field.OUTPUT
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

          {/* {tokens[Field.INPUT] && tokens[Field.OUTPUT] && (
            <Box>
              <Box>
                {poolInfo.noLiquidity ? "create pool" : "prices and pool share"}
              </Box>
              <Grid templateColumns="repeat(3,1fr)" placeItems="center">
                <Box textAlign="center">
                  <Box>
                    {poolInfo.prices[Field.INPUT]?.toSignificant(6) ?? "0"}
                  </Box>
                  <Box>
                    {tokens[Field.INPUT]?.symbol}/{tokens[Field.OUTPUT]?.symbol}
                  </Box>
                </Box>
                <Box textAlign="center">
                  <Box>
                    {poolInfo.prices[Field.OUTPUT]?.toSignificant(6) ?? "0"}
                  </Box>
                  <Box>
                    {tokens[Field.OUTPUT]?.symbol}/{tokens[Field.INPUT]?.symbol}
                  </Box>
                </Box>
              </Grid>
            </Box>
          )} */}
          {tokens[Field.INPUT] && tokens[Field.OUTPUT] && (
            <VStack
              align="stretch"
              p="4"
              border="2px solid #00ADEE"
              borderRadius="3xl"
            >
              <HStack justify="space-between">
                <Box>Share of Pool</Box>
                <Box>{poolInfo.shareOfPool?.toSignificant(2) ?? "0"}%</Box>
              </HStack>

              {poolInfo.totalSupply &&
                parsedTokenAmounts[Field.INPUT]?.raw.toString() !== "0" &&
                parsedTokenAmounts[Field.OUTPUT]?.raw.toString() !== "0" && (
                  <HStack justify="space-between">
                    <Box>LP tokens minted</Box>
                    <Box>
                      {poolInfo.totalSupply &&
                        parsedTokenAmounts[Field.INPUT] &&
                        parsedTokenAmounts[Field.OUTPUT] &&
                        poolInfo?.pair
                          ?.getLiquidityMinted(
                            poolInfo.totalSupply as TokenAmount,
                            parsedTokenAmounts[Field.INPUT] as TokenAmount,
                            parsedTokenAmounts[Field.OUTPUT] as TokenAmount
                          )
                          .toSignificant(6)}
                    </Box>
                  </HStack>
                )}
            </VStack>
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
              {buttonText}
            </Button>
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
};

export default AddLiquidity;
