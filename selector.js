
/**
 * Process
 *   - get list of 'known' validators
 *   - 
 */

// const commander = require('commander')
import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'
import { program } from 'commander'
// const program = new commander.Command();
import fs from 'fs'
import path from 'path'
import axios from 'axios'

import { endpoints } from './endpoints.js'
import { shortStash, parseIdentity, slog } from './utils.js'

program
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-c, --chain <chain>', 'kusama | polkadot, defaults to kusama', 'kusama')
  .option('-d, --data', 'Data directory, defaults to ./data', './data')
  .option('-e, --endpoint <provider>', 'Endpoint provider, defaults to parity', 'local') // 'parity'
  .option('-l, --loglevel <level>', 'Logging level, defaults to info', 'info') // 'parity'
  .option('-p, --prefix', 'File prefix, defaults to onet_', 'onet_')
  .option('-t, --top <number>', '# vals in file to compare, default 50', '50')
  .option('-m, --maxcommission', 'Maximim validator commission permitted, default 10', '10')
  .parse(process.argv)

const options = program.opts()

const fieldDefs = [
  {id: 'seq', name: '#'},
  {id: 'validator', name: 'Validator'},
  {id: 'subset', name: 'Subset'},
  {id: 'active_sessions', name: 'Active Sessions'},
  {id: 'pv_sessions', name: 'P/V Sessions'},
  {id: 'f1', name: '❒'},
  {id: 'f2', name: '↻'},
  {id: 'f3', name: '✓i'},
  {id: 'f4', name: '✓e'},             
  {id: 'f5', name: '✗'},
  {id: 'grade', name: 'Grade'},          
  {id: 'mvr', name: 'MVR'},
  {id: 'avg_ppts', name: 'Avg. PPTS'},      
  {id: 'score', name: 'Score'},
  {id: 'commission', name: 'Commission (%)'}, 
  {id: 'commission_score', name: 'Commission Score'},
  {id: 'timeline', name: 'Timeline'}
]

const knownValidators = JSON.parse(fs.readFileSync('./known-validators.json', 'utf-8'))

function parseFields (fields) {
  var ret = {}
  for(var i = 0; i < fieldDefs.length; i++) {
    ret[fieldDefs[i].id] = fields[i]
  }
  return ret
}

function read_onet () {
  const files = fs.readdirSync(options.data)
  const file = files.filter(f => f.startsWith(options.prefix + options.chain) && f.endsWith('txt')).pop()
  if (!file || file ==="") {
    console.error('No onet file found...!')
    return
  } else {
    var data = fs.readFileSync(path.join(options.data, file), 'utf-8')
    var lines = data.split('\n')
    var headers = lines[3].split('\t')
    // console.log(headers)
    var ret = []
    for (var i = 4; i < lines.length; i++) {
      const fields = lines[i].split('\t')
      if(fields[0] !== '') {
        ret.push(parseFields(fields))
      }
    }
    return ret // lines.slice(4, lines.length-6) //.slice(-4)
  }
}

async function getCandidates () {
  try {
    // const url = `https://api.metaspan.io/api/${options.chain}/candidate`
    const url = `http://192.168.1.82:8080/function/w3f-1kv-candidates-${options.chain}`
    const ret = await axios.get(url)
    if (!ret.data) { slog('\n\nno data?\n\n'); console.debug(ret) }
    return ret.data.updatedAt ? ret.data.candidates : ret.data
  } catch (err) {
    console.warn('HTTP error for candidates!')
    return []
  }
}

async function getAllValidators (api, batchSize=256) {
  // console.debug('getAllValidators()...')
  var ret = []
  if (fs.existsSync(`${options.chain}-validators.json`)) {
    slog(`serving validators from ${options.chain}-validators.json`)
    return JSON.parse(fs.readFileSync(`${options.chain}-validators.json`, 'utf-8'))
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
  fs.writeFileSync(`${options.chain}-validators.json`, JSON.stringify(ret, {}, 2), 'utf-8')
  return ret
}

async function getAllNominators (api, batchSize=256) {
  if (fs.existsSync(`${options.chain}-nominators.json`)) {
    slog(`serving nominators from ${options.chain}-nominators.json`)
    return JSON.parse(fs.readFileSync(`${options.chain}-nominators.json`, 'utf-8'))
  }
  const nominators = await api.query.staking.nominators.entries();
  const nominatorAddresses = nominators.map(([address]) => ""+address.toHuman()[0]);
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
        nextSessionIds: a.nextSessionIds,
        sessionIds: a.sessionIds,
        accountId: a.accountId.toHuman(),
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
  fs.writeFileSync(`${options.chain}-nominators.json`, JSON.stringify(nominatorsStakings, {}, 2), 'utf-8')
  return nominatorsStakings
}

function matchValidator (stat) {
  var possK = knownValidators[options.chain].filter(f => {
    if(f.name === stat.validator) return true
  })
  if(possK.length === 1) { return possK }
  var possV = validators.filter(f => {
    // shortStash
    if(f.shortStash === stat.validator) return true
    // Name
    if(f.identity?.info?.display === stat.validator) return true
    // if(stat.validator.startsWith(f.identity?.info?.display)) return true
    // Name & sub?
    return false
  })
  var possC = candidates.filter(f => {
    if(f.name === stat.validator) return true
    if(f.identity.name === stat.validator) return true
    if(f.identity.sub && `${f.identity.name}/${f.identity.sub}` === stat.validator) return true
    if(`${f.identity.name.toUpperCase()}` === stat.validator.toUpperCase()) return true
    if(f.identity.sub && `${f.identity.name.toUpperCase()}/${(''+f.identity.sub).toUpperCase()}` === stat.validator.toUpperCase()) return true
    return false
  })
  const allPoss = possV.map(m => m.stash).concat(possC.map(m => m.stash)).concat(possK.map(m => m.stash))
  return Array.from(new Set(allPoss))
}

function calcValidatorNominations() {
  if (fs.existsSync(`${options.chain}-validator-nominators.json`)) {
    slog(`serving validator nominators from ${options.chain}-validator-nominators.json`)
    return JSON.parse(fs.readFileSync(`${options.chain}-validator-nominators.json`, 'utf-8'))
  }
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
  fs.writeFileSync(`${options.chain}-validator-nominators.json`, JSON.stringify(validator_nominators, {}, 2), 'utf-8')
}

// GLOBALS ==========================
var validators = [];
var candidates = [];
var nominators = [];
var validator_nominators = {};

// START ============================
(async () => {

  slog('Starting')
  console.log('options', options)

  var data = []
  data = read_onet()
  // console.log(data[data.length-1])

  const provider = new WsProvider(endpoints[options.chain][options.endpoint])
  const api = await ApiPromise.create({ provider: provider })
  slog('getting 1kv candidates')
  candidates = await getCandidates()
  slog(`... found ${candidates.length}`)
  slog('getting nominators')
  nominators = await getAllNominators(api, 512)
  slog(`... found ${nominators.length}`)
  slog('calculating validator nominators')
  calcValidatorNominations()
  slog('getting validators')
  validators = await getAllValidators(api, 512)
  slog(`... found ${validators.length}`)

  // console.log(validators)
  // validators.forEach(v => {
  //   // if(v.identity) console.log(JSON.stringify(v.identity))
  //   if(v.identity) console.log(v.identity)
  // })

  // identify each validator
  for(var i = 0; i < data.length; i++) {
    var stat = data[i]
    var poss = matchValidator(stat)
    if (poss.length === 1) {
      // console.debug(poss)
      data[i].stash = poss[0].stash
    } else if (poss.length !== 1) {
      console.debug(stat.validator, 'has', poss.length, 'possibles')
      console.log(poss)
    }
  }

  // var top = 500 // data.length
  var top = Math.min(options.top, data.length)
  var maxComm = options.max_commission
  for(var i = 0; i < top; i++) {
    // console.debug(data[i])
    const stat = data[i]
    const stash = stat.stash
    if (stash) {
      const sep = '|'
      const validator = validators.find(f => f.stash === stash)
      const commission = (validator?.prefs?.commission / 10000000) || -1
      const nom_count = validator_nominators[stat.stash]?.length || 0
      // const candidate = candidates.find(f => f.stash === stash)
      if (commission <= options.maxcommission 
        // && nom_count < 257
        ) console.log(
        sep,
        stat.stash ? stat.stash : 'unknown',
        sep,
        commission,
        sep,
        nom_count > 255 ? nom_count+'**' : nom_count,
        sep,
        stat.validator,
        sep
      )
    } else {
      console.log(stat.validator, 'has no stash...')
    }
  }

  process.exit(0)

})()
