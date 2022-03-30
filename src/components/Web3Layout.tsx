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
import { AiOutlineSwap } from "react-icons/ai";
import { GiFarmTractor } from "react-icons/gi";
import { FiGrid, FiCommand } from "react-icons/fi";

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
    <Box minH="100vh">
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
                  _hover={{ bg: "gray.200", cursor: "pointer", opacity: 0.8 }}
                  borderRadius="md"
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

      <HStack
        h={20}
        px={12}
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.400"
      >
        {/* <HStack>
          <Link href="/">home</Link>
          <Link href="/swap">swap</Link>
          <Link href="/liquidity">liquidity</Link>
          <Link href="/farm">farm</Link>
        </HStack> */}
        <Box>Logo</Box>
        <Button
          colorScheme="teal"
          onClick={() => (account ? null : onOpen())}
          borderRadius="xl"
        >
          {account ? formatAddress(account) : "connect wallet"}
        </Button>
      </HStack>
      <Box
        w="56"
        pos="fixed"
        top="20"
        left="0"
        bottom="0"
        py="2"
        px="4"
        borderRight="1px solid"
        borderColor="gray.400"
        zIndex="1"
        fontWeight="bold"
      >
        <VStack h="100%" align="stretch" spacing="0">
          <Box flex="1" pb="2" borderBottom="1px solid" borderColor="gray.400">
            <Link href="/swap" passHref>
              <Box
                px="4"
                py="3"
                borderRadius="xl"
                _hover={{
                  cursor: "pointer",
                  bg: "gray.200",
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
                borderRadius="xl"
                _hover={{
                  cursor: "pointer",
                  bg: "gray.200",
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
                borderRadius="xl"
                _hover={{
                  cursor: "pointer",
                  bg: "gray.200",
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
                borderRadius="xl"
                _hover={{
                  cursor: "pointer",
                  bg: "gray.200",
                }}
              >
                <HStack>
                  <Icon h="6" w="6" as={GiFarmTractor} />
                  <Box>Farm</Box>
                </HStack>
              </Box>
            </Link>
          </Box>
          <Box h="40" pt="2">
            <HStack
              justify="space-between"
              px="4"
              py="3"
              borderRadius="xl"
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
            </HStack>
            <Box
              px="4"
              py="3"
              borderRadius="xl"
              _hover={{
                cursor: "pointer",
                bg: "gray.200",
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
              borderRadius="xl"
              _hover={{
                cursor: "pointer",
                bg: "gray.200",
              }}
            >
              <HStack>
                <Icon h="5" w="5" as={RiFeedbackFill} />
                <Box>Feedback</Box>
              </HStack>
            </Box>
          </Box>
        </VStack>
      </Box>
      <Box h="calc(100vh - 5em)" ml="56" p="14">
        {children}
      </Box>
    </Box>
  );
};

export default Web3Layout;
