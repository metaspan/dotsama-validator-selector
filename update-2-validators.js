
import moment from 'moment-timezone'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'
import fs from 'fs'
import { MongoClient } from 'mongodb'

import {
  MONGO_CONNECTION_URL,
  BATCH_SIZE,
  DATA_DIR,
  getAllValidators,
  getAllNominators,
  getName,
  shortStash,
  parseIdentity,
  slog
} from './utils.js'
import { endpoints } from './endpoints.js'
const endpoint = 'parity'

const chains = ['kusama', 'polkadot']
// const MONGO_CONNECTION_URL = getMongoUrl()
// const BATCH_SIZE = getChunkSize()
const MONGO_COLLECTION = 'w3f_validator'


// async function getAllNominators (api, chain, batchSize=256) {
//   if (fs.existsSync(`${chain}-nominators.json`)) {
//     slog(`serving nominators from ${chain}-nominators.json`)
//     return JSON.parse(fs.readFileSync(`${chain}-nominators.json`, 'utf-8'))
//   }
//   const cnominators = await api.query.staking.nominators.entries();
//   const nominatorAddresses = cnominators.map(([address]) => ""+address.toHuman()[0]);
//   console.debug(`the nominator addresses size is ${nominatorAddresses.length}, working in chunks of ${batchSize}`)
//   //A too big nominators set could make crush the API => Chunk splitting
//   // const size = batchSize
//   var nominatorAddressesChucked = []
//   for (let i = 0; i < nominatorAddresses.length; i += batchSize) {
//     const chunk = nominatorAddresses.slice(i, i + batchSize)
//     nominatorAddressesChucked.push(chunk)
//   }
//   var nominatorsStakings = []
//   var idx = 0
//   for (const chunk of nominatorAddressesChucked) {
//     console.debug(`${++idx} - the handled chunk size is ${chunk.length}`)
//     const accounts = await api.derive.staking.accounts(chunk)
//     nominatorsStakings.push(...accounts.map(a => {
//       return {
//         chain: chain,
//         accountId: a.accountId.toHuman(),
//         nextSessionIds: a.nextSessionIds,
//         sessionIds: a.sessionIds,
//         controllerId: a.controllerId.toHuman(),
//         exposure: a.exposure.toJSON(),
//         // nominators: a.nominators.toJSON(),
//         targets: a.nominators.toJSON(),
//         rewardDestination: a.rewardDestination.toJSON(),
//         validatorPrefs: a.validatorPrefs.toJSON(),
//         redeemable: a.redeemable.toHuman(),
//         unlocking: a.unlocking
//       }
//     }))
//     // console.debug(nominatorsStakings[0])
//     // return nominatorsStakings
//   }
//   fs.writeFileSync(`${chain}-nominators.json`, JSON.stringify(nominatorsStakings, {}, 2), 'utf-8')
//   return nominatorsStakings
// }

function calcValidatorNominators(chain) {
  validator_nominators = {}
  nominators.forEach(n => {
    n.targets.forEach(t => {
      if (validator_nominators[t]) {
        if (!validator_nominators[t].includes(n.accountId)) {
          validator_nominators[t].push(n.accountId)
        }
      } else {
        validator_nominators[t] = [n.accountId]
      }
    })
  })
  fs.writeFileSync(`${DATA_DIR}/${chain}-validator-nominators.json`, JSON.stringify(validator_nominators, {}, 2), 'utf-8')
}

// GLOBALS ==========================
var validators = [];
var nominators = [];
var validator_nominators = {};

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

      slog(`getting nominators for ${chain}`)
      nominators = await getAllNominators(api, chain, BATCH_SIZE)
      slog(`... found ${nominators.length}`)
      calcValidatorNominators(chain)
      slog(`getting validators for ${chain}`)
      validators = await getAllValidators(api, chain, BATCH_SIZE)
      slog(`... found ${validators.length}`)

      // delete old data
      await col.deleteMany({chain})

      validators.forEach(async (validator) => {
        slog(`updating ${validator.stash}`)
        validator.name = getName(validator)
        const query = {
          // _id: validator._id,
          stash: validator.stash,
          chain: chain
        }
        validator.chain = chain
        validator.updatedAt = moment().utc().format()
        const result = await col.replaceOne(query, validator, { upsert: true })
      })
    }
  } catch (err) {
    console.error(err)
  }

  slog('done...')

  // wait for DB commit...
  setTimeout(() => {
    process.exit(0)
  }, 5000)

})()
