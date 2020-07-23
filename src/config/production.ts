import { DashboardConfig } from "@/types"

export default {
  name: "production",
  plasma: {
    networkId: "mainnet",
    chainId: "default",
    endpoint: "wss://shipchain-mainnet.network.shipchain.io:46658",
    blockExplorer: "https://shipchain-mainnet.network.shipchain.io",
    loomGamesEndpoint: "null",
    historyUrl: "null",
  },
  ethereum: {
    networkId: "1",
    networkName: "mainnet",
    chainId: "eth",
    endpoint: "wss://mainnet.infura.io/ws/v3/1b8e8507933f40529210b790fcf7300e",
    blockExplorer: "https://etherscan.io",
    contracts: {
      mainGateway: "0x7f031CE5Df8B397680Fe025c9A9a15bCb2bDaBF1",
      loomGateway: "0xd8bE8814dcedd01D6e5F61551d088386062f9bFb",
    },
  },
  dpos: {
    bootstrapNodes: [
      "0x7dCAc8Fa01892044f61434bdE0b98748b00d0e96",
      "0xc54C3086AD892DED506aF50B9259E1C0Fb0AD127",
      "0x95A7C8a4Cc503948D1a18294c21343DB3D07d698",
      "0x8281F3A511873708C3a41243cfEbfaD8489DC7fA"
    ],
    analyticsUrl: "null",
  },
  coinDataUrl: "/tokens/production.tokens.json",
  gateway: {
    chains: ["ethereum"],
    multisig: true,
    checkMarketplaceURL: "null",
    tokenContractLogsURL: "null",
  },
  disabled: ["portis", "fortmatic", "binance"],
  chains: ["ethereum"],
  announcement: {
    popup: false,
    home: false,
  },
} as DashboardConfig
