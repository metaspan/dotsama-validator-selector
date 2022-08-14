
// https://github.com/polkadot-js/apps/blob/master/packages/page-staking/src/useNominations.ts#L12

const { ApiPromise, WsProvider } = require('@polkadot/api')
const { endpoints } = require('./test-endpoints')

const chain_id = 'polkadot'
const endpoint = 'local';

const getNominatorStaking = async (api, apiChunkSize = 64) =>{

  console.debug(`getting the nominator entries...`)
  const nominators = await api.query.staking.nominators.entries();
  console.debug(`got ${nominators.length} entries !!`)
  const nominatorAddresses = nominators.map(([address]) => ""+address.toHuman()[0]);

  console.debug(`the nominator addresses size is ${nominatorAddresses.length}`)

  //A too big nominators set could make crush the API => Chunk splitting
  const size = apiChunkSize
  var nominatorAddressesChucked = []
  for (let i = 0; i < nominatorAddresses.length; i += size) {
    const chunk = nominatorAddresses.slice(i, i + size)
    nominatorAddressesChucked.push(chunk)
  } 

  const nominatorsStakings = []
  for (const chunk of nominatorAddressesChucked) {
    console.debug(`the handled chunk size is ${chunk.length}`)
    nominatorsStakings.push(...await api.derive.staking.accounts(chunk))
  }

  return nominatorsStakings
}

async function main () {

  const provider = new WsProvider(endpoints[chain_id][endpoint])
  const api = await ApiPromise.create({ provider: provider })

  const nomintorStaking = await getNominatorStaking(api, 128)

  // api.query.staking.nominators.entries( entry => {
  //   const { StorageKey, Option } = entry
  //   console.log( StorageKey, Option )
  // })

  console.debug(nomintorStaking[0])
  console.debug(nomintorStaking[1])
  console.debug(nomintorStaking[2])
  // process.exit(0)

}

main().catch(err => {
  console.debug(err)
  process.exit(-1)
})
