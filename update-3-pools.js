
import moment from 'moment-timezone'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'
import { MongoClient } from 'mongodb'

import { endpoints } from './endpoints.js'
const endpoint = 'parity'
import { MONGO_CONNECTION_URL, shortStash, parseIdentity, slog } from './utils.js'

const chains = [
  'kusama',
  // 'polkadot' // no pools yet...!
]
// const MONGO_CONNECTION_URL = getMongoUrl()
const MONGO_COLLECTION = 'w3f_pool'

async function getAllPools (api, chain) {
  slog(`getAllPools(): ${chain}`)
  var ret = []
  var entries = await api.query.nominationPools.poolMembers.entries()
  // console.log('num entries', entries.length)
  var poolMembers = entries.reduce((all, [{ args: [accountId] }, optMember]) => {
    if (optMember.isSome) {
      const member = optMember.unwrap()
      const poolId = parseInt(member.poolId.toString())
      if (!all[poolId]) {
        all[poolId] = []
      }
      // all[poolId].push({
      //   accountId: accountId.toString(),
      //   member
      // });
      all[poolId].push(accountId.toString())
    }
    return all
  }, {})

  var lastId = await api.query.nominationPools.lastPoolId()
  for (var pid = 1; pid <= lastId; pid++) {
    slog(`pool ${pid} =====================`)
    var pool = { id: pid }

    // var example = {
    //   "points":1999966666667,
    //   "state":"Open",
    //   "memberCounter":1,
    //   "roles":{
    //     "depositor":"Ghekn7fgaxi7GX7ty547qt81vo6m3V735dCF5WgJ3ZE5vfb",
    //     "root":"Ghekn7fgaxi7GX7ty547qt81vo6m3V735dCF5WgJ3ZE5vfb",
    //     "nominator":"Ghekn7fgaxi7GX7ty547qt81vo6m3V735dCF5WgJ3ZE5vfb",
    //     "stateToggler":"Ghekn7fgaxi7GX7ty547qt81vo6m3V735dCF5WgJ3ZE5vfb"
    //   }
    // }
    var bondedPools = await api.query.nominationPools.bondedPools(pid)
    bondedPools = bondedPools.toJSON()
    pool.points = bondedPools.points
    pool.state = bondedPools.state
    pool.memberCounter = bondedPools.memberCounter
    pool.roles = bondedPools.roles
    // console.log(pool.bondedPools)

    // pool name is in the meta
    pool.name = await api.query.nominationPools.metadata(pid)
    pool.name = hexToString(pool.name.toString())
    // console.log(pool.name)

    // {balance: 0, totalEarnings: 0, points: 0}
    var rewardPools = await api.query.nominationPools.rewardPools(pid)
    rewardPools = rewardPools.toJSON()
    pool.balance = rewardPools.balance
    pool.totalEarnings = rewardPools.totalEarnings
    // pool.points = rewardPools.points
    // console.log(pool.rewardPools)

    pool.members = poolMembers[pool.id]
    // console.log(pool.members)

    pool.subPoolStorage = await api.query.nominationPools.subPoolsStorage(pid)
    pool.subPoolStorage = pool.subPoolStorage.toJSON()

    ret.push(pool)
  }
  return ret
}

// GLOBALS ==========================
var pools = [];

// START ============================
(async () => {

  slog('Starting')

  const client = new MongoClient(MONGO_CONNECTION_URL)
  try {
    await client.connect()
    // const database = client.db(MONGO_DATABASE)
    const col = client.db().collection(MONGO_COLLECTION)
    
    for(var c = 0; c < chains.length; c++) {
      const chain = chains[c]
      const provider = new WsProvider(endpoints[chain][endpoint])
      const api = await ApiPromise.create({ provider: provider })

      // var maptest = await api.query.staking.bonded.entries('F3opxRbN5ZavB4LTn2aKWL2iuHJifMsqn8uLnR2HQ1yQs7t')
      // maptest.forEach(([key, m]) => console.log(m).toString())
      // process.exit(0)

      var entries = await api.query.nominationPools.poolMembers.entries()
      // console.log('num entries', entries.length)
      var members = entries.reduce((all, [{ args: [accountId] }, optMember]) => {
        if (optMember.isSome) {
          const member = optMember.unwrap();
          const poolId = member.poolId.toNumber() // toString();
    
          if (!all[poolId]) {
            all[poolId] = [];
          }
    
          all[poolId].push({
            accountId: accountId.toString(),
            points: member.points.toNumber()
            // member
          });
          // all[poolId].push(accountId.toString());
        }
    
        return all;
      }, {})

      slog(`getting pools for ${chain}`)
      pools = await getAllPools(api, chain)
      slog(`... found ${pools.length}`)

      // delete old data
      await col.deleteMany({chain})

      pools.forEach(async (pool) => {
        slog(`updating ${pool.name}`)
        const query = {
          // _id: pool._id,
          id: pool.id,
          chain: chain
        }
        pool.chain = chain
        pool.members = members[pool.id]
        pool.updatedAt = moment().utc().format()
        const result = await col.replaceOne(query, pool, { upsert: true })
      })
    }
  } catch (err) {
    console.error(err)
  }

  slog('done...')

  // wait for db commit...
  setTimeout(() => {
    process.exit(0)
  }, 4000)

})()
