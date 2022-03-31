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
import { Field, ROUTER_ADDRESS } from "@/configs/networks";
import { parseUnits, formatUnits } from "@ethersproject/units";
import { approves, getAllowances } from "@/state/erc20";
import { IoIosArrowDown, IoIosAdd } from "react-icons/io";
import { AiOutlineSwap } from "react-icons/ai";

const AddLiquidity: NextPage = () => {
  const { account, library } = useActiveWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [tokens, setTokens] = useState<{ [key in Field]: Token | undefined }>({
    [Field.INPUT]: undefined,
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

  // console.count("render");
  // useEffect(() => {
  //   chainId && setToken0(WETH[chainId]);
  // }, [chainId]);

  const [tokensNeedApproved, setTokensNeedApproved] = useState<Token[]>([]);

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
      )
    )
      return true;
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
          <Box p="4" bg="gray.100" borderRadius="xl">
            <HStack justify="flex-end">
              <Box>balance: {balances?.[0]?.toSignificant(6)}</Box>
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
                value={tokenAmounts[Field.INPUT]}
                onChange={(e) =>
                  handleChangeAmounts(e.target.value, Field.INPUT)
                }
              />
            </HStack>
          </Box>
          <HStack justify="space-between" p="4">
            <Icon
              h="8"
              w="8"
              as={IoIosAdd}
              cursor="pointer"
              bg="gray.100"
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
                  bg="gray.100"
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
          <Box p="4" bg="gray.100" borderRadius="xl">
            <HStack justify="flex-end">
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
                value={tokenAmounts[Field.OUTPUT]}
                onChange={(e) =>
                  handleChangeAmounts(e.target.value, Field.OUTPUT)
                }
              />
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
              bg="gray.100"
              borderRadius="xl"
              mt="4"
              fontSize="xs"
            >
              <HStack justify="space-between">
                <Box>Share of Pool</Box>
                <Box>{poolInfo.shareOfPool?.toSignificant(2) ?? "0"}%</Box>
              </HStack>

              {poolInfo.totalSupply &&
                parsedTokenAmounts[Field.INPUT]?.raw.toString() !== "0" &&
                parsedTokenAmounts[Field.OUTPUT]?.raw.toString() !== "0" && (
                  <HStack>
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

          <Box pt="4">
            <Button
              colorScheme="teal"
              w="100%"
              isDisabled={isDisableBtn}
              isLoading={submitting}
              onClick={onSubmit}
            >
              {isNeedApproved ? "approve tokens" : "add liquidity"}
            </Button>
          </Box>
        </Box>
      </HStack>
    </Box>
  );
};

export default AddLiquidity;
