import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  uri: "http://localhost:8000/subgraphs/name/nodemdev/subgraph-example",
  cache: new InMemoryCache(),
  shouldBatch: true,
});

export const healthClient = new ApolloClient({
  uri: "https://api.thegraph.com/index-node/graphql",
  cache: new InMemoryCache(),
  shouldBatch: true,
});

export const v1Client = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap",
  cache: new InMemoryCache(),
  shouldBatch: true,
});

export const stakingClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/way2rach/talisman",
  cache: new InMemoryCache(),
  shouldBatch: true,
});

export const blockClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks",
  cache: new InMemoryCache(),
});
