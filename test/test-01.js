
// import Vue from 'vue'
// const { ScProvider, WellKnownChain } = require('@polkadot/rpc-provider/substrate-connect')
// import { ApiPromise } from '@polkadot/api'
const { ApiPromise, WsProvider } = require('@polkadot/api')
const endpoints = require('./test-endpoints')

const chain = 'polkadot'
const endpoint = 'parity'


(async () => {

  const provider = new WsProvider(endpoints[chain][endpoint])
  // const provider = new WsProvider(endpoints.kusama.parity)

  const api = await ApiPromise.create({ provider: provider })
  // // returns Hash
  // const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
  // returns SignedBlock
  const signedBlock = await api.rpc.chain.getBlock()

  // the hash for the block, always via header (Hash -> toHex()) - will be
  // the same as blockHash above (also available on any header retrieved,
  // subscription or once-off)
  console.log(signedBlock.block.header.hash.toHex());

  const apiAt = await api.at(signedBlock.block.header.hash);
  const allRecords = await apiAt.query.system.events();

  // the hash for each extrinsic in the block
  // signedBlock.block.extrinsics.forEach((ex, index) => {
  signedBlock.block.extrinsics.forEach(({ method: { method, section } }, index) => {
    // console.log(index, ex.hash.toHex())
    // console.log(index, ex.toHuman())

    const events = allRecords
    .filter(({ phase }) =>
      phase.isApplyExtrinsic &&
      phase.asApplyExtrinsic.eq(index)
    )
    .map(({ event }) => `${event.section}.${event.method}`)

    console.log(`${section}.${method}:: ${events.join('\n') || 'no events'}`)
  })

  process.exit(0)
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