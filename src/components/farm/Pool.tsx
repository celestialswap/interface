import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { FarmPool, getPool } from "@/state/farm";
import {
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { parseEther } from "@ethersproject/units";
import React, { useEffect, useState } from "react";

const Pool = ({ pid }: { pid: number }) => {
  const { account, library } = useActiveWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [loading, setLoading] = useState<boolean>(true);
  const [pool, setPool] = useState<FarmPool>();

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
  }, [pid, account, library]);

  return (
    <>
      {pool && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>add lp token to farm</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box>balance: {pool.lpBalance?.toString()}</Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
      {loading ? (
        <Skeleton h="16" />
      ) : pool ? (
        <Grid templateColumns="repeat(26  ,1fr)" gap="4">
          <GridItem colSpan={6}>
            {pool.tokens.token0.symbol} - {pool.tokens.token1.symbol}
          </GridItem>
          <GridItem colSpan={6}>{pool.pendingReward?.toString()}</GridItem>
          <GridItem colSpan={6}>--</GridItem>
          <GridItem colSpan={6}>--</GridItem>
          <GridItem colSpan={2}></GridItem>
          <GridItem colSpan={12}>
            <HStack justify="space-between">
              {/* <Box>
                deposited:{" "}
                {!!pool.userInfo
                  ? pool.userInfo.amount.toString() / 1e18
                  : "--"}
              </Box> */}
              <Button colorScheme="teal" size="sm" onClick={onOpen}>
                start farming
              </Button>
            </HStack>
          </GridItem>
          <GridItem colStart={16} colSpan={12}>
            <HStack justify="space-between">
              <Box>pending reward: {pool.pendingReward?.toString()}</Box>
              <Button colorScheme="teal" size="sm">
                harvest
              </Button>
            </HStack>
          </GridItem>
        </Grid>
      ) : null}
    </>
  );
};

export default Pool;
