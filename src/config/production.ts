import { DashboardConfig } from "@/types"

export default {
  name: "production",
  plasma: {
    networkId: "mainnet",
    chainId: "default",
    endpoint: "wss://mainnet-testing.network.shipchain.io:46658",
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
      mainGateway: "0x40b0F509633BE049fd798d7D693f297b51a571ce",
      loomGateway: "0x7f031CE5Df8B397680Fe025c9A9a15bCb2bDaBF1",
    },
  },
  dpos: {
    bootstrapNodes: [
      "0x42929b891196F888a21e8bf1f4cABE6765Cb9fa7",
      "0x63A4E3377fA216fc9bA0b792b373235693C81D6c",
      "0x59bE2289469fE2D164c796ba3453e97136Ea8526",
      "0xFAEf8Ee80f707D9C0CB73F0A3544F624B364F6B1"
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
