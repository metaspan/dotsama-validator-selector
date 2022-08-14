
import moment from 'moment-timezone'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'
import fs from 'fs'
import { MongoClient } from 'mongodb'

import { getMongoUrl, getChunkSize, shortStash, parseIdentity, slog } from './utils.js'

const chains = ['kusama', 'polkadot']
const MONGO_CONNECTION_URL = getMongoUrl()
const CHUNKSIZE = getChunkSize()
const MONGO_COLLECTION = 'w3f_validator'

import { endpoints } from './endpoints.js'

async function getAllValidators (api, chain, batchSize=256) {
  // console.debug('getAllValidators()...')
  var ret = []
  if (fs.existsSync(`${chain}-validators.json`)) {
    slog(`serving validators from ${chain}-validators.json`)
    return JSON.parse(fs.readFileSync(`${chain}-validators.json`, 'utf-8'))
  }
  // @TODO - this only gets the active validators...!!! better to get them from the list of nominators.
  // var validator_ids = await api.query.session.validators()
  // validator_ids = validator_ids.toJSON()
  var validator_ids = []
  for (var i = 0; i < nominators.length; i++) {
    const nom = nominators[i]
    for (var j = 0; j < nom.targets.length; j++) {
      validator_ids.push(nom.targets[j])
    }
  }
  validator_ids = [...new Set(validator_ids.sort())]
  // console.debug(validators.toJSON())
  // get any on-chain identities
  for(var i = 0; i < validator_ids.length; i += batchSize) {
    const ids = validator_ids.slice(i, i + batchSize)
    const identities = await api.query.identity.identityOf.multi(ids)
    // let test = {
    //   "judgements":[[1,{"reasonable":null}]],
    //   "deposit":1666666666660,
    //   "info":{
    //     "additional":[],
    //     "display":{"raw":"0x5855414e5f32"},
    //     "legal":{"none":null},
    //     "web":{"none":null},
    //     "riot":{"raw":"0x407875616e39333a6d61747269782e6f7267"},
    //     "email":{"raw":"0x79616e676a696e677875616e6d61696c40676d61696c2e636f6d"},
    //     "pgpFingerprint":null,
    //     "image":{"none":null},
    //     "twitter":{"none":null}
    //   }
    // }
    const prefs = await api.query.staking.validators.multi(ids)
    const parents = await  api.query.identity.superOf.multi(ids)
    for (var j = 0; j < ids.length; j++) {
      // if('DSA55HQ9uGHE5MyMouE8Geasi2tsDcu3oHR4aFkJ3VBjZG5' === ids[j]) {
      var id = null
      if (identities[j].toJSON() === null) {
        // check if there is a sub-identity
        console.debug('checking parent id for ', ids[j])
        // get the parent
        const parent = parents[j] // await api.query.identity.superOf(ids[j])
        // console.log(parent.toString())
        if(parent.toString() !== '') {
          var [parentStash, subId] = parent.toJSON()
          // console.log(parentStash, '-raw-', hexToString(subId.raw))
          var parentIdentity = await api.query.identity.identityOf(parentStash)
          var idj = parentIdentity.toJSON()
          if (idj) {
            id = {
              sub_id: hexToString(subId.raw),
              parent_identity: parseIdentity(parentIdentity)
            }
            console.log('parent name:', hexToString(idj.info.display.raw))  
          }
        }
      } else {
        id = parseIdentity(identities[j])
      }
      ret.push({
        stash: ids[j], 
        shortStash: shortStash(ids[j]), 
        identity: id,
        prefs: prefs[j].toJSON(),
        nominators: validator_nominators[ids[j]]
      })
    }
  }
  fs.writeFileSync(`${chain}-validators.json`, JSON.stringify(ret, {}, 2), 'utf-8')
  return ret
}

async function getAllNominators (api, chain, batchSize=256) {
  if (fs.existsSync(`${chain}-nominators.json`)) {
    slog(`serving nominators from ${chain}-nominators.json`)
    return JSON.parse(fs.readFileSync(`${chain}-nominators.json`, 'utf-8'))
  }
  const cnominators = await api.query.staking.nominators.entries();
  const nominatorAddresses = cnominators.map(([address]) => ""+address.toHuman()[0]);
  console.debug(`the nominator addresses size is ${nominatorAddresses.length}, working in chunks of ${batchSize}`)
  //A too big nominators set could make crush the API => Chunk splitting
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
    const accounts = await api.derive.staking.accounts(chunk)
    nominatorsStakings.push(...accounts.map(a => {
      return {
        chain: chain,
        accountId: a.accountId.toHuman(),
        nextSessionIds: a.nextSessionIds,
        sessionIds: a.sessionIds,
        controllerId: a.controllerId.toHuman(),
        exposure: a.exposure.toJSON(),
        // nominators: a.nominators.toJSON(),
        targets: a.nominators.toJSON(),
        rewardDestination: a.rewardDestination.toJSON(),
        validatorPrefs: a.validatorPrefs.toJSON(),
        redeemable: a.redeemable.toHuman(),
        unlocking: a.unlocking
      }
    }))
    // console.debug(nominatorsStakings[0])
    // return nominatorsStakings
  }
  fs.writeFileSync(`${chain}-nominators.json`, JSON.stringify(nominatorsStakings, {}, 2), 'utf-8')
  return nominatorsStakings
}

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
  fs.writeFileSync(`${chain}-validator-nominators.json`, JSON.stringify(validator_nominators, {}, 2), 'utf-8')
}

function getName (val) {
  var ret = ''
  if (val.identity) {
    if (val.identity.parent_identity) {
      ret = val.identity.parent_identity?.info?.display + '/' + val.identity.sub_id
    } else {
      ret = val.identity.info.display || val.stash
    }
  } else {
    ret = val.stash
  }
  return ret
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
      const provider = new WsProvider(endpoints[chain]['local'])
      const api = await ApiPromise.create({ provider: provider })
      // slog('getting 1kv candidates')
      // candidates = await getCandidates(chain)
      // slog(`... found ${candidates.length}`)
      slog(`getting nominators for ${chain}`)
      nominators = await getAllNominators(api, chain, CHUNKSIZE)
      slog(`... found ${nominators.length}`)
      calcValidatorNominators(chain)
      slog(`getting validators for ${chain}`)
      validators = await getAllValidators(api, chain, CHUNKSIZE)
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
