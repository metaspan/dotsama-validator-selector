
import 'dotenv/config'
import { hexToString } from '@polkadot/util'
import fs from 'fs'

const MONGO_HOST = process.env.MONGO_HOST || 'localhost'
const MONGO_PORT = process.env.MONGO_PORT || '27017'
const MONGO_USERID = process.env.MONGO_USERID || 'mongo_user'
const MONGO_PASSWD = process.env.MONGO_PASSWD || 'mongo_pass'
const MONGO_DATABASE = process.env.MONGO_DATABASE || 'mongo_db'
const MONGO_CONNECTION_URL = `mongodb://${MONGO_USERID}:${MONGO_PASSWD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`
const BATCH_SIZE = process.env.BATCH_SIZE || 256
const DATA_DIR = process.env.DATA_DIR || './data'

// function getMongoUrl () {
//   return MONGO_CONNECTION_URL
// }

function shortStash (stash, len=6) {
  return `${stash.slice(0, len)}...${stash.slice(-len)}`
}

function parseIdentity(id) {
  const idj = id.toJSON()
  // console.debug('idj', idj)
  if (idj) {
    return {
      deposit: idj.deposit,
      info: {
        // additional...
        display: idj.info.display.raw ? hexToString(idj.info.display.raw) : '',
        email: idj.info.email.raw ? hexToString(idj.info.email.raw) : '',
        // image...
        legal: idj.info.legal.raw ? hexToString(idj.info.legal.raw) : '',
        riot: idj.info.riot.raw ? hexToString(idj.info.riot.raw) : '',
        twitter: idj.info.twitter.raw ? hexToString(idj.info.twitter.raw) : '',
        web: idj.info.web.raw ? hexToString(idj.info.web.raw) : ''
      },
      judgements: idj.judgements
    }
  } else {
    return null
  }
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

function slog(text) {
  console.log(text)
}

async function getAllNominators (api, chain, batchSize=256) {
  if (fs.existsSync(`${DATA_DIR}/${chain}-nominators.json`)) {
    slog(`serving nominators from ${DATA_DIR}/${chain}-nominators.json`)
    return JSON.parse(fs.readFileSync(`${DATA_DIR}/${chain}-nominators.json`, 'utf-8'))
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
  fs.writeFileSync(`${DATA_DIR}/${chain}-nominators.json`, JSON.stringify(nominatorsStakings, {}, 2), 'utf-8')
  return nominatorsStakings
}

async function getAllValidators (api, chain, batchSize=256) {
  // console.debug('getAllValidators()...')
  var ret = []
  if (fs.existsSync(`${DATA_DIR}/${chain}-validators.json`)) {
    slog(`serving validators from ${DATA_DIR}/${chain}-validators.json`)
    return JSON.parse(fs.readFileSync(`${DATA_DIR}/${chain}-validators.json`, 'utf-8'))
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
  fs.writeFileSync(`.${DATA_DIR}/${chain}-validators.json`, JSON.stringify(ret, {}, 2), 'utf-8')
  return ret
}


export {
  MONGO_CONNECTION_URL,
  BATCH_SIZE,
  DATA_DIR,
  // getMongoUrl,
  // getChunkSize,
  getAllNominators,
  getAllValidators,
  getName,
  shortStash,
  parseIdentity,
  slog
}
