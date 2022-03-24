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
import { Field, ROUTER_ADDRESSES } from "@/configs/networks";
import { parseUnits, formatUnits } from "@ethersproject/units";
import { approves, getAllowances } from "@/state/erc20";

const AddLiquidity: NextPage = () => {
  const { chainId, account, library } = useActiveWeb3React();
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

  // console.count("render");
  // useEffect(() => {
  //   chainId && setToken0(WETH[chainId]);
  // }, [chainId]);

  const [tokensNeedApproved, setTokensNeedApproved] = useState<Token[]>([]);

  useEffect(() => {
    (async () => {
      if (!account || !chainId) return;
      try {
        const [balances, poolInfo] = await Promise.all([
          getCurrencyBalances(chainId, account, library, [
            tokens[Field.INPUT],
            tokens[Field.OUTPUT],
          ]),
          getPoolInfo(chainId, account, library, [
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
  }, [account, library, chainId, tokens, reloadPool]);

  useEffect(() => {
    if (!account || !chainId) return;
    getAllowances(
      chainId,
      library,
      account,
      ROUTER_ADDRESSES[chainId],
      [tokens[Field.INPUT], tokens[Field.OUTPUT]],
      [parsedTokenAmounts[Field.INPUT], parsedTokenAmounts[Field.OUTPUT]]
    )
      .then(setTokensNeedApproved)
      .catch(console.error);
  }, [account, library, chainId, tokens, parsedTokenAmounts]);

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
      await addLiquidityCallback(
        chainId,
        account,
        library,
        tokens,
        parsedTokenAmounts
      );
      setReloadPool((pre) => !pre);
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }, [chainId, account, library, tokens, parsedTokenAmounts]);

  const onApproveTokens = useCallback(async () => {
    try {
      if (!chainId || !account || !library || !ROUTER_ADDRESSES[chainId])
        return;
      setSubmitting(true);
      const result = await approves(
        chainId,
        library,
        account,
        ROUTER_ADDRESSES[chainId],
        tokensNeedApproved
      );
      if (result) setTokensNeedApproved([]);
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }, [chainId, account, library, tokensNeedApproved]);

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
        <Box w="24em">
          <VStack align="stretch">
            <Box>
              <HStack justify="flex-end">
                <Box>balance: {balances?.[0]?.toSignificant(6)}</Box>
              </HStack>
              <InputGroup size="sm">
                <Input
                  type="number"
                  value={tokenAmounts[Field.INPUT]}
                  onChange={(e) =>
                    handleChangeAmounts(e.target.value, Field.INPUT)
                  }
                />
                {tokens[Field.INPUT] && (
                  <InputRightAddon
                    // eslint-disable-next-line react/no-children-prop
                    children={
                      <Box _hover={{ color: "gray.500", cursor: "pointer" }}>
                        max
                      </Box>
                    }
                  />
                )}
                <InputRightAddon
                  // eslint-disable-next-line react/no-children-prop
                  children={
                    <Box
                      _hover={{ color: "gray.500", cursor: "pointer" }}
                      onClick={() => handleOpenModal(Field.INPUT)}
                    >
                      {tokens[Field.INPUT]?.symbol ?? "select a token"}
                    </Box>
                  }
                />
              </InputGroup>
            </Box>
            <Box textAlign="center">+</Box>
            <Box>
              <HStack justify="flex-end">
                <Box>balance: {balances?.[1]?.toSignificant(6)}</Box>
              </HStack>
              <InputGroup size="sm">
                <Input
                  type="number"
                  value={tokenAmounts[Field.OUTPUT]}
                  onChange={(e) =>
                    handleChangeAmounts(e.target.value, Field.OUTPUT)
                  }
                />
                {tokens[Field.OUTPUT] && (
                  <InputRightAddon
                    // eslint-disable-next-line react/no-children-prop
                    children={
                      <Box _hover={{ color: "gray.500", cursor: "pointer" }}>
                        max
                      </Box>
                    }
                  />
                )}
                <InputRightAddon
                  // eslint-disable-next-line react/no-children-prop
                  children={
                    <Box
                      _hover={{ color: "gray.500", cursor: "pointer" }}
                      onClick={() => handleOpenModal(Field.OUTPUT)}
                    >
                      {tokens[Field.OUTPUT]?.symbol ?? "select a token"}
                    </Box>
                  }
                />
              </InputGroup>
            </Box>

            {tokens[Field.INPUT] && tokens[Field.OUTPUT] && (
              <Box>
                <Box>
                  {poolInfo.noLiquidity
                    ? "create pool"
                    : "prices and pool share"}
                </Box>
                <Grid templateColumns="repeat(3,1fr)" placeItems="center">
                  <Box textAlign="center">
                    <Box>
                      {poolInfo.prices[Field.INPUT]?.toSignificant(6) ?? "0"}
                    </Box>
                    <Box>
                      {tokens[Field.INPUT]?.symbol}/
                      {tokens[Field.OUTPUT]?.symbol}
                    </Box>
                  </Box>
                  <Box textAlign="center">
                    <Box>
                      {poolInfo.prices[Field.OUTPUT]?.toSignificant(6) ?? "0"}
                    </Box>
                    <Box>
                      {tokens[Field.OUTPUT]?.symbol}/
                      {tokens[Field.INPUT]?.symbol}
                    </Box>
                  </Box>

                  <Box textAlign="center">
                    <Box>{poolInfo.shareOfPool?.toSignificant(2) ?? "0"}%</Box>
                    <Box>Share of Pool</Box>
                  </Box>
                </Grid>
              </Box>
            )}
            {poolInfo.totalSupply &&
              parsedTokenAmounts[Field.INPUT] &&
              parsedTokenAmounts[Field.OUTPUT] && (
                <Box>
                  LP tokens minted:{" "}
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
          </VStack>
        </Box>
      </HStack>
    </Box>
  );
};

export default AddLiquidity;
