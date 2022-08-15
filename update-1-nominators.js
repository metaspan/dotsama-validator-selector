
import moment from 'moment-timezone'
import { ApiPromise, WsProvider } from '@polkadot/api'
// import { hexToString } from '@polkadot/util'
// import { program } from 'commander'
// import fs from 'fs'
import { MongoClient } from 'mongodb'

import {
  MONGO_CONNECTION_URL,
  BATCH_SIZE,
  getAllNominators,
  shortStash,
  parseIdentity,
  slog
} from './include/utils.js'

const CHAINS = ['kusama', 'polkadot']
const MONGO_COLLECTION = 'w3f_nominator'

import { endpoints } from './include/endpoints.js'
const endpoint = 'parity'

// function calcValidatorNominations(chain) {
//   validator_nominators = {}
//   nominators.forEach(n => {
//     n.targets.forEach(t => {
//       if (validator_nominators[t]) {
//         if (!validator_nominators[t].includes(n.accountId)) {
//           validator_nominators[t].push(n.accountId)
//         }
//       } else {
//         validator_nominators[t] = [n.accountId]
//       }
//     })
//   })
//   fs.writeFileSync(`${chain}-validator-nominators.json`, JSON.stringify(validator_nominators, {}, 2), 'utf-8')
// }

// GLOBALS ==========================
var nominators = [];
var validator_nominators = {};

// START ============================
(async () => {

  console.log('Starting')
  const client = new MongoClient(MONGO_CONNECTION_URL)
  
  try {
    await client.connect()
    const col = client.db().collection(MONGO_COLLECTION)
    
    for(var c = 0; c < CHAINS.length; c++) {
      const chain = CHAINS[c]
      const provider = new WsProvider(endpoints[chain][endpoint])
      const api = await ApiPromise.create({ provider: provider })

      slog(`getting nominators for ${chain}:`)
      nominators = await getAllNominators(api, chain, BATCH_SIZE)
      slog(`... found ${nominators.length}`)

      // delete nominators
      await col.deleteMany({chain})

      nominators.forEach(async (nominator) => {
        slog(`updating ${nominator.accountId}`)
        const query = {
          // _id: nominator._id,
          accountId: nominator.accountId,
          chain: chain
        }
        nominator.chain = chain
        nominator.updatedAt = moment().utc().format()
        const result = await col.replaceOne(query, nominator, { upsert: true })
      })
    }
  } catch (err) {
    console.error(err)
  }

  slog('done...')

  setTimeout(() => {
    process.exit(0)
  }, 5000)

})()
