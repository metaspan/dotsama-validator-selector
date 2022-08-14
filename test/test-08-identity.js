
import { ApiPromise, WsProvider } from '@polkadot/api'
import { hexToString } from '@polkadot/util'

import { endpoints } from './test-endpoints.js'

const chain_id = 'kusama'
const endpoint = 'local';

(async () => {

  const provider = new WsProvider(endpoints[chain_id][endpoint])
  const api = await ApiPromise.create({ provider: provider })

  var validator = { stash: "HyLisujX7Cr6D7xzb6qadFdedLt8hmArB6ZVGJ6xsCUHqmx" }; // METASPAN
  var identity = await api.query.identity.identityOf(validator.stash)
  console.log(identity.toString())

  validator = { name: '☀️SHAWN☀️/08🚀', stash: 'GvBUeTDynB9A7fFDPoBt3RGXSjZVeCetoXjYQ44cMNp5myY' }
  identity = await api.query.identity.identityOf(validator.stash)
  console.log(identity.toString())

  // get the parent
  const parent = await api.query.identity.superOf(validator.stash)
  // console.log(parent.toString())

  var [parentStash, subId] = parent.toJSON()
  console.log(parentStash, '-raw-', hexToString(subId.raw))

  var parentIdentity = await api.query.identity.identityOf(parentStash)
  var idj = parentIdentity.toJSON()
  console.log('parent name:', hexToString(idj.info.display.raw))


  // // now get all the kids
  // var kids = await api.query.identity.subsOf(stash)
  // console.log(kids.toJSON())


  console.debug('done')

  setTimeout(() => {
    process.exit(0)
  }, 5000)

})()

