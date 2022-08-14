
import moment from 'moment-timezone'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'
import { program } from 'commander'
import fs from 'fs'
import { MongoClient } from 'mongodb'

import { getMongoUrl, getChunkSize, shortStash, parseIdentity, slog } from './utils.js'

const MONGO_COLLECTION = 'w3f_nominator'
const MONGO_CONNECTION_URL = getMongoUrl()
const CHUNKSIZE = getChunkSize()

import { endpoints } from './endpoints.js'

async function getAllNominators (api, chain, batchSize=256) {
  if (fs.existsSync(`${chain}-nominators.json`)) {
    slog(`serving nominators from ${chain}-nominators.json`)
    return JSON.parse(fs.readFileSync(`${chain}-nominators.json`, 'utf-8'))
  }
  slog('recalculating nominators from chain...')
  const cnominators = await api.query.staking.nominators.entries();
  const nominatorAddresses = cnominators.map(([address]) => ""+address.toHuman()[0]);
  slog(`the nominator addresses size is ${nominatorAddresses.length}, working in chunks of ${batchSize}`)
  //A too big nominators set could make crash the API => Chunk splitting
  // const size = batchSize
  var nominatorAddressesChucked = []
  for (let i = 0; i < nominatorAddresses.length; i += batchSize) {
    const chunk = nominatorAddresses.slice(i, i + batchSize)
    nominatorAddressesChucked.push(chunk)
  }
  var nominatorsStakings = []
  var idx = 0
  for (const chunk of nominatorAddressesChucked) {
    console.debug(`${++idx} - the handled chunk size is ${chunk.length}`)
    // const accounts = await api.derive.staking.accounts(chunk)
    // const identities = await api.query.identity.identityOf.multi(chunk)
    // const parents = await  api.query.identity.superOf.multi(chunk)
    const [
      accounts, 
      // identities, 
      parents
    ] = await Promise.all([
      api.derive.staking.accounts(chunk),
      // api.query.identity.identityOf.multi(chunk),
      api.query.identity.superOf.multi(chunk),
    ])
    // slog(`accounts: ${accounts.length}, identities: ${identities.length}, parents: ${parents.length}`)
    accounts.forEach((a) => {
      // var id = null
      // if (identities[idx].toJSON()) {
      //   id = parseIdentity(idents[idx])
      // } else {
      //   var [parentStash, subId] = parents[idx]?.toJSON() || []
      //   // console.log(parentStash, '-raw-', hexToString(subId.raw))
      //   if (parentStash) {
      //     var parentIdentity = await api.query.identity.identityOf(parentStash)
      //     var idj = parentIdentity.toJSON()
      //     if (idj) {
      //       id = {
      //         sub_id: hexToString(subId.raw),
      //         parent_identity: parseIdentity(parentIdentity)
      //       }
      //     }  
      //   }
      // }
      // console.log(id)

      nominatorsStakings.push({
        chain: chain,
        accountId: a.accountId.toHuman(),
        nextSessionIds: a.nextSessionIds,
        sessionIds: a.sessionIds,
        controllerId: a.controllerId.toHuman(),
        // identity: id,
        exposure: a.exposure.toJSON(),
        // nominators: a.nominators.toJSON(),
        targets: a.nominators.toJSON(),
        rewardDestination: a.rewardDestination.toJSON(),
        validatorPrefs: a.validatorPrefs.toJSON(),
        redeemable: a.redeemable.toHuman(),
        unlocking: a.unlocking
      })
    })
    // console.debug(nominatorsStakings[0])
    // return nominatorsStakings
  }
  fs.writeFileSync(`${chain}-nominators.json`, JSON.stringify(nominatorsStakings, {}, 2), 'utf-8')
  return nominatorsStakings
}

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
    // const database = client.db(MONGO_DATABASE)
    // const col = database.collection(MONGO_COLLECTION)
    const col = client.db().collection(MONGO_COLLECTION)
    
    const chains = ['kusama', 'polkadot']

    for(var c = 0; c < chains.length; c++) {
      const chain = chains[c]
      const provider = new WsProvider(endpoints[chain]['local'])
      const api = await ApiPromise.create({ provider: provider })
      // slog('getting 1kv candidates')
      // candidates = await getCandidates(chain)
      // slog(`... found ${candidates.length}`)
      slog(`getting nominators for ${chain}:`)
      nominators = await getAllNominators(api, chain, CHUNKSIZE)
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
