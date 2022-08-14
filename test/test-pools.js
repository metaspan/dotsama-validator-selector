
/**
 * Process
 *   - get list of pools
 */

// const commander = require('commander')
import moment from 'moment-timezone'
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

  const pid = 50

  // var maptest = await api.query.staking.bonded.entries('F3opxRbN5ZavB4LTn2aKWL2iuHJifMsqn8uLnR2HQ1yQs7t')
  // maptest.forEach(([key, m]) => console.log(m).toString())
  // process.exit(0)

  // var bondedPools = await api.query.nominationPools.bondedPools(pid)
  // bondedPools = bondedPools.toJSON()
  // console.log(bondedPools)

  // pool name is in the meta
  // pool.name = await api.query.nominationPools.metadata(pid)
  // pool.name = hexToString(pool.name.toString())
  // // console.log(pool.name)

  // // {balance: 0, totalEarnings: 0, points: 0}
  // pool.rewardPools = await api.query.nominationPools.rewardPools(pid)
  // pool.rewardPools = pool.rewardPools.toJSON()
  // // console.log(pool.rewardPools)

  // var addresses = [
  //   'F3opxRbN5ZavB4LTn2JaUnScQc7G7G177CPnqjBpa9F9Gdr', // pool 50 stash
  //   'F3opxRbN5ZavB4LTn2aKWL2iuHJifMsqn8uLnR2HQ1yQs7t', // pool 50 reward
  //   'HhYuQCR1pJKVwPruCSNr8xp4R1ovqtAbNy3S8VuMXsPtBmH', // pool 50 depositor/root/etc
  // ]

  // addresses.forEach(async (address) => {
  //   console.log('address', address)
  //   var members = await api.query.nominationPools.poolMembers.entries(address)
  //   var keys    = await api.query.nominationPools.poolMembers.keys(address)
    
  //   console.log('members', members, 'keys', keys)
  //   // const accountIds = keys.map(({ args: [accountId] }) => accountId)
  //   const accountIds = keys.map(({ args }) => args)
  //   console.debug('accountIds', accountIds)

  //   members.forEach(([key, member]) => {
  //     console.log('key arguments:', key.args.map((k) => k.toHuman()));
  //     console.log('     exposure:', member.toHuman());
  //   })
  // })

  var entries = await api.query.nominationPools.poolMembers.entries()
  console.log('num entries', entries.length)
  var members = entries.reduce((all, [{ args: [accountId] }, optMember]) => {
    if (optMember.isSome) {
      const member = optMember.unwrap();
      const poolId = member.poolId.toNumber() // toString();

      if (!all[poolId]) {
        all[poolId] = [];
      }

      // all[poolId].push({
      //   accountId: accountId.toString(),
      //   member
      // });
      all[poolId].push(accountId.toString());
    }

    return all;
  }, {})


  // var keys = await api.query.nominationPools.poolMembers.keys(bondedPools.roles.root)
  // const accountIds = keys.map(({ args: [accountId] }) => accountId);
  // console.log(accountIds)
  // // F3opxRbN5ZavB4LTn2aKWL2iuHJifMsqn8uLnR2HQ1yQs7t
  // // pool.members = await api.query.nominationPools.poolMembers.entries('F3opxRbN5ZavB4LTn2aKWL2iuHJifMsqn8uLnR2HQ1yQs7t')
  // // console.log(pool.members[0]?.toJSON())
  // console.log('keys', keys)
  console.log('members', members)

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

