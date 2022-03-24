import useListTokens from "@/hooks/useListTokens";
import {
  Box,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { Token } from "@uniswap/sdk";
import React from "react";

interface ListTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  callback: (token: Token) => void;
}

const ListTokensModal = ({
  isOpen,
  onClose,
  callback,
}: ListTokensModalProps) => {
  const listTokens = useListTokens();
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>select a token</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input placeholder="enter token address" />
          <Box mt="2">
            {listTokens.map((token, idx) => (
              <HStack
                key={idx}
                fontSize="sm"
                _hover={{ bg: "gray.400", cursor: "pointer" }}
                onClick={() => callback(token)}
                p="2"
              >
                <Box>{token.symbol}</Box>
                <Box>-</Box>
                <Box>{token.name}</Box>
              </HStack>
            ))}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ListTokensModal;
