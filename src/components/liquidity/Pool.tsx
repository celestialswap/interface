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
}

const Pool = ({ pool }: PoolProps) => {
  const [isExpand, setIsExpand] = useState<boolean>(false);

  return (
    <VStack
      align="stretch"
      spacing="4"
      border="2px solid #00ADEE"
      borderRadius="3xl"
      p="4"
    >
      <HStack justify="space-between">
        <HStack spacing="4">
          <HStack spacing="1">
            <Image
              src={`/images/${pool.pair?.token0.symbol}.svg`}
              fallbackSrc="/images/anonymous-token.svg"
              alt="icon"
              w="6"
              h="6"
            />
            <Image
              src={`/images/${pool.pair?.token1.symbol}.svg`}
              fallbackSrc="/images/anonymous-token.svg"
              alt="icon"
              w="6"
              h="6"
            />
          </HStack>
          <HStack spacing="1" fontWeight="bold">
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
            <Box fontWeight="bold">{pool.shareOfPool?.toSignificant(6)}%</Box>
          </HStack>
          <HStack justify="space-between">
            <Box>{pool.pair?.token0?.symbol}</Box>
            <Box fontWeight="bold">
              {pool.shareOfPool &&
                pool.pair?.reserve0 &&
                pool.shareOfPool.multiply(pool.pair?.reserve0).toSignificant(6)}
            </Box>
          </HStack>
          <HStack justify="space-between">
            <Box>{pool.pair?.token1?.symbol}</Box>
            <Box fontWeight="bold">
              {pool.shareOfPool &&
                pool.pair?.reserve1 &&
                pool.shareOfPool.multiply(pool.pair?.reserve1).toSignificant(6)}
            </Box>
          </HStack>

          <HStack pt="2" color="white">
            {/* <Link href="/liquidity/add" passHref>
              <HStack bg="#00ADEE" p="3" borderRadius="3xl" cursor="pointer">
                <Icon as={AiOutlineSwap} w="4" h="4" />
              </HStack>
            </Link> */}
            <Link href="/liquidity/add" passHref>
              <HStack bg="#00ADEE" p="3" borderRadius="3xl" cursor="pointer">
                <Icon as={IoAdd} w="4" h="4" />
              </HStack>
            </Link>
            <Link href="/liquidity/remove" passHref>
              <HStack bg="#c53f45e6" p="3" borderRadius="3xl" cursor="pointer">
                <Icon as={BiMinus} w="4" h="4" />
              </HStack>
            </Link>
          </HStack>
        </>
      )}
    </VStack>
  );
};

export default Pool;
