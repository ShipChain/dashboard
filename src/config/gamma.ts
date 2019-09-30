import { DashboardConfig } from "@/types"

export default {
  name: "gamma",
  plasma: {
    networkId: "gamma",
    chainId: "gamma",
    endpoint: "wss://shipchain-testnet-gamma.network.shipchain.io:46658",
    blockExplorer: "https://shipchain-testnet-gamma.network.shipchain.io",
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
      mainGateway: "0xcad00961dEfF3ea83c33E5bb1e80D5F632939F56",
      loomGateway: "0x5f5Cb9924aB9a2A959Fa6ec5cbC8372ab05bA79E",
    },
  },
  dpos: {
    bootstrapNodes: [
      "0x15e026b2F36988dd352c315449bf40692c6c3Ae8",
      "0xaa3D214A70f702E5c52549570B6E2D289b6FC3D5",
      "0xb317e7209632F4e5B39328096110Bca1292c5b91",
      "0x20d1546AE044c9D17b68f1fd2f367bfe3A5377e4",
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
