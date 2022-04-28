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
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay />
      <ModalContent
        border="2px solid #00ADEE"
        borderRadius="3xl"
        bg="#0a2d74e6"
        color="white"
      >
        <ModalHeader>Select a token</ModalHeader>
        <ModalCloseButton borderRadius="3xl" _focus={{}} />
        <ModalBody>
          <Input
            placeholder="enter token address"
            outline="1px solid #00ADEE"
            border="none"
            borderRadius="3xl"
            _focus={{}}
            _hover={{}}
          />
          <Box mt="2">
            {listTokens.map((token, idx) => (
              <HStack
                key={idx}
                fontSize="sm"
                borderRadius="3xl"
                px="6"
                py="4"
                _hover={{ bg: "rgba(0, 173, 238, 0.2)", cursor: "pointer" }}
                onClick={() => callback(token)}
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
