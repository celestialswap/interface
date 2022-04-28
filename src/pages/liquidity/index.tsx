import Pool from "@/components/liquidity/Pool";
import { APP_ROUTE } from "@/configs/index";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { getOwnerLiquidityPools, PoolState } from "@/state/liquidity";
import { Box, Button, Grid, VStack } from "@chakra-ui/react";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import useCurrentRoute from "@/hooks/useCurrentRoute";

const Liquidity: NextPage = () => {
  const { account, library } = useActiveWeb3React();
  const currentRoute = useCurrentRoute();

  const [ownerPools, setOwnerPools] = useState<PoolState[]>([]);
  const [reload, setReload] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    getOwnerLiquidityPools(library, account)
      .then((res) => isMounted && setOwnerPools(res as any))
      .catch(console.error);
    return () => {
      isMounted = false;
    };
  }, [account, library, reload]);

  return (
    <Box>
      <VStack>
        <Grid
          templateColumns="repeat(2,1fr)"
          bg="gray.300"
          p="1"
          borderRadius="3xl"
          gap="1"
          mb="8"
        >
          <Link href="/swap">
            <Box
              cursor="pointer"
              bg={currentRoute === APP_ROUTE.SWAP ? "teal" : ""}
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
              bg={currentRoute === APP_ROUTE.LIQUIDITY ? "teal" : ""}
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

        <Box
          w="24em"
          border="1px solid"
          borderColor="gray.200"
          p="6"
          borderRadius="3xl"
        >
          <Link href="/liquidity/add" passHref>
            <Button
              colorScheme="teal"
              borderRadius="3xl"
              w="100%"
              py="6"
              fontWeight="bold"
              fontSize="lg"
              mb="4"
            >
              Add Liquidity
            </Button>
          </Link>
          <Box fontWeight="semibold">Your Liquidity</Box>
          <VStack align="stretch">
            {ownerPools.map((pool, i) => (
              <Pool key={i} pool={pool} setReload={setReload} />
            ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Liquidity;
