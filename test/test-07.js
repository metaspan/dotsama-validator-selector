
// https://github.com/polkadot-js/apps/blob/master/packages/page-staking/src/useNominations.ts#L12

import { ApiPromise, WsProvider } from '@polkadot/api'
import { endpoints } from './test-endpoints.js'
// const fs = require('fs')

const chain_id = 'polkadot'
const endpoint = 'local';
// const endpoint = 'parity';

// const { Validator } = require('./test-validator.class')
// const { Account } = require('./test-account.class')

async function main () {

  const provider = new WsProvider(endpoints[chain_id][endpoint])
  const api = await ApiPromise.create({ provider: provider })

  // const validator = '16ce9zrmiuAtdi9qv1tuiQ1RC1xR6y6NgnBcRtMoQeAobqpZ' // METASPAN

  // try {
  //   // const header = await api.derive.chain.getHeader();
    const header = await api.rpc.chain.getHeader();
    console.debug(header.toHuman())
  // } catch (err) {
  //   console.debug(err)
  // }

  const blockNumber = header.number // 11444630
  // returns Hash
  const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
  // returns SignedBlock
  const signedBlock = await api.rpc.chain.getBlock(blockHash);

  // the hash for the block, always via header (Hash -> toHex()) - will be
  // the same as blockHash above (also available on any header retrieved,
  // subscription or once-off)
  console.log(signedBlock.block.header.hash.toHex());

  // the hash for each extrinsic in the block
  signedBlock.block.extrinsics.forEach((ex, index) => {
    console.log(index, ex.hash.toHex());
  });

  console.debug('done')

  setTimeout(() => {
    process.exit(0)
  }, 5000)

}

main().catch(err => {
  console.debug(err)
  process.exit(-1)
})
