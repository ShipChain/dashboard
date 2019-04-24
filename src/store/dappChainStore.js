/* eslint-disable */
import {
  CryptoUtils, Client, LocalAddress, Contracts, Address, createJSONRPCClient, NonceTxMiddleware,
  SignedTxMiddleware, SignedEthTxMiddleware, DPOSUser,
} from 'loom-js'

import { getMetamaskSigner, EthersSigner } from "loom-js/dist/solidity-helpers"

import ApiClient from '../services/api'
import { getDomainType, formatToCrypto } from '../utils'
import LoomTokenJSON from '../contracts/LoomToken.json'
import GatewayJSON from '../contracts/Gateway.json'
import FaucetJSON from '../contracts/ERC20Faucet.json'
import Debug from "debug"

Debug.enable("dashboard.dapp")
const debug = Debug("dashboard.dapp")


import BN from 'bn.js'

const DPOS2 = Contracts.DPOS2
let LOOM_ADDRESS = ""
let GW_ADDRESS = ""

const hostname = window.location.hostname 
if (hostname === "dashboard.dappchains.com") {
  LOOM_ADDRESS = ""
  GW_ADDRESS = ""
} else if ( hostname === "dev-dashboard.dappchains.com") {
  LOOM_ADDRESS = ""
  GW_ADDRESS = ""
} else {
  LOOM_ADDRESS = ""
  GW_ADDRESS = ""
}

/*
network config
1: mainnet
4: rinkeby
 */
const clientNetwork = {
  'shipchain-testnet-beta.network.shipchain.io': {
    network: 'default',
    websockt: 'wss://shipchain-testnet-beta.network.shipchain.io:46658/websocket',
    queryws: 'wss://shipchain-testnet-beta.network.shipchain.io:46658/queryws'
  },
  'hydra-testing.network.shipchain.io': {
    network: 'default',
    websockt: 'wss://hydra-testing.network.shipchain.io:46658/websocket',
    queryws: 'wss://hydra-testing.network.shipchain.io:46658/queryws'
  },
  'hydra-testing2.network.shipchain.io': {
    network: 'default',
    websockt: 'wss://hydra-testing2.network.shipchain.io:46658/websocket',
    queryws: 'wss://hydra-testing2.network.shipchain.io:46658/queryws'
  },
  'local': {
    network: 'default',
    websockt: 'ws://localhost:46658/websocket',
    queryws: 'ws://localhost:46658/queryws'
  },
}

function defaultNetworkId() {
  const domain = getDomainType();
  let loomNetwork;
  if (domain === 'local') {
    loomNetwork = 'local'
  } else {
    loomNetwork = 'shipchain-testnet-beta.network.shipchain.io'
  }
  return loomNetwork;
}

function defaultChainId() {
  return 'default'
}

const getChainUrls = () => {
  let chainUrlsJSON = sessionStorage.getItem('chainUrls');
  let chainUrls;
  if (!chainUrlsJSON) {
    chainUrls = [
      clientNetwork['shipchain-testnet-beta.network.shipchain.io'],
      clientNetwork['hydra-testing.network.shipchain.io'],
      clientNetwork['hydra-testing2.network.shipchain.io'],
      clientNetwork['local'],
    ]
  } else {
    chainUrls = JSON.parse(chainUrlsJSON);
  }
  return chainUrls;
};

const getChainIndex = (chainUrls) => {
  let chainIndex = sessionStorage.getItem('chainIndex')
  if (!chainIndex || chainIndex >= chainUrls.length) chainIndex = 0
  return chainIndex
}

const getServerUrl = (chain) => {
  const url = chain.websockt || chain.rpc
  const splited = url.split('://')
  if (splited[1]) {
    return splited[1].split('/')[0]
  }
  return ''
}

const createClient = (state, privateKeyString) => {

  let privateKey = CryptoUtils.B64ToUint8Array(privateKeyString)

  const networkConfig = state.chainUrls[state.chainIndex]

  let publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)
  let client
  if (networkConfig.websockt) {
    client = new Client(networkConfig.network, networkConfig.websockt, networkConfig.queryws)
  } else {
    client = new Client(networkConfig.network,
      createJSONRPCClient({
        protocols: [{ url: networkConfig.rpc }]
      }),
      networkConfig.queryws
    )
  }
  client.txMiddleware = [
    new NonceTxMiddleware(publicKey, client),
    new SignedTxMiddleware(privateKey)
  ]

  return client

}

/**
 * overrides client.middleware SignedEthTxMiddleware.Handle
 * to notify vuex when the user has to sign
 * @param {*} user 
 * @param {*} _client 
 * @param {*} commit 
 */
function reconfigureClient(client, commit) {
  const middleware = client.txMiddleware.find((m) => m instanceof SignedEthTxMiddleware)
  if (!middleware) {
    console.warn("could not find SignedEthTxMiddleware in client.middleware for reconfiguration")
    return client
  }
  const handle = middleware.Handle.bind(middleware)
  middleware.Handle = async function (txData) {
    commit('setShowSigningAlert', true)
    const res = await handle(txData)
    commit('setShowSigningAlert', false)
    return res
  }
  return client
}


const defaultState = () => {
  const chainUrls = getChainUrls()
  const chainIndex = getChainIndex(chainUrls)
  return {
    web3: undefined,
    account: undefined,
    accountStakesTotal: null,
    localAddress: undefined,
    count: 0,
    networkId: defaultNetworkId(),
    chainUrls: chainUrls,
    chainIndex: chainIndex,
    dAppChainClient: undefined,
    LoomTokenNetwork: undefined,
    LoomTokenInstance: undefined,
    GatewayInstance: undefined,
    dposUser: undefined,
    dpos2: undefined,
    mappingStatus: undefined,
    mappingError: undefined,
    metamaskStatus: undefined,
    metamaskError: undefined,
    isConnectedToDappChain: false,
    showSigningAlert: false,
    validators: [],
  }
}

export default {
  namespaced: true,
  state: defaultState(),
  getters: {
    getAccount(state) {
      return state.account
    },
    networks() {
      return clientNetwork
    },
    currentChain(state) {
      const network = state.chainUrls[state.chainIndex]
      return network.websockt || network.rpc || ''
    },
    currentChainId(state) {
      const network = state.chainUrls[state.chainIndex]
      return network.network
    },
    currentRPCUrl(state) {
      const network = state.chainUrls[state.chainIndex]
      const url = new URL(network.websockt || network.rpc)
      url.protocol =  url.protocol.replace(/:/g, "") === "wss" ? "https" : "http"
      url.pathname = "rpc"
      return url.toString()
      // if (network.rpc) return network.rpc
      // if (network.websockt) {
      //   const splited = network.websockt.split('://')
      //   if (splited[1]) {
      //     return 'https://' + splited[1].split('/')[0] + '/rpc'
      //   }
      // }
      // return ''
    },
    defaultNetworkId,
    dappchainEndpoint(state) {
      const network = state.chainUrls[state.chainIndex]
      const url = new URL(network.websockt || network.rpc) 
      url.protocol =  url.protocol.replace(/:/g, "") === "wss" ? "https" : "http"
      url.pathname = ""
      // remove the root slash 
      return url.toString().slice(0, -1)
    },
  },
  mutations: {
    updateState(state, payload) {
      state.account = payload.account
      state.dAppChainClient = payload.dAppChainClient
      state.localAddress = payload.localAddress
      // state.LoomTokenNetwork = payload.LoomTokenNetwork
      // state.LoomTokenInstance = payload.LoomTokenInstance
    },
    setWeb3(state, payload) {
      state.web3 = payload
    },
    setMappingStatus(state, payload) {
      state.mappingStatus = payload
    },
    setMappingError(state, payload) {
      state.mappingError = payload
    },
    setMetamaskStatus(state, payload) {
      state.metamaskStatus = payload
    },
    setMetamaskError(state, payload) {
      state.metamaskError = payload
    },
    setDappChainConnected(state, payload) {
      state.isConnectedToDappChain = payload
    },
    setWithdrewSignature(state, payload) {
      if(!payload) {
        sessionStorage.removeItem('withdrewSignature');
      } else {
        sessionStorage.setItem('withdrewSignature', payload)
      }
    },
    setDPOSUser(state, payload) {
      state.dposUser = payload
    },
    setShowSigningAlert(state, payload) {
      state.showSigningAlert = payload
    },
    setValidators(state, payload) {
      state.validators = payload
    }
  },
  actions: {
    addChainUrl({ state, dispatch }, payload) {
      const chains = state.chainUrls
      const existingIndex = chains.findIndex(chain => {
        return chain.websockt === payload.url || chain.rpc === payload.url
      })
      if (existingIndex >= 0) {
        if (state.chainIndex === existingIndex) return false
        state.chainIndex = existingIndex
        sessionStorage.setItem('chainIndex', state.chainIndex)
      } else {
        let websockt, rpc
        if (payload.url.startsWith('ws')) {
          websockt = payload.url
        } else {
          rpc = payload.url
        }
        const chain = {
          network: defaultChainId(),
          websockt,
          rpc
        }
        chains.push({
          ...chain,
          queryws: 'wss://' + getServerUrl(chain) + '/queryws'
        })
        state.chainUrls = chains
        state.chainIndex = state.chainUrls.length - 1
      }
      sessionStorage.setItem('chainIndex', state.chainIndex)
      sessionStorage.setItem('chainUrls', JSON.stringify(state.chainUrls))
      
      return true
    },
    registerWeb3({ commit, state, getters }, payload) {
      try {
        commit('setWeb3', payload.web3)
        // these are filled on yarn serve/build
        const network = state.chainUrls[state.chainIndex].network
        const LoomTokenInstance = new payload.web3.eth.Contract(LoomTokenJSON.abi, LOOM_ADDRESS || LoomTokenJSON.networks[network].address)
        state.LoomTokenNetwork = LoomTokenJSON.networks[network]
        state.LoomTokenInstance = LoomTokenInstance
        state.GatewayInstance = new payload.web3.eth.Contract(GatewayJSON.abi, GW_ADDRESS || GatewayJSON.networks[network].address)
      } catch (err) {
        console.error(err)
      }
    },
    async getClaimedShip({ state }) {
      try {
        const accounts = await state.web3.eth.getAccounts();
        if (accounts.length === 0) {
          return 0;
        }
        const address = accounts[0];
        const faucet = new state.web3.eth.Contract(FaucetJSON.abi, FaucetJSON.networks.default.address);
        const claimed = await faucet.methods.claimedTokens(address).call();
        return +state.web3.utils.fromWei(claimed, 'ether');
      } catch (error) {
        console.error(error)
      }
      return 0;
    },
    async getMetamaskLoomBalance({ state , commit}, payload) {
      if (!state.web3) return 0

      const web3js = state.web3
      const accounts = await web3js.eth.getAccounts()
      if (accounts.length === 0) return 0
      const address = accounts[0]
      try {
        let balance = web3js.utils.fromWei(await state.LoomTokenInstance.methods
          .balanceOf(address)
          .call({ from: address }))
      let limitDecimals = parseFloat(balance).toFixed(2)
      return limitDecimals
      } catch (err) {
        commit('setErrorMsg', {msg: "Error getting metamask balance", forever: false, report:true, cause:err}, {root: true})
        return 0
      }
    },
    async initDposUser({ state, rootState, getters, dispatch, commit }) {
      if (!rootState.DPOS.web3) {    
        await dispatch("DPOS/initWeb3Local", null, { root: true })
      }
 
      const network = state.chainUrls[state.chainIndex].network
      let user 
      try { 
        user = await DPOSUser.createEthSignMetamaskUserAsync(		
          rootState.DPOS.web3,
          getters.dappchainEndpoint,
          network,
          GW_ADDRESS || GatewayJSON.networks[network].address,
          LOOM_ADDRESS || LoomTokenJSON.networks[network].address
        )

        reconfigureClient(user._client, commit)
        commit("setDPOSUser", user)
        
      } catch(err) {

        console.log(err)
        commit('setErrorMsg', {msg: "Error initDposUser", forever: false, report:true, cause:err}, {root: true}) 
      }



    },
    // TODO: this is added to fix mismatched account mapping issues, remove once all users are fixed.
    async switchDposUser({ state, rootState, getters, dispatch, commit }, payload) {
      const privateKeyString = sessionStorage.getItem('privatekey')
      if (!privateKeyString) {
        // commit('setErrorMsg', 'Error, Please logout and login again', { root: true })
        throw new Error('No Private Key, Login again')
      }
      const network = state.chainUrls[state.chainIndex].network
      let user

      let dposConstructor

      if (['dev', 'local'].includes(getDomainType())) {
        dposConstructor = DPOSUser.createEthSignMetamaskUserAsync
      } else {
        dposConstructor = DPOSUser.createMetamaskUserAsync
      }

      try {
        user = await dposConstructor(
        payload.web3,
        getters.dappchainEndpoint,
        privateKeyString,
        network,
        GW_ADDRESS || GatewayJSON.networks[network].address,
        LOOM_ADDRESS || LoomTokenJSON.networks[network].address
        );
      } catch(err) {
        commit('setErrorMsg', {msg: "Error initDposUser", forever: false, report:true, cause:err}, {root: true})
        
      }
      state.dposUser = user
    },
    /**
     * 
     * @param {store} param0 
     * @param {{amount}} payload 
     * @returns {Promise<TransactionReceipt>}
     */
    async depositAsync({ state }, {amount}) {
      console.assert(state.dposUser, "Expected dposUser to be initialized")
      commit('DPOS/setGatewayBusy', true, { root: true })
      const user = state.dposUser
      const tokens = new BN( "" + parseInt(amount,10)) 
      const weiAmount = new BN(state.web3.utils.toWei(tokens, 'ether'), 10)
      const res = user.depositAsync(new BN(weiAmount, 10))
      commit('DPOS/setGatewayBusy', false, { root: true })
      return res
    },
    /**
     * 
     * @param {store} param0 
     * @param {{amount}} payload 
     * @returns {Promise<TransactionReceipt>}
     */
    async withdrawAsync({ state, commit }, {amount}) {
      console.assert(state.dposUser, "Expected dposUser to be initialized")
      const user = state.dposUser
      const tokens = new BN( "" + parseInt(amount,10)) 
      const weiAmount = new BN(state.web3.utils.toWei(tokens, 'ether'), 10)
      commit('DPOS/setGatewayBusy', true, { root: true })
      let res = await user.withdrawAsync(new BN(weiAmount, 10))
      commit('DPOS/setGatewayBusy', false, { root: true })
      return res
    },
    async approveAsync({ state, dispatch }, payload) {
      commit('DPOS/setGatewayBusy', true, { root: true })
      if (!state.dposUser) {
        await dispatch('initDposUser')
      }

      const { amount } = payload
      const user = state.dposUser
      
      const token = user.ethereumLoom
      const gateway = user.ethereumGateway
      await token.approve(gateway.address, amount)
      
    },
    async getDappchainLoomBalance({ rootState, state, dispatch }) {
      if (!state.dposUser) {
        try {
          await dispatch('initDposUser')
        } catch (err) {
          console.error("Error getting Loom balance", err)
          return 0
        }
      }
      let loomWei = await state.dposUser.getDAppChainBalanceAsync()      
      const balance = state.web3.utils.fromWei(loomWei.toString(), 'ether')
      let limitDecimals = parseFloat(balance).toFixed(2)
      return limitDecimals
    },
    async transferCoinToAddress({ state, dispatch, commit, rootState }, payload) {
      if (!state.dposUser) {
        await dispatch('initDposUser')
      }      
      try {       
        let weiAmount = new BN(state.web3.utils.toWei(payload.amount, 'ether'), 10);
        let mappedChainAddress;

        if(payload.type === 'eth') {
          try {
            const receiverEth = new Address('eth', LocalAddress.fromHexString(payload.receiver));
            let receiverMapping = await rootState.DPOS.mapper.getMappingAsync(receiverEth);
            mappedChainAddress = receiverMapping.to;
          } catch (err) {
            try {
              const receiverDefault = new Address('default', LocalAddress.fromHexString(payload.receiver));
              let receiverMapping = await rootState.DPOS.mapper.getMappingAsync(receiverDefault);
              mappedChainAddress = receiverMapping.from;
            } catch (err) {
              commit('setErrorMsg', {msg: `Account ${payload.receiver} not found`, forever: false, report: true, cause: err}, {root: true});
              return;
            }
          }
        } else if (payload.type === 'default') {
          mappedChainAddress = new Address('default', LocalAddress.fromHexString(payload.receiver));
        } else {
          commit('setErrorMsg', {msg: `Unknown Address Type ${payload.type}`, forever: false, report:true}, {root: true});
          return;
        }

        await state.dposUser.dappchainLoom.transferAsync(mappedChainAddress, weiAmount);
        commit('setSuccessMsg', {msg: `Success Transferring ${payload.amount} tokens to ${payload.receiver}`, forever: false}, {root: true});
      } catch(err) {
        commit('setErrorMsg', {msg: `Error Transferring ${payload.amount} tokens to ${payload.receiver}`, forever: false, report:true, cause:err}, {root: true});
      }      
    },
    async delegateAsync({ state, dispatch, commit }, payload) {
      if (!state.dposUser) {

        await dispatch('initDposUser')
      }      
      try {       
        let weiAmount = state.web3.utils.toWei(payload.amount, 'ether') 
        let tier = parseInt(payload.tier)
        const result = await state.dposUser.delegateAsync(payload.candidate, new BN(weiAmount, 10), tier)
        commit('setSuccessMsg', {msg: `Success delegating ${payload.amount} tokens`, forever: false}, {root: true})
      } catch(err) {
        commit('setErrorMsg', {msg: "Error delegating", forever: false, report:true, cause:err}, {root: true})
      }      
    },
    async undelegateAsync({ state, dispatch, commit }, payload) {
      if (!state.dposUser) {
        await dispatch('initDposUser')
      }
      let weiAmount = state.web3.utils.toWei(payload.amount, 'ether')    
      let loomAmount = weiAmount / 10 ** 18
      try {
        const result = await state.dposUser.undelegateAsync(payload.candidate, new BN(weiAmount,10))
        commit('setSuccessMsg', {msg: `Success un-delegating ${loomAmount} tokens`, forever: false}, {root: true})
      } catch(err) {
        commit('setErrorMsg', {msg: "Failed to undelegate", forever: false, report:true, cause:err}, {root: true})
      }
    }, 
    async getValidatorsAsync({ dispatch, commit, rootState }) {
      const dpos2 = await dispatch('getDpos2')
      const template = {
          address:  "",
          pubKey: "",
          active : false,
          isBootstrap : false,
          totalStaked: "0",
          personalStake: "0",
          votingPower: "0",
          delegationTotal: "0",
          delegatedStake: "0",
          name: "",
          website: "",
          description: "",
          fee: "N/A",
          newFee: "N/A",
          feeDelaycounter: "N/A"
      }
      // Get all validators, candidates and delegations
      const [validators,candidates,delegations] = await Promise.all([
        dpos2.getValidatorsAsync(),
        dpos2.getCandidatesAsync(),
        dpos2.getAllDelegations()
      ])
      const nodes = candidates.map((c) => 
        Object.assign({}, template, {
          address:  c.address.local.toString(),
          pubKey: CryptoUtils.Uint8ArrayToB64(c.pubKey),
          active : false,
          isBootstrap: rootState.DPOS.prohibitedNodes.includes(c.name),
          name: c.name,
          website: c.website,
          description: c.description,
          fee: (c.fee / 100).toString(),
          newFee: (c.newFee / 100).toString(),
          feeDelaycounter: c.feeDelayCounter.toString(),
        })
      )
      // helper
      const getOrCreate = (addr) => {
        let existing = nodes.find((node) => node.address === addr)
        if (!existing) {
          existing = Object.assign({},template, {address: addr})
          nodes.push(existing)
        }
        return existing
      }

      validators.forEach((v) => {
        const addr = v.address.local.toString()
        const node = getOrCreate(addr)
        Object.assign(node, {
            active:  true,
            personalStake: v.whitelistAmount.toString(),
            votingPower: v.delegationTotal.toString(),
            delegationsTotal: v.delegationTotal.sub(v.whitelistAmount).toString()
        })
      })

      delegations.filter((d) => d.delegationsArray.length > 0)
      .forEach((d) => {
        const addr = d.delegationsArray[0].validator.local.toString()
        const delegatedStake = d.delegationTotal
        const node = getOrCreate(addr)
        Object.assign(node, {
          delegatedStake: delegatedStake.toString(),
          totalStaked: new BN(node.personalStake).add(delegatedStake).toString(),
        })
      })
      console.log(nodes)
      // use the address for those without names 
      nodes.filter((n) => n.name === "").forEach(n => n.name = n.address)
      commit("setValidators", nodes)
    },
    async getAccumulatedStakingAmount({ state, dispatch }, payload) {
      if (!state.dposUser) {
        await dispatch('initDposUser')
      }      
      const totalDelegation = await state.dposUser.getTotalDelegationAsync()
      const amount = formatToCrypto(totalDelegation.amount)
      state.accountStakesTotal = totalDelegation.amount
      return amount
    },
    async checkDelegationAsync({ state, dispatch}, payload) {
      const privateKeyString = sessionStorage.getItem('privatekey')
      if (!privateKeyString) {
        // commit('setErrorMsg', 'Error, Please logout and login again', { root: true })
        throw new Error('No Private Key, Login again')
      }

      const dpos2 = await dispatch('getDpos2', {
        privateKey: privateKeyString
      })
      const privateKey = CryptoUtils.B64ToUint8Array(privateKeyString)
      const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)
      const chainId = state.chainUrls[state.chainIndex].network
      const result = dpos2.checkDelegationAsync(
        new Address(chainId, LocalAddress.fromPublicKey(CryptoUtils.B64ToUint8Array(payload.validator))),
        new Address(chainId, LocalAddress.fromPublicKey(publicKey)))
      return result
    },
    /**
     * If an initialized/initializing dposUser is in the state
     * return dposUser.dappchainDPOS
     * else creates one (and the client that goes with it...)
     * @param {DappChainState} param0 
     * @param {*} payload ?
     * @returns {Promise<DPOS2>}
     */
    async getDpos2({ state, commit }, payload) {
      if (state.dposUser) {
        // todo check state.dpos2 and remove it/disconnect its client
        // since we have dposUser now
        return state.dposUser.dappchainDPOS
      }
      else if (state.dpos2) {
        commit('setDappChainConnected', true)
        return state.dpos2
      }

      const networkConfig = state.chainUrls[state.chainIndex]

      let privateKey
      if (payload && payload.privateKey) {
        privateKey = CryptoUtils.B64ToUint8Array(payload.privateKey)
      } else {
        privateKey = CryptoUtils.generatePrivateKey()
      }

      let networkId = networkConfig.network === "us1" ? "default" : networkConfig.network 
      let client
      if (networkConfig.websockt) {
        client = new Client(networkId, networkConfig.websockt, networkConfig.queryws)
      } else {
        client = new Client(networkId,
          createJSONRPCClient({
            protocols: [{ url: networkConfig.rpc }]
          }),
          networkConfig.queryws
        )
      }

      const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)

      client.txMiddleware = [
        new NonceTxMiddleware(publicKey, client),
        new SignedTxMiddleware(privateKey)
      ]
      client.on('error', msg => {
        commit('setDappChainConnected', false)
        console.error('PlasmaChain connection error', msg)
      })

      const dpos2 = await DPOS2.createAsync(client, new Address(networkId, LocalAddress.fromPublicKey(publicKey)))
      state.dpos2 = dpos2
      commit('setDappChainConnected', true)
      return dpos2
    },
    async ensureIdentityMappingExists({ rootState, state, dispatch, commit, rootGetters }, payload) {

      let metamaskAddress = ""
      if(payload) {
        metamaskAddress = payload.currentAddress.toLowerCase()
      } else {
        metamaskAddress = rootState.DPOS.currentMetamaskAddress.toLowerCase()
      }

      const client = createClient(state, rootState.DPOS.dashboardPrivateKey)
      commit("DPOS/setClient", client, { root: true })

      const contractAddr = await client.getContractAddressAsync('addressmapper')

      const dappchainAddress = rootGetters["DPOS/getDashboardAddressAsLocalAddress"]

      try {
        commit("DPOS/setStatus", "check_mapping", {root: true})
        commit('setMappingError', null)
        commit('setMappingStatus', null)
        
        let dashboardAddress = new Address("default", LocalAddress.fromHexString(rootState.DPOS.dashboardAddress))
        let addressMapper = await Contracts.AddressMapper.createAsync(client, dashboardAddress)
        commit("DPOS/setMapper", addressMapper, { root: true })
        let address = new Address("eth", LocalAddress.fromHexString(metamaskAddress))
        const mapping = await addressMapper.getMappingAsync(address)
        const mappedEthAddress = mapping.to.local.toString()

      } catch (err) {
        commit("DPOS/setStatus", "no_mapping", {root: true})
        console.error("Error ensuring mapping exists: ", err)
        // commit('setErrorMsg', {msg: `Error mapping identities, please try again`, forever: true}, {root: true})
        return
      }
      commit("DPOS/setStatus", "mapped", {root: true})
    },
    async createNewPlasmaUser({ state, rootState, dispatch }) {
      const privateKey = CryptoUtils.generatePrivateKey()
      const privateKeyString = CryptoUtils.Uint8ArrayToB64(privateKey)
      const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)
      const address = LocalAddress.fromPublicKey(publicKey)
      const ethAddr = rootState.DPOS.currentMetamaskAddress.toLowerCase()
      const wallet = getMetamaskSigner(rootState.DPOS.web3.currentProvider)
      const signer = new EthersSigner(wallet)

      let one = new Address("default", address)
      let two = new Address("eth", LocalAddress.fromHexString(ethAddr)) 
      const client = createClient(state, privateKeyString)
      let addressMapper = await Contracts.AddressMapper.createAsync(client, one)
      await addressMapper.addIdentityMappingAsync(
        one,
        two,
        signer 
      )
    },
    async addMappingAsync({ state, dispatch, commit }, payload) {
      if (!state.dposUser) {
        await dispatch('initDposUser')
      } try {
        await state.dposUser.mapAccountsAsync()
        commit("DPOS/setStatus", "mapped", {root: true})
      } catch (err) {
        commit('setMappingError', err.message)
        throw Error(err.message.toString())
      }
    },
    async getUnclaimedLoomTokens({ state, dispatch, commit } ) {
      if (!state.dposUser) {
        await dispatch('initDposUser')
      }
      
      const user = state.dposUser

      const web3js = state.web3
      const accounts = await web3js.eth.getAccounts()
      if (accounts.length === 0) return 0
      const address = accounts[0]
      const formattedAddress = `eth:${address}`
      console.log('formatted address:', formattedAddress)
      try {
        let unclaimAmount = await user.getUnclaimedLoomTokensAsync(address)
        console.log('unclaimed amount', unclaimAmount)
        return unclaimAmount
      } catch (err) {
        console.log("Error check unclaim loom tokens", err);
        commit('setErrorMsg', 'Error check unclaim loom tokens', { root: true, cause:err})
      }
    },
    async reclaimDeposit({ state, dispatch, commit } ) {
      if (!state.dposUser) {
        await dispatch('initDposUser')
      }
      commit('DPOS/setGatewayBusy', true, { root: true })
      const user = state.dposUser
      const dappchainGateway = user.dappchainGateway
      try {
        await dappchainGateway.reclaimDepositorTokensAsync()
      } catch (err) {
        console.log("Error reclaiming tokens", err);
        commit('setErrorMsg', 'Error reclaiming tokens', { root: true, cause:err})
      }
      commit('DPOS/setGatewayBusy', false, { root: true })
    },

    async getPendingWithdrawalReceipt({ state, dispatch, commit } ) {
      if (!state.dposUser) {
        await dispatch('initDposUser')
      }
      const user = state.dposUser
      try {
        const receipt = await user.getPendingWithdrawalReceiptAsync()
        if(!receipt) return null
        const signature = CryptoUtils.bytesToHexAddr(receipt.oracleSignature)
        const owner = CryptoUtils.bytesToHexAddr(receipt.tokenOwner.local.bytes)
        const amount = receipt.tokenAmount
        return  { signature: signature, amount: amount, tokenOwner: owner }
      } catch (err) {
        console.log("Error get pending withdrawal receipt", err);
        commit('setErrorMsg', 'Error get pending withdrawal receipt', { root: true, cause:err})       
      }
    },

    async withdrawCoinGatewayAsync({ state, dispatch, commit }, payload) {
      if (!state.dposUser) {
        await dispatch('initDposUser')
      }

      var user = state.dposUser
      commit('DPOS/setGatewayBusy', true, { root: true })
      try {
        const result = await user.withdrawCoinFromRinkebyGatewayAsync(payload.amount, payload.signature)
        console.log("result", result);
        commit('DPOS/setGatewayBusy', false, { root: true })
        return  result
      } catch (err) {
        console.log("Error withdrawal coin from gateway", err);
        throw Error(err.message)       
      }
    },
    async init({ state, commit, rootState }, payload) {

      let privateKey
      let privateKeyString = sessionStorage.getItem('privatekey')

      if (!privateKeyString) {
        // commit('setErrorMsg', 'Error, Please logout and login again', { root: true })
        return
      }

      privateKey = CryptoUtils.B64ToUint8Array(privateKeyString)
      let account

      const networkConfig = state.chainUrls[state.chainIndex]

      let publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)
      let client
      if (networkConfig.websockt) {
        client = new Client(networkConfig.network, networkConfig.websockt, networkConfig.queryws)
      } else {
        client = new Client(networkConfig.network,
          createJSONRPCClient({
            protocols: [{ url: networkConfig.rpc }]
          }),
          networkConfig.queryws
        )
      }
      client.txMiddleware = [
        new NonceTxMiddleware(publicKey, client),
        new SignedTxMiddleware(privateKey)
      ]

      account = LocalAddress.fromPublicKey(publicKey).toString()
      let localAddress = new Address(client.chainId, LocalAddress.fromPublicKey(publicKey))

      commit('updateState', {
        account,
        localAddress,
        dAppChainClient: client,
      })
    },
    showMsg({ commit }, payload) {
      const msgType = payload.type === "error" ? "setErrorMsg" : "setSuccessMsg";
      commit(msgType, payload.msg, { root: true })
    }
  }
}
