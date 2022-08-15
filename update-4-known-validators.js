
/**
 * why this script?
 * ONE-T report returns a shortened stash "ABCDEF...123456".
 * We try to map these to 'known' stashes
 * see https://github.com/turboflakes/one-t/issues/3
 */

import { ApiPromise, WsProvider } from '@polkadot/api'
// import { hexToString } from '@polkadot/util'
// import axios from 'axios'

import { endpoints } from './endpoints.js'
import fs from 'fs'

import {
  DATA_DIR,
  getAllValidators,
  BATCH_SIZE,
  parseIdentity
} from './utils.js'

// const chain_id = 'kusama'
const chains = ['kusama', 'polkadot']
const endpoint = 'parity'

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
  nominators.kusama = JSON.parse(fs.readFileSync(`${DATA_DIR}/kusama-nominators.json`, 'utf-8'))
  nominators.polkadot = JSON.parse(fs.readFileSync(`${DATA_DIR}/polkadot-nominators.json`, 'utf-8'))
}

(async () => {

  getNominators()

  for(var c = 0; c < chains.length; c++) {
    const chain_id = chains[c]
    console.debug('chain: ', chain_id)

    const provider = new WsProvider(endpoints[chain_id][endpoint])
    const api = await ApiPromise.create({ provider: provider })
  
    const vals = await getAllValidators(api, chain_id, BATCH_SIZE)
    known_validators[chain_id] = vals
  
    // console.log(vals)
    
  }
  fs.writeFileSync(`${DATA_DIR}/known-validators.json`, JSON.stringify(known_validators, {}, 2), 'utf-8')

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

