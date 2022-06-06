import { MASTER_CHIEF_ADDRESS } from '@/configs/networks';
import { useActiveWeb3React } from '@/hooks/useActiveWeb3React';
import { approves, getAllowances } from '@/state/erc20';
import { FarmPool, getPool, harvest, startFarming } from '@/state/farm';
import {
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Skeleton,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Stack,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { BigNumber } from '@ethersproject/bignumber';
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from '@ethersproject/units';
import { Token, TokenAmount } from '@uniswap/sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

const Pool = ({ pid }: { pid: number }) => {
  const { account, library } = useActiveWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [loading, setLoading] = useState<boolean>(true);
  const [pool, setPool] = useState<FarmPool>();
  const [farmingAmount, setFarmingAmount] = useState<TokenAmount>();
  const [lockTime, setLockTime] = useState<number>(1);
  const [tokensNeedApproved, setTokensNeedApproved] = useState<Token[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [harvesting, setHarvesting] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [isExpand, setIsExpand] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  useEffect(() => {
    if (!account || !library) return;
    getAllowances(
      library,
      account,
      MASTER_CHIEF_ADDRESS,
      [pool?.lpToken],
      [farmingAmount]
    )
      .then(setTokensNeedApproved)
      .catch(console.error);
  }, [account, library, pool, farmingAmount]);

  useEffect(() => {
    (async () => {
      try {
        if (!library) return;
        setLoading(true);
        const pool = await getPool(pid, library, account);
        setPool(pool);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [pid, account, library, refresh]);

  const onApproveTokens = useCallback(async () => {
    try {
      if (!account || !library) return;
      setSubmitting(true);
      const result = await approves(
        library,
        account,
        MASTER_CHIEF_ADDRESS,
        tokensNeedApproved
      );
      if (result) setTokensNeedApproved([]);
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }, [account, library, tokensNeedApproved]);

  const onStartFarmingCallback = useCallback(async () => {
    try {
      if (!account || !library) return;
      setSubmitting(true);
      await startFarming(library, account, pid, farmingAmount, lockTime);
      setRefresh((pre) => !pre);
      setSubmitting(false);
      onClose();
    } catch (error: any) {
      console.error(error);
      typeof error.data?.message === 'string' && alert(error.data.message);
      onClose();
      setSubmitting(false);
    }
  }, [account, library, pid, farmingAmount, lockTime, onClose]);

  const onHarvestCallback = useCallback(async () => {
    try {
      if (!account || !library) return;
      setHarvesting(true);
      await harvest(library, account, pid, pool?.pendingReward);
      setRefresh((pre) => !pre);
      setHarvesting(false);
    } catch (error: any) {
      console.error(error);
      typeof error.data?.message === 'string' && alert(error.data.message);
      setHarvesting(false);
    }
  }, [account, library, pid, pool]);

  const isNeedApproved: boolean = useMemo(
    () => (tokensNeedApproved.length > 0 ? true : false),
    [tokensNeedApproved]
  );

  const onSubmit = () => {
    if (isNeedApproved) {
      onApproveTokens();
    } else {
      onStartFarmingCallback();
    }
  };

  return (
    <>
      {pool && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent
            border="2px solid #00ADEE"
            borderRadius="3xl"
            bg="#0a2d74e6"
            color="white"
            pb="4"
          >
            <ModalHeader>add lp token to farm</ModalHeader>
            <ModalCloseButton borderRadius="3xl" _focus={{}} />
            <ModalBody>
              <VStack spacing="4" justify="stretch" align="stretch">
                <Box>balance: {pool.lpBalance?.toSignificant(10)}</Box>
                <Input
                  type="number"
                  outline="2px solid #00ADEE"
                  border="none"
                  borderRadius="3xl"
                  placeholder="enter an amount"
                  value={farmingAmount?.toSignificant(10) ?? ''}
                  onChange={(e) => {
                    if (!e.target.value) return setFarmingAmount(undefined);
                    if (!pool.lpBalance) return;
                    const parsedAmount = parseUnits(
                      e.target.value,
                      pool.lpBalance.token.decimals
                    );
                    BigNumber.from(pool.lpBalance.raw.toString()).gte(
                      BigNumber.from(parsedAmount)
                    ) &&
                      setFarmingAmount(
                        new TokenAmount(
                          pool.lpBalance.token,
                          parsedAmount.toString()
                        )
                      );
                  }}
                />

                <Slider
                  id="slider"
                  value={lockTime}
                  min={0}
                  max={20}
                  colorScheme="#00ADEE"
                  onChange={(v) => setLockTime(v)}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <SliderMark value={5} mt="1" ml="-2.5" fontSize="sm">
                    5
                  </SliderMark>
                  <SliderMark value={10} mt="1" ml="-2.5" fontSize="sm">
                    10
                  </SliderMark>
                  <SliderMark value={15} mt="1" ml="-2.5" fontSize="sm">
                    15
                  </SliderMark>
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <Tooltip
                    hasArrow
                    bg="#00ADEE"
                    color="white"
                    placement="top"
                    isOpen={showTooltip}
                    label={`${lockTime} days`}
                  >
                    <SliderThumb />
                  </Tooltip>
                </Slider>

                <Box pt="2">
                  <Button
                    w="100%"
                    isLoading={submitting}
                    onClick={onSubmit}
                    bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
                    _hover={{}}
                    _focus={{}}
                    borderRadius="3xl"
                  >
                    {isNeedApproved ? 'approve lp token' : 'start farming'}
                  </Button>
                </Box>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
      {loading ? (
        <Skeleton h="16" startColor="#00ADEE" endColor="#00ADEE" />
      ) : pool ? (
        <Grid
          templateColumns="repeat(25,1fr)"
          gap="4"
          px="6"
          py="4"
          border="2px solid #00ADEE"
          borderRadius="3xl"
        >
          <GridItem colSpan={8}>
            {pool.tokens.token0.symbol} - {pool.tokens.token1.symbol}
          </GridItem>
          <GridItem colSpan={8}>
            {pool.pendingReward && pool.lpToken
              ? new TokenAmount(
                  pool.lpToken,
                  pool.pendingReward.toString()
                ).toSignificant(8)
              : '0'}
          </GridItem>
          <GridItem colSpan={4}>--</GridItem>
          <GridItem colSpan={4}>--</GridItem>
          <GridItem>
            <HStack h="100%">
              <Icon
                cursor="pointer"
                w="4"
                h="4"
                as={isExpand ? IoIosArrowUp : IoIosArrowDown}
                onClick={() => setIsExpand((pre) => !pre)}
              />
            </HStack>
          </GridItem>
          {isExpand && (
            <>
              <GridItem colSpan={10}>
                <HStack justify="space-between">
                  <VStack align="flex-start" spacing="0">
                    <Box fontSize="sm">Deposited</Box>
                    <Box>
                      {pool?.userInfo?.amount && pool.lpToken
                        ? new TokenAmount(
                            pool.lpToken,
                            pool.userInfo.amount.toString()
                          ).toSignificant(8)
                        : '0'}
                    </Box>
                  </VStack>
                  <Button
                    size="sm"
                    onClick={onOpen}
                    bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
                    _hover={{}}
                    _focus={{}}
                    borderRadius="3xl"
                    _active={{}}
                  >
                    {account ? 'Start farming' : 'Connect wallet'}
                  </Button>
                </HStack>
              </GridItem>
              <GridItem colStart={14} colEnd={24}>
                <HStack justify="space-between">
                  <VStack align="flex-start" spacing="0">
                    <Box fontSize="sm">Pending rewards</Box>
                    <Box>
                      {pool.pendingReward && pool.lpToken
                        ? new TokenAmount(
                            pool.lpToken,
                            pool.pendingReward.toString()
                          ).toSignificant(8)
                        : '0'}{' '}
                      RAY
                    </Box>
                  </VStack>
                  <Button
                    colorScheme="teal"
                    size="sm"
                    isLoading={harvesting}
                    onClick={onHarvestCallback}
                    bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
                    _hover={{}}
                    _focus={{}}
                    borderRadius="3xl"
                    _active={{}}
                  >
                    {account ? 'Harvest' : 'Connect wallet'}
                  </Button>
                </HStack>
              </GridItem>
            </>
          )}
        </Grid>
      ) : null}
    </>
  );
};

export default Pool;
