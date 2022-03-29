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
} from "@chakra-ui/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { formatAddress } from "../utils";

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
        h={14}
        px={4}
        py={2}
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <HStack>
          <Link href="/">home</Link>
          <Link href="/swap">swap</Link>
          <Link href="/liquidity">liquidity</Link>
          <Link href="/farm">farm</Link>
        </HStack>
        <Button colorScheme="teal" onClick={() => (account ? null : onOpen())}>
          {account ? formatAddress(account) : "connect wallet"}
        </Button>
      </HStack>
      <Box h="calc(100vh - 3.5em)" py="4" px="32">
        {children}
      </Box>
    </Box>
  );
};

export default Web3Layout;
