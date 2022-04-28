import ListTokensModal from "@/components/ListTokensModal";
import { Field, WETH } from "@/configs/networks";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import {
  EmptyPool,
  getPoolInfo,
  PoolState,
  removeLiquidityCallback,
} from "@/state/liquidity";
import {
  Box,
  Button,
  HStack,
  Icon,
  Image,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Tooltip,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { BigNumber } from "@ethersproject/bignumber";
import { Token } from "@uniswap/sdk";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";

const RemoveLiquidity: NextPage = () => {
  const { account, library } = useActiveWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  const [tokens, setTokens] = useState<{ [key in Field]: Token | undefined }>({
    [Field.INPUT]: WETH,
    [Field.OUTPUT]: undefined,
  });
  // const [balances, setBalances] = useState<
  //   (CurrencyAmount | undefined)[] | undefined
  // >();
  const [independentField, setIndependentField] = useState<Field>(Field.INPUT);
  const [reloadPool, setReloadPool] = useState<boolean>(false);
  const [poolInfo, setPoolInfo] = useState<PoolState>(EmptyPool);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [removePercent, setRemovePercent] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (!account || !library) return;
      try {
        const poolInfo = await getPoolInfo(account, library, [
          tokens[Field.INPUT],
          tokens[Field.OUTPUT],
        ]);
        poolInfo && setPoolInfo(poolInfo);
        // balances && setBalances(balances);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [account, library, tokens, reloadPool]);

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

  const onRemoveLiquidityCallback = useCallback(() => {
    (async () => {
      try {
        if (
          !account ||
          !library ||
          !poolInfo.pair ||
          !poolInfo.balanceOf ||
          removePercent === 0
        )
          return;
        const removeAmount = BigNumber.from(poolInfo.balanceOf.raw.toString())
          .mul(BigNumber.from(removePercent.toString()))
          .div(BigNumber.from("100"));
        setSubmitting(true);
        await removeLiquidityCallback(
          account,
          library,
          poolInfo.pair,
          removeAmount
        );
        setReloadPool((pre) => !pre);
        setSubmitting(false);
        setRemovePercent(0);
      } catch (error) {
        setSubmitting(false);
        console.log(error);
      }
    })();
  }, [account, library, poolInfo, removePercent]);

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
          border="2px solid #00ADEE"
          p="6"
          borderRadius="3xl"
          bg="#0a2d74b3"
        >
          <Box>
            <Box
              border="2px solid #00ADEE"
              p="3"
              borderRadius="3xl"
              fontWeight="bold"
              fontSize="lg"
              // color="white"
              textAlign="center"
              pos="relative"
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
              Remove Liquidity
            </Box>
          </Box>
          <HStack>
            <Box flex="1" p="4" border="2px solid #00ADEE" borderRadius="3xl">
              <HStack
                _hover={{ color: "gray.500", cursor: "pointer" }}
                onClick={() => handleOpenModal(Field.INPUT)}
                justify="space-between"
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
                <VStack>
                  <Icon w="4" h="4" as={IoIosArrowDown} />
                </VStack>
              </HStack>
            </Box>
            <Box flex="1" p="4" border="2px solid #00ADEE" borderRadius="3xl">
              <HStack
                _hover={{ color: "gray.500", cursor: "pointer" }}
                onClick={() => handleOpenModal(Field.OUTPUT)}
                justify="space-between"
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
                <VStack>
                  <Icon w="4" h="4" as={IoIosArrowDown} />
                </VStack>
              </HStack>
            </Box>
          </HStack>
          {tokens[Field.INPUT] && tokens[Field.OUTPUT] && poolInfo && (
            <>
              <HStack justify="space-between">
                <Box>Share of pool</Box>
                <Box fontWeight="bold">
                  {poolInfo.shareOfPool?.toSignificant(6)}%
                </Box>
              </HStack>
              <HStack justify="space-between">
                <Box>{poolInfo.pair?.token0?.symbol}</Box>
                <Box fontWeight="bold">
                  {poolInfo.shareOfPool &&
                    poolInfo.pair?.reserve0 &&
                    poolInfo.shareOfPool
                      .multiply(poolInfo.pair?.reserve0)
                      .toSignificant(6)}
                </Box>
              </HStack>
              <HStack justify="space-between">
                <Box>{poolInfo.pair?.token1?.symbol}</Box>
                <Box fontWeight="bold">
                  {poolInfo.shareOfPool &&
                    poolInfo.pair?.reserve1 &&
                    poolInfo.shareOfPool
                      .multiply(poolInfo.pair?.reserve1)
                      .toSignificant(6)}
                </Box>
              </HStack>
              <Slider
                id="slider"
                value={removePercent}
                min={0}
                max={100}
                colorScheme="teal"
                onChange={(v) => setRemovePercent(v)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <SliderMark value={25} mt="1" ml="-2.5" fontSize="sm">
                  25%
                </SliderMark>
                <SliderMark value={50} mt="1" ml="-2.5" fontSize="sm">
                  50%
                </SliderMark>
                <SliderMark value={75} mt="1" ml="-2.5" fontSize="sm">
                  75%
                </SliderMark>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <Tooltip
                  hasArrow
                  bg="teal.500"
                  color="white"
                  placement="top"
                  isOpen={showTooltip}
                  label={`${removePercent}%`}
                >
                  <SliderThumb />
                </Tooltip>
              </Slider>
            </>
          )}

          <Box pt="4">
            <Button
              w="100%"
              isDisabled={poolInfo.pair ? false : true}
              isLoading={submitting}
              onClick={onRemoveLiquidityCallback}
              bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
              _hover={{}}
              _focus={{}}
              borderRadius="3xl"
            >
              Remove Liquidity
            </Button>
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
};

export default RemoveLiquidity;
