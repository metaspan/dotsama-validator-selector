
// import Vue from 'vue'
// const { ScProvider, WellKnownChain } = require('@polkadot/rpc-provider/substrate-connect')
// import { ApiPromise } from '@polkadot/api'
const { ApiPromise, WsProvider } = require('@polkadot/api')

const endpoints = {
  polkadot: {
    parity: 'wss://rpc.polkadot.io',
    onFinality: 'wss://polkadot.api.onfinality.io/public-ws',
    dwellir: 'wss://polkadot-rpc.dwellir.com'
  },
  kusama: {
    // local: 'wss://192.168.1.85:30225',
    // local: 'http://192.168.1.85:40224',
    onFinality: 'wss://kusama.api.onfinality.io/public-ws',
    parity: 'wss://kusama-rpc.polkadot.io',
    dwellir: 'wss://kusama-rpc.dwellir.com'
  },
  parallel: {
    onFinality: 'wss://parallel.api.onfinality.io/public-ws'
  }
}

const chain = 'polkadot'
const endpoint = 'parity'

const kusama_addresses = [
// METASPAN validator address
  'HyLisujX7Cr6D7xzb6qadFdedLt8hmArB6ZVGJ6xsCUHqmx',
// // 1kv kusama controller
  'EuKPqqwM5Q3jxCxGqrHcLnBM1Edv5QR5Cnzjhi1MttQWwLp',
// // Kusama Staking Stash
  'Ew5NJucSyE17T4QYBhjbm1WYrGk2oULTHyjiJacLbCNfc4Q',
// kusama staking control
  'HhYuQCR1pJKVwPruCSNr8xp4R1ovqtAbNy3S8VuMXsPtBmH',
];

const addresses = [
  '16ce9zrmiuAtdi9qv1tuiQ1RC1xR6y6NgnBcRtMoQeAobqpZ',
  '13pnRtJAQ3A7eg6m2hEYnsA9a4fLC1WgEBzi9E6CUTGqtSHu'
];

// console.debug(address);

(async () => {

  const provider = new WsProvider(endpoints[chain][endpoint])
  const api = await ApiPromise.create({ provider: provider })

  addresses.forEach(async function(address) {
    console.debug(address)
    const noms = await api.query.staking.nominators(address)
    console.debug(noms.toJSON())
  })
  
  setTimeout(() => {
    process.exit(0)
  }, 5000)

})()


/*
  provider.on('error', async (err) => {
    console.warn(`on('error', ${chain})`)
    // await store.dispatch('apiError', { chain, error: err })
    console.error(err)
  })
  // console.debug(`${chain}: debug 2`)
  provider.on('connected', async () => {
    console.debug(`on('connected', ${chain})`)
    // await store.dispatch('substrate/apiConnected', { chain })
  })
  // console.debug(`${chain}: debug 3`)
  provider.on('disconnected', async (evt) => {
    console.debug(`on('disconnected', ${chain})`)
    console.debug(evt)
    // await store.dispatch('substrate/apiDisconnected', { chain })
  })

  */