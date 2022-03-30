import { Field, ROUTER_ADDRESS } from "@/configs/networks";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { callContract, getPairContract } from "@/hooks/useContract";
import { PoolState, removeLiquidityCallback } from "@/state/liquidity";
import {
  Box,
  Button,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Tooltip,
} from "@chakra-ui/react";
import { BigNumber } from "@ethersproject/bignumber";
import { Dispatch, SetStateAction, useCallback, useState } from "react";

interface PoolProps {
  pool: PoolState;
  setReload: Dispatch<SetStateAction<boolean>>;
}

const Pool = ({ pool, setReload }: PoolProps) => {
  const { account, library } = useActiveWeb3React();

  const [removePercent, setRemovePercent] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

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
    <Box
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      py="2"
      px="4"
    >
      <Box>pair: {pool.pair?.liquidityToken.address}</Box>
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
      <Box>share of pool: {pool.shareOfPool?.toSignificant(6)}%</Box>
      <hr />
      <Box mt="2">
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
        <Box mt="3" textAlign="center">
          <Button
            size="sm"
            colorScheme="orange"
            isLoading={submitting}
            loadingText="submitting"
            onClick={onRemoveLiquidityCallback}
          >
            remove liquidity
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Pool;
