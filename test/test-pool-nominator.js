
// const commander = require('commander')
import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'

import { endpoints } from './test/test-endpoints.js'


// START ============================
(async () => {

  console.log('Starting')
  // console.log('options', options)
    
  const chain = 'kusama'
  const endpoint = 'parity'

  const provider = new WsProvider(endpoints[chain][endpoint])
  const api = await ApiPromise.create({ provider: provider })

  // const ADDR = 'Ew5NJucSyE17T4QYBhjbm1WYrGk2oULTHyjiJacLbCNfc4Q'
  // const account = await api.query.system.account(ADDR)
  // console.log(account.toHuman())

  var bondedPools = await api.query.nominationPools.bondedPools.entries()
  bondedPools.forEach(([k, v]) => {
    console.log('k[0]', k.args[0].toString())
    console.log('v', JSON.stringify(v.toHuman()))
  })


  console.log('done...')

  // process.exit(0)

})()


  // // Retrieve the active era
  // const activeEra = await api.query.staking.activeEra();
  // console.log('activeEra', activeEra.toHuman())

  // // retrieve all exposures for the active era
  // const exposures = await api.query.staking.erasStakers.entries(activeEra.index);
  // console.log('exposures', exposures)

  // // exposures.forEach(([key, exposure]) => {
  // for (var i = 0; i < exposures.length; i++) {
  //   var exposure = exposures[i]
  //   console.log('key arguments:', key.args.map((k) => k.toHuman()));
  //   console.log('     exposure:', exposure.toHuman());
  // }
  // // // retrieve all the nominator keys
  // const keys = await api.query.staking.nominators.keys()
  // console.log('keys', keys)
  // // // extract the first key argument [AccountId] as string
  // // const nominatorIds = keys.map(({ args: [nominatorId] }) => nominatorId);
  // // console.log('all nominators:', nominatorIds.join(', '));

  // var counter = await api.query.nominationPools.counterForPoolMembers()
  // console.log('counter', counter.toString())
  // console.log('isNone', pool.members.isNone)
  // console.log('isSome', pool.members.isSome)

