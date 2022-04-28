import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import { useEagerConnect } from "@/hooks/useEagerConnect";
import { useInactiveListener } from "@/hooks/useInactiveListener";
import { useWallet } from "@/hooks/useWallet";
import { injected, walletconnect } from "@/utils/web3React";
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
  useDisclosure,
  VStack,
  Icon,
  Image as ChakraImage,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../utils";
import { CgFileDocument } from "react-icons/cg";
import {
  IoMdSettings,
  IoIosArrowForward,
  IoMdGitNetwork,
} from "react-icons/io";
import { RiFeedbackFill } from "react-icons/ri";
import { AiOutlineMenu, AiOutlineSwap } from "react-icons/ai";
import { GiFarmTractor } from "react-icons/gi";
import { FiGrid, FiCommand } from "react-icons/fi";
import useCurrentRoute from "@/hooks/useCurrentRoute";
import { APP_ROUTE } from "../configs";

const connectors = [
  {
    name: "Metamask",
    connector: injected,
    icon: "/images/metamask.svg",
  },
  {
    name: "WalletConnect",
    connector: walletconnect,
    icon: "/images/walletconnect.svg",
  },
];

const Web3Layout = ({ children }: { children: any }) => {
  const { connector, account } = useActiveWeb3React();
  const { connect } = useWallet();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const currentRoute = useCurrentRoute();
  const {
    isOpen: isOpenMenu,
    onOpen: onOpenMenu,
    onClose: onCloseMenu,
  } = useDisclosure();
  const ref = React.useRef();

  useEffect(() => {
    isOpenMenu && onCloseMenu();
  }, [currentRoute]);

  const [activatingConnector, setActivatingConnector] = useState();

  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);
  const triedEager: boolean = useEagerConnect();
  useInactiveListener(!triedEager || !!activatingConnector);

  useEffect(() => {
    connect(injected);
  }, [connect]);

  return (
    <Box
      minH="100vh"
      bgImage="/images/bg.jpg"
      bgPos="center"
      bgSize="cover"
      bgRepeat="no-repeat"
    >
      <Modal isOpen={!account && isOpen} onClose={onClose} isCentered size="xs">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connect wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns="repeat(2,1fr)" gap={4}>
              {connectors.map((connector, idx) => (
                <VStack
                  key={idx}
                  py={4}
                  justify="center"
                  _hover={{ bg: "gray.200", cursor: "pointer", opacity: 0.4 }}
                  borderRadius="3xl"
                  onClick={() => connect(connector.connector)}
                >
                  <Image
                    src={connector.icon}
                    alt="icon"
                    width="100%"
                    height="48px"
                  />
                  <Box fontWeight="semibold" textAlign="center">
                    {connector.name}
                  </Box>
                </VStack>
              ))}
            </Grid>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Drawer
        isOpen={isOpenMenu}
        placement="left"
        onClose={onCloseMenu}
        finalFocusRef={ref.current}
      >
        <DrawerOverlay />
        <DrawerContent bg="#0a2d74e6" color="white">
          <DrawerBody>
            <VStack align="stretch" spacing="1" flex="1" py="6">
              <Link href="/swap" passHref>
                <Box
                  px="4"
                  py="3"
                  borderRadius="3xl"
                  bg={
                    currentRoute === APP_ROUTE.SWAP
                      ? "rgba(0, 173, 238, 0.6)"
                      : ""
                  }
                  _hover={{
                    cursor: "pointer",
                    bg:
                      currentRoute === APP_ROUTE.SWAP
                        ? "rgba(0, 173, 238, 0.6)"
                        : "rgba(0, 173, 238, 0.2)",
                  }}
                >
                  <HStack>
                    <Icon h="6" w="6" as={AiOutlineSwap} />
                    <Box>Swap</Box>
                  </HStack>
                </Box>
              </Link>
              <Link href="/liquidity/add" passHref>
                <Box
                  px="4"
                  py="3"
                  borderRadius="3xl"
                  bg={
                    currentRoute === APP_ROUTE.ADD_LIQUIDITY
                      ? "rgba(0, 173, 238, 0.6)"
                      : ""
                  }
                  _hover={{
                    cursor: "pointer",
                    bg:
                      currentRoute === APP_ROUTE.ADD_LIQUIDITY
                        ? "rgba(0, 173, 238, 0.6)"
                        : "rgba(0, 173, 238, 0.2)",
                  }}
                >
                  <HStack>
                    <Icon h="6" w="6" as={IoMdGitNetwork} />
                    <Box>Liquidity</Box>
                  </HStack>
                </Box>
              </Link>
              <Link href="/liquidity" passHref>
                <Box
                  px="4"
                  py="3"
                  borderRadius="3xl"
                  bg={
                    currentRoute === APP_ROUTE.LIQUIDITY
                      ? "rgba(0, 173, 238, 0.6)"
                      : ""
                  }
                  _hover={{
                    cursor: "pointer",
                    bg:
                      currentRoute === APP_ROUTE.LIQUIDITY
                        ? "rgba(0, 173, 238, 0.6)"
                        : "rgba(0, 173, 238, 0.2)",
                  }}
                >
                  <HStack>
                    <Icon h="6" w="6" as={FiGrid} />
                    <Box>Pools</Box>
                  </HStack>
                </Box>
              </Link>
              <Link href="/farm" passHref>
                <Box
                  px="4"
                  py="3"
                  borderRadius="3xl"
                  bg={
                    currentRoute === APP_ROUTE.FARM
                      ? "rgba(0, 173, 238, 0.6)"
                      : ""
                  }
                  _hover={{
                    cursor: "pointer",
                    bg:
                      currentRoute === APP_ROUTE.FARM
                        ? "rgba(0, 173, 238, 0.6)"
                        : "rgba(0, 173, 238, 0.2)",
                  }}
                >
                  <HStack>
                    <Icon h="6" w="6" as={GiFarmTractor} />
                    <Box>Farm</Box>
                  </HStack>
                </Box>
              </Link>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <HStack
        h={20}
        px={{ base: 4, md: 6, lg: 8, xl: 12 }}
        justify="space-between"
        pos="fixed"
        top="0"
        left="0"
        right="0"
        zIndex="2"
        bg="rgba(0, 173, 238, 0.1)"
      >
        <HStack>
          <Icon
            as={AiOutlineMenu}
            w="8"
            h="8"
            color="white"
            cursor="pointer"
            ref={ref.current}
            onClick={onOpenMenu}
            display={{ base: "block", lg: "none" }}
          />

          <ChakraImage
            display={{ base: "none", lg: "block" }}
            src="/images/logo.png"
            w="12em"
            h="12em"
          />
          <ChakraImage
            display={{ base: "block", lg: "none" }}
            src="/images/logo-mini.png"
            w="4.5em"
            h="4.5em"
          />
        </HStack>

        <Box
          onClick={() => (account ? null : onOpen())}
          borderRadius="3xl"
          bgImage="linear-gradient(90deg,#00ADEE,#24CBFF)"
          px="4"
          py="2"
          cursor="pointer"
        >
          {account ? formatAddress(account) : "connect wallet"}
        </Box>
      </HStack>
      <Box
        w="56"
        pos="fixed"
        top="20"
        left="0"
        bottom="0"
        py="2"
        px="4"
        zIndex="2"
        fontWeight="bold"
        display={{ base: "none", lg: "block" }}
        bg="rgba(0, 173, 238, 0.1)"
        color="white"
      >
        <VStack h="100%" align="stretch" spacing="2">
          <VStack
            align="stretch"
            spacing="1"
            flex="1"
            pb="2"
            borderBottom="1px solid"
            borderColor="gray.400"
          >
            <Link href="/swap" passHref>
              <Box
                px="4"
                py="3"
                borderRadius="3xl"
                bg={
                  currentRoute === APP_ROUTE.SWAP
                    ? "rgba(0, 173, 238, 0.6)"
                    : ""
                }
                _hover={{
                  cursor: "pointer",
                  bg:
                    currentRoute === APP_ROUTE.SWAP
                      ? "rgba(0, 173, 238, 0.6)"
                      : "rgba(0, 173, 238, 0.2)",
                }}
              >
                <HStack>
                  <Icon h="6" w="6" as={AiOutlineSwap} />
                  <Box>Swap</Box>
                </HStack>
              </Box>
            </Link>
            <Link href="/liquidity/add" passHref>
              <Box
                px="4"
                py="3"
                borderRadius="3xl"
                bg={
                  currentRoute === APP_ROUTE.ADD_LIQUIDITY
                    ? "rgba(0, 173, 238, 0.6)"
                    : ""
                }
                _hover={{
                  cursor: "pointer",
                  bg:
                    currentRoute === APP_ROUTE.ADD_LIQUIDITY
                      ? "rgba(0, 173, 238, 0.6)"
                      : "rgba(0, 173, 238, 0.2)",
                }}
              >
                <HStack>
                  <Icon h="6" w="6" as={IoMdGitNetwork} />
                  <Box>Liquidity</Box>
                </HStack>
              </Box>
            </Link>
            <Link href="/liquidity" passHref>
              <Box
                px="4"
                py="3"
                borderRadius="3xl"
                bg={
                  currentRoute === APP_ROUTE.LIQUIDITY
                    ? "rgba(0, 173, 238, 0.6)"
                    : ""
                }
                _hover={{
                  cursor: "pointer",
                  bg:
                    currentRoute === APP_ROUTE.LIQUIDITY
                      ? "rgba(0, 173, 238, 0.6)"
                      : "rgba(0, 173, 238, 0.2)",
                }}
              >
                <HStack>
                  <Icon h="6" w="6" as={FiGrid} />
                  <Box>Pools</Box>
                </HStack>
              </Box>
            </Link>
            <Link href="/farm" passHref>
              <Box
                px="4"
                py="3"
                borderRadius="3xl"
                bg={
                  currentRoute === APP_ROUTE.FARM
                    ? "rgba(0, 173, 238, 0.6)"
                    : ""
                }
                _hover={{
                  cursor: "pointer",
                  bg:
                    currentRoute === APP_ROUTE.FARM
                      ? "rgba(0, 173, 238, 0.6)"
                      : "rgba(0, 173, 238, 0.2)",
                }}
              >
                <HStack>
                  <Icon h="6" w="6" as={GiFarmTractor} />
                  <Box>Farm</Box>
                </HStack>
              </Box>
            </Link>
          </VStack>
          <VStack align="stretch" spacing="1" h="7em" pt="2">
            {/* <HStack
              justify="space-between"
              px="4"
              py="3"
              borderRadius="3xl"
              _hover={{
                cursor: "pointer",
                bg: "gray.200",
              }}
            >
              <HStack>
                <Icon h="5" w="5" as={IoMdSettings} />
                <Box>Settings</Box>
              </HStack>
              <Icon h="5" w="5" as={IoIosArrowForward} />
            </HStack> */}
            <Box
              px="4"
              py="3"
              borderRadius="3xl"
              _hover={{
                cursor: "pointer",
                bg: "rgba(0, 173, 238, 0.3)",
              }}
            >
              <HStack>
                <Icon h="5" w="5" as={CgFileDocument} />
                <Box>Docs</Box>
              </HStack>
            </Box>
            <Box
              px="4"
              py="3"
              borderRadius="3xl"
              _hover={{
                cursor: "pointer",
                bg: "rgba(0, 173, 238, 0.3)",
              }}
            >
              <HStack>
                <Icon h="5" w="5" as={RiFeedbackFill} />
                <Box>Feedback</Box>
              </HStack>
            </Box>
          </VStack>
        </VStack>
      </Box>
      <Box
        pos="fixed"
        top="20"
        left={{ base: 0, lg: 56 }}
        right="0"
        bottom="0"
        px={{ base: 2, lg: 12 }}
        py="12"
        bg="rgba(0, 173, 238, 0.2)"
        overflowY="scroll"
        color="white"
      >
        {children}
      </Box>
    </Box>
  );
};

export default Web3Layout;
