
/**
 * why this script?
 * ONE-T report returns a shortened stash "ABCDEF...123456".
 * We try to map these to 'known' stashes
 * see https://github.com/turboflakes/one-t/issues/3
 */

import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'
// import axios from 'axios'

import { endpoints } from './endpoints.js'
import fs from 'fs'

import { parseIdentity } from './utils.js'

// const chain_id = 'kusama'
const chains = ['kusama', 'polkadot']
const endpoint = 'local';

var nominators = {
  kusama: [],
  polkadot: [],
}

var known_validators = {
  kusama: [],
  polkadot: []
}

function getNominators() {
  console.debug('getNominators')
  nominators.kusama = JSON.parse(fs.readFileSync('kusama-nominators.json', 'utf-8'))
  nominators.polkadot = JSON.parse(fs.readFileSync('polkadot-nominators.json', 'utf-8'))
}

async function getAllValidators (api, chain_id, batchSize=256) {
  console.debug(`getAllValidators ${chain_id}...`)
  var ret = []
  // var validator_ids = await api.query.session.validators()
  // validator_ids = validator_ids.toJSON()
  var validator_ids = []
  for (var i = 0; i < nominators[chain_id].length; i++) {
    const nom = nominators[chain_id][i]
    for (var j = 0; j < nom.targets.length; j++) {
      validator_ids.push(nom.targets[j])
    }
  }
  validator_ids = [...new Set(validator_ids.sort())]
  console.debug(`found ${validator_ids.length} validators...`)
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
    for (var j = 0; j < ids.length; j++) {
      // if('DSA55HQ9uGHE5MyMouE8Geasi2tsDcu3oHR4aFkJ3VBjZG5' === ids[j]) {
      var validator = { stash: ids[j] }
      // console.log(`|${identities[j].toString()}|`)
      if (identities[j].toString() !== '') {
        validator.identity = parseIdentity(identities[j])
        validator.name = validator.identity?.info.display
      } else {
        // check if there is a parent identity
        const parent = await api.query.identity.superOf(validator.stash)
        if(parent.toString() !== '') {
          var [parentStash, subId] = parent.toJSON()
          // console.log(parentStash, '-raw-', hexToString(subId.raw))
          var parentIdentity = await api.query.identity.identityOf(parentStash)
          parentIdentity = parseIdentity(parentIdentity)
          // console.log('parent name:', hexToString(idj.info.display.raw))
          validator.name = `${parentIdentity.info.display}/${hexToString(subId.raw)}`
          // console.log(validator.name)
        }
      }
      // ret.push({
      //   stash: ids[j], 
      //   shortStash: shortStash(ids[j]), 
      //   identity: parseIdentity(identities[j]),
      //   prefs: prefs[j].toJSON(),
      //   nominators: validator_nominators[ids[j]]
      // })
      ret.push(validator)
    }
  }
  return ret
}

(async () => {

  getNominators()

  for(var c = 0; c < chains.length; c++) {
    const chain_id = chains[c]
    console.debug('chain: ', chain_id)

    const provider = new WsProvider(endpoints[chain_id][endpoint])
    const api = await ApiPromise.create({ provider: provider })
  
    const vals = await getAllValidators(api, chain_id)
    known_validators[chain_id] = vals
  
    // console.log(vals)
    
  }
  fs.writeFileSync('known-validators.json', JSON.stringify(known_validators, {}, 2), 'utf-8')

  // var validator = { stash: "HyLisujX7Cr6D7xzb6qadFdedLt8hmArB6ZVGJ6xsCUHqmx" }; // METASPAN
  // var identity = await api.query.identity.identityOf(validator.stash)
  // console.log(identity.toString())

  // validator = { name: '☀️SHAWN☀️/08🚀', stash: 'GvBUeTDynB9A7fFDPoBt3RGXSjZVeCetoXjYQ44cMNp5myY' }
  // identity = await api.query.identity.identityOf(validator.stash)
  // console.log(identity.toString())

  // // get the parent
  // const parent = await api.query.identity.superOf(validator.stash)
  // // console.log(parent.toString())

  // var [parentStash, subId] = parent.toJSON()
  // console.log(parentStash, '-raw-', hexToString(subId.raw))

  // var parentIdentity = await api.query.identity.identityOf(parentStash)
  // var idj = parentIdentity.toJSON()
  // console.log('parent name:', hexToString(idj.info.display.raw))

  // // now get all the kids
  // var kids = await api.query.identity.subsOf(stash)
  // console.log(kids.toJSON())


  console.debug('done')

  setTimeout(() => {
    process.exit(0)
  }, 5000)

})()

