import Pool from "@/components/liquidity/Pool";
import { APP_ROUTE } from "@/configs/index";
import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { getOwnerLiquidityPools, PoolState } from "@/state/liquidity";
import { Box, Button, Grid, HStack, Icon, VStack } from "@chakra-ui/react";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import useCurrentRoute from "@/hooks/useCurrentRoute";
import { AiOutlineSwap } from "react-icons/ai";
import { IoAdd } from "react-icons/io5";
import { BiMinus } from "react-icons/bi";

const Liquidity: NextPage = () => {
  const { account, library } = useActiveWeb3React();
  const currentRoute = useCurrentRoute();

  const [loading, setLoading] = useState<boolean>(true);
  const [ownerPools, setOwnerPools] = useState<PoolState[]>([]);

  useEffect(() => {
    let isMounted = true;
    getOwnerLiquidityPools(library, account)
      .then((res) => {
        isMounted && setOwnerPools(res as any);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
      });
    return () => {
      isMounted = false;
    };
  }, [account, library]);

  return (
    <Box>
      <VStack>
        <Grid
          templateColumns="repeat(2,1fr)"
          bg="#0a2d74b3"
          p="1"
          borderRadius="3xl"
          gap="1"
          mb="8"
          border="2px solid #00ADEE"
        >
          <Link href="/swap">
            <Box
              cursor="pointer"
              bgImage={
                currentRoute === APP_ROUTE.SWAP
                  ? "linear-gradient(90deg,#00ADEE,#24CBFF)"
                  : ""
              }
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
              bgImage={
                currentRoute === APP_ROUTE.LIQUIDITY
                  ? "linear-gradient(90deg,#00ADEE,#24CBFF)"
                  : ""
              }
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

        <VStack
          align="stretch"
          w={{ base: "100%", lg: "24em" }}
          bg="#0a2d74b3"
          border="2px solid #00ADEE"
          p="6"
          borderRadius="3xl"
          color="white"
          spacing="4"
        >
          <HStack>
            <Link href="/liquidity/add" passHref>
              <HStack
                bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
                p="3"
                borderRadius="3xl"
                cursor="pointer"
                w="24"
                justify="center"
              >
                {/* <Icon as={IoAdd} w="6" h="6" /> */}
                <Box fontWeight="bold">Add</Box>
              </HStack>
            </Link>
            <Link href="/liquidity/remove" passHref>
              <HStack
                bg="#c53f45e6"
                p="3"
                borderRadius="3xl"
                cursor="pointer"
                w="24"
                justify="center"
              >
                {/* <Icon as={BiMinus} w="6" h="6" /> */}
                <Box fontWeight="bold">Remove</Box>
              </HStack>
            </Link>
            {/* <Link href="/liquidity/remove" passHref>
              <Box
                borderRadius="3xl"
                w="100%"
                fontWeight="bold"
                fontSize="lg"
                mb="4"
                bgImage="linear-gradient(90deg,#c53f45e6,#cf565b)"
                px="4"
                py="4"
                cursor="pointer"
                textAlign="center"
              >
                Remove
              </Box>
            </Link> */}
          </HStack>
          <Box fontWeight="semibold">Your Liquidity</Box>

          <Box color="white">
            {loading ? (
              <Box>Loading...</Box>
            ) : ownerPools.length ? (
              <VStack align="stretch">
                {ownerPools.map((pool, i) => (
                  <Pool key={i} pool={pool} />
                ))}
              </VStack>
            ) : (
              <Box>No pool</Box>
            )}
          </Box>
        </VStack>
      </VStack>
    </Box>
  );
};

export default Liquidity;
