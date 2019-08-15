import { DashboardConfig } from "@/types"

export default {
  name: "gamma",
  plasma: {
    networkId: "gamma",
    chainId: "default",
    endpoint: "wss://dpos-testing.network.shipchain.io:46658",
    blockExplorer: "https://explorer.network.shipchain.io",
    loomGamesEndpoint: "null",
    historyUrl: "null",
  },
  ethereum: {
    networkId: "4",
    networkName: "rinkeby",
    chainId: "eth",
    endpoint: "wss://rinkeby.infura.io/ws",
    blockExplorer: "https://rinkeby.etherscan.io",
    contracts: {
      mainGateway: "0xac88ff6b884Bc962E99ba8abD17520Ff9AfBa695",
      loomGateway: "0x4a61Ec909049525DfFBe985e684507Be919e3810",
    },
  },
  dpos: {
    bootstrapNodes: [
      "0x3411537f5b49d53d6a7dd28325786324ffaee028",
      "0xf1091998e8cea4f2623fcb07e5339b289b2ce37a",
      "0xd94d938b508391b6ebbcdc724a741ea4c2ef3f93",
      "0xc24da28d67014bb50265e06a2519e9621b6198a0",
    ],
    analyticsUrl: "null",
  },
  coinDataUrl: "/tokens/gamma.tokens.json",
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
