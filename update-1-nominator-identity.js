
// import moment from 'moment-timezone'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'
import fs from 'fs'
import { MongoClient } from 'mongodb'
import {
  MONGO_CONNECTION_URL,
  shortStash,
  parseIdentity, slog, DATA_DIR
} from './utils.js'

const chains = ['kusama', 'polkadot']
const MONGO_COLLECTION = 'w3f_nominator'
// const MONGO_CONNECTION_URL = getMongoUrl()

import { endpoints } from './endpoints.js'
const endpoint = 'parity'

async function getAllNominators (chain) {
  if (fs.existsSync(`${DATA_DIR}/${chain}-nominators.json`)) {
    slog(`serving nominators from ${DATA_DIR}/${chain}-nominators.json`)
    return JSON.parse(fs.readFileSync(`${DATA_DIR}/${chain}-nominators.json`, 'utf-8'))
  } else {
    console.warn('No validators found?')
  }
}

async function getIdentities (api, chain, batchSize=256) {
  var _identities = []
  for (var i = 0; i < nominators.length; i += batchSize) {
    const ids = nominators.slice(i, i + batchSize).map(m => m.accountId)
    // console.log(i, ids.length)
    _identities = _identities.concat(await api.query.identity.identityOf.multi(ids))
  }
  return _identities
}

async function getParents (api, chain, batchSize=256) {
  var _parents = []
  for (var i = 0; i < nominators.length; i += batchSize) {
    const ids = nominators.slice(i, i + batchSize).map(m => m.accountId)
    _parents = _parents.concat(await api.query.identity.superOf.multi(ids))
  }
  return _parents
}

async function constructId(api, nominator, identity, parent) {
  if(identity.toJSON()) {
    slog(`${nominator.accountId} has identity`)
    return parseIdentity(identity)
  }
  if(parent.toString()) {
    var [parentStash, subId] = parent.toJSON() || []
    if (parentStash) {
      slog(`${nominator.accountId} has parent`)
      var parentIdentity = await api.query.identity.identityOf(parentStash)
      var idj = parentIdentity.toJSON()
      if (idj) {
        slog(`${nominator.accountId} parent has identity`)
        return {
          subId: hexToString(subId.raw),
          parentIdentity: parseIdentity(parentIdentity)
        }
      } else {
        return null
      }
    }
  }
  return null
}

// GLOBALS ==========================
var nominators = [];
var identities = [];
var parents = [];

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

      slog(`getting data for ${chain}:`)
      nominators = await getAllNominators(chain);
      [
        identities,
        parents
      ] = await Promise.all([
        getIdentities(api, chain, 512),
        getParents(api, chain, 512)
      ])
      slog(`... found ${nominators.length} nominators`)
      slog(`... found ${identities.length} identities`)
      slog(`... found ${parents.length} parents`)

      nominators.forEach(async (nominator, idx) => {
        // console.debug(`updating ${nominator.accountId}`)
        const query = {
          // _id: nominator._id,
          accountId: nominator.accountId,
          chain: chain
        }
        var id = await constructId(api, nominator, identities[idx], parents[idx])
        if (id) {
          const result = await col.updateOne(query, { '$set': { identity: id } })
          slog(`updated ${nominator.accountId} ${id}`)
        }
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
