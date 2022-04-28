import { Field, ROUTER_ADDRESS } from "@/configs/networks";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { callContract, getPairContract } from "@/hooks/useContract";
import { PoolState, removeLiquidityCallback } from "@/state/liquidity";
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
  VStack,
} from "@chakra-ui/react";
import { BigNumber } from "@ethersproject/bignumber";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { BiMinus } from "react-icons/bi";
import { IoAdd } from "react-icons/io5";
import Link from "next/link";
import { AiOutlineSwap } from "react-icons/ai";

interface PoolProps {
  pool: PoolState;
  setReload: Dispatch<SetStateAction<boolean>>;
}

const Pool = ({ pool, setReload }: PoolProps) => {
  // console.log(pool.pair?.token0.symbol);
  const { account, library } = useActiveWeb3React();

  const [removePercent, setRemovePercent] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isExpand, setIsExpand] = useState<boolean>(false);

  const onRemoveLiquidityCallback = useCallback(() => {
    (async () => {
      try {
        if (
          !account ||
          !library ||
          !pool.pair ||
          !pool.balanceOf ||
          removePercent === 0
        )
          return;
        const removeAmount = BigNumber.from(pool.balanceOf.raw.toString())
          .mul(BigNumber.from(removePercent.toString()))
          .div(BigNumber.from("100"));
        setSubmitting(true);
        await removeLiquidityCallback(
          account,
          library,
          pool.pair,
          removeAmount
        );
        setReload((pre) => !pre);
        setSubmitting(false);
      } catch (error) {
        setSubmitting(false);
        console.log(error);
      }
    })();
  }, [account, library, pool, removePercent, setReload]);

  return (
    <VStack
      align="stretch"
      spacing="4"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      p="4"
    >
      <HStack justify="space-between">
        <HStack spacing="4">
          <HStack spacing="1">
            <Image
              src="/anonymous-token.svg"
              fallbackSrc="/images/anonymous-token.svg"
              alt="icon"
            />
            <Image
              src="/anonymous-token.svg"
              fallbackSrc="/images/anonymous-token.svg"
              alt="icon"
            />
          </HStack>
          <HStack spacing="1">
            <Box>{pool.pair?.token0.symbol}</Box>
            <Box>/</Box>
            <Box>{pool.pair?.token1.symbol}</Box>
          </HStack>
        </HStack>

        <VStack>
          <Icon
            cursor="pointer"
            w="4"
            h="4"
            as={isExpand ? IoIosArrowUp : IoIosArrowDown}
            onClick={() => setIsExpand((pre) => !pre)}
          />
        </VStack>
      </HStack>
      {/* <Box>pair: {pool.pair?.liquidityToken.address}</Box>
      <Box>
        token0: {pool.pair?.token0?.symbol} - {pool.pair?.token0?.name} -{" "}
        {pool.pair?.token0?.decimals}
      </Box>
      <Box>
        token1: {pool.pair?.token1?.symbol} - {pool.pair?.token1?.symbol} -{" "}
        {pool.pair?.token1?.decimals}
      </Box>
      <Box>token0/token1: {pool.prices?.[Field.INPUT]?.toSignificant(6)}</Box>
      <Box>token1/token0: {pool.prices?.[Field.OUTPUT]?.toSignificant(6)}</Box>
      <Box>share of pool: {pool.shareOfPool?.toSignificant(6)}%</Box> */}
      {isExpand && (
        <>
          <HStack justify="space-between">
            <Box>Share of pool</Box>
            <Box>{pool.shareOfPool?.toSignificant(6)}%</Box>
          </HStack>
          <HStack justify="space-between">
            <Box>{pool.pair?.token0?.symbol}</Box>
            <Box>
              {pool.shareOfPool &&
                pool.pair?.reserve0 &&
                pool.shareOfPool.multiply(pool.pair?.reserve0).toSignificant(6)}
            </Box>
          </HStack>
          <HStack justify="space-between">
            <Box>{pool.pair?.token1?.symbol}</Box>
            <Box>
              {pool.shareOfPool &&
                pool.pair?.reserve1 &&
                pool.shareOfPool.multiply(pool.pair?.reserve1).toSignificant(6)}
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
          <HStack pt="2">
            <Link href="/liquidity/add" passHref>
              <Button
                size="sm"
                colorScheme="telegram"
                isLoading={submitting}
                borderRadius="lg"
              >
                <Icon as={AiOutlineSwap} w="4" h="4" />
              </Button>
            </Link>

            <Link href="/liquidity/add" passHref>
              <Button
                size="sm"
                colorScheme="teal"
                isLoading={submitting}
                borderRadius="lg"
              >
                <Icon as={IoAdd} w="4" h="4" />
              </Button>
            </Link>

            <Button
              size="sm"
              colorScheme="orange"
              isLoading={submitting}
              onClick={onRemoveLiquidityCallback}
              borderRadius="lg"
            >
              <Icon as={BiMinus} w="4" h="4" />
            </Button>
          </HStack>
        </>
      )}
    </VStack>
  );
};

export default Pool;
