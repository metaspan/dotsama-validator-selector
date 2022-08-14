
// https://github.com/polkadot-js/apps/blob/master/packages/page-staking/src/useNominations.ts#L12

const { ApiPromise, WsProvider } = require('@polkadot/api')
const { endpoints } = require('./test-endpoints')
const fs = require('fs')

const chain_id = 'polkadot'
const endpoint = 'local';

class Validator {
  maxNominators = 256
  nominators = []

  constructor(stash) {
    this.stash = stash
  }

  async getNominators(api, batchSize=256) {
    const nss = await getNominatorStaking(api, batchSize)
    for(var idx = 0; idx < nss.length; idx++) {
      const nv = nss[idx]
      // uniq = uniq.concat(nv.targets)
      // console.debug(nv.targets)
      if(nv.targets.includes(this.stash)) {
        // console.log(`- ${nv.nominator}`)
        this.nominators.push(nv.nominator)
      }
    }
  
  }

  isOverSubscribed () {
    return this.nominators.length > this.maxNominators
  }

}

const getNominatorStaking = async (api, apiChunkSize = 64, validator) =>{

  console.debug(`getting the nominator entries...`)

  // // retrieve all the nominator keys
  // const keys = await api.query.staking.nominators.keys();
  // // extract the first key argument [AccountId] as string
  // const nominatorIds = keys.map(({ args: [nominatorId] }) => nominatorId);
  // console.log('all nominators:', nominatorIds.join(', '));
  // return []

  const nominators = await api.query.staking.nominators.entries();
  console.debug(`got ${nominators.length} entries !!`)

  var nominatorAddresses = nominators.map(([address]) => ""+address.toHuman()[0]);
  // console.debug(nominatorAddresses.toString())
  // fs.writeFileSync('test-nominatorAddresses.json', JSON.stringify(nominatorAddresses, {}, 2), 'utf-8')
  // console.debug('array includes', nominatorAddresses.includes('13pnRtJAQ3A7eg6m2hEYnsA9a4fLC1WgEBzi9E6CUTGqtSHu'))
  // return []
  // nominatorAddresses = ['13pnRtJAQ3A7eg6m2hEYnsA9a4fLC1WgEBzi9E6CUTGqtSHu']
  // console.debug(`the nominator addresses size is ${nominatorAddresses.length}`)

  //A too big nominators set could make crush the API => Chunk splitting
  const size = apiChunkSize
  var nominatorAddressesChunked = []

  for (let i = 0; i < nominatorAddresses.length; i += size) {
    const chunk = nominatorAddresses.slice(i, i + size)
    nominatorAddressesChunked.push(chunk)
  } 

  const nominatorsStakings = []
  // nominatorAddressesChunked.forEach(async (chunk, idx) => {
  for (var idx = 0; idx < nominatorAddressesChunked.length; idx++) {
    const chunk = nominatorAddressesChunked[idx]
    console.debug(`chunk ${idx}, the handled chunk size is ${chunk.length}`)
    // nominatorsStakings.push(...await api.derive.staking.accounts(chunk))

    // account details
    const accounts = await api.derive.staking.accounts(chunk)
    // console.debug('accounts.length', accounts.length)
    // nominations
    const addr_noms = await api.query.staking.nominators.multi(chunk)
    // console.debug('addr_noms.length', addr_noms.length)

    for (var idx2 = 0; idx2 < addr_noms.length; idx2++) {
    // addr_noms.forEach((an, idx) => {
      const an = addr_noms[idx2]
      const ac = accounts[idx2]
      // console.debug('account', ac)
      const anj = an.toJSON()
      // console.debug(idx, chunk[idx], anj)
      nominatorsStakings.push({nominator: chunk[idx2], account: ac, targets: anj?.targets || [] })
    }
  // })
  }
  // console.debug(nominatorsStakings)
  return nominatorsStakings
}

async function main () {

  const provider = new WsProvider(endpoints[chain_id][endpoint])
  const api = await ApiPromise.create({ provider: provider })
  // const signedBlock = await api.rpc.chain.getBlock('0xbc8090c55c508a422b33f1af00d10f48bc410ddb6491314c035bcbe8d01da9a5') // block '11432264')
  // const apiAt = await api.at(signedBlock.block.header.hash)

  const validator = '16ce9zrmiuAtdi9qv1tuiQ1RC1xR6y6NgnBcRtMoQeAobqpZ' // METASPAN
  // const validator = '15QPDZMfwSj7Ej4ZTWry5Hg4DnWiYRMCDrjsYtKPThMrGQVH'
  // const validator = '1zugcawsx74AgoC4wz2dMEVFVDNo7rVuTRjZMnfNp9T49po' // ZUG CAPITAL/11

  const val = new Validator(validator)
  await val.getNominators(api)
  if (val.isOverSubscribed()) {

  }
  console.debug(`validator ${val.stash} (${val.isOverSubscribed()? 'oversubscribed' : ''}) is nominated by`)
  console.debug(val.nominators)

  // const nominatorStaking = await getNominatorStaking(api, 256)
  // // fs.writeFileSync('test-targets.json', JSON.stringify(nominatorStaking, {}, 2), 'utf-8')

  // // api.query.staking.nominators.entries( entry => {
  // //   const { StorageKey, Option } = entry
  // //   console.log( StorageKey, Option )
  // // })

  // // console.log('length', nominatorStaking.length)
  // console.log(`Validator: ${validator} is nominated by:`)
  // // nominatorStaking.forEach(nv => {
  // // var uniq = []
  // for(var idx = 0; idx < nominatorStaking.length; idx++) {
  //   const nv = nominatorStaking[idx]
  //   // uniq = uniq.concat(nv.targets)
  //   // console.debug(nv.targets)
  //   if(nv.targets.includes(validator)) {
  //     console.log(`- ${nv.nominator}`)
  //   }
  // }

  // // uniq = [...new Set(uniq.sort())]
  // // console.log('# unique targets', uniq.length)
  // // console.debug('uniq includes validator', uniq.includes(validator))

  // console.debug(nominatorStaking[0])
  // // console.debug(nominatorStaking[1])
  // // console.debug(nominatorStaking[2])
  console.debug('done')

  setTimeout(() => {
    process.exit(0)
  }, 5000)

}

main().catch(err => {
  console.debug(err)
  process.exit(-1)
})
