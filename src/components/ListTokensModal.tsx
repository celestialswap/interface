import { useActiveWeb3React } from "@/hooks/useActiveWeb3React";
import useListTokens from "@/hooks/useListTokens";
import useToken from "@/hooks/useToken";
import { getToken } from "@/state/erc20";
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
  Spinner,
} from "@chakra-ui/react";
import { Token } from "@uniswap/sdk";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { isAddress } from "../utils";

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
  const { library } = useActiveWeb3React();

  const [searchToken, setSearchToken] = useState<string>("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearchToken = useCallback(async (): Promise<Token[]> => {
    if (!searchToken || !isAddress(searchToken)) return listTokens;
    const existsTokens = listTokens.filter(
      (t) => t.address.toLowerCase() === searchToken.toLowerCase()
    );
    if (existsTokens.length) return existsTokens;
    const _t = await getToken(searchToken, library);
    if (_t instanceof Token) return [_t];
    return [];
  }, [listTokens, searchToken, library]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const _tokens = await handleSearchToken();
        setTokens(_tokens);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error(error);
      }
    })();
  }, [handleSearchToken]);

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
            outline={
              searchToken
                ? !isAddress(searchToken)
                  ? "none"
                  : "1px solid #00ADEE"
                : "1px solid #00ADEE"
            }
            border="none"
            borderRadius="3xl"
            _focus={{}}
            _hover={{}}
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            isInvalid={searchToken ? !isAddress(searchToken) : false}
            errorBorderColor="#c53f45e6"
          />
          <Box mt="2">
            {loading ? (
              <Box textAlign="center">
                <Spinner />
              </Box>
            ) : (
              tokens.map((token, idx) => (
                <HStack
                  key={idx}
                  fontSize="sm"
                  borderRadius="3xl"
                  px="6"
                  py="4"
                  _hover={{ bg: "rgba(0, 173, 238, 0.2)", cursor: "pointer" }}
                  onClick={() => {
                    setSearchToken("");
                    callback(token);
                  }}
                >
                  <Box>{token.symbol}</Box>
                  <Box>-</Box>
                  <Box>{token.name}</Box>
                </HStack>
              ))
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ListTokensModal;
