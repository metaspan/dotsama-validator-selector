
const { ApiPromise, WsProvider } = require('@polkadot/api')
const { endpoints } = require('./test-endpoints')

const chain = 'polkadot'
const endpoint = 'parity';

(async () => {

  const provider = new WsProvider(endpoints[chain][endpoint])
  const api = await ApiPromise.create({ provider: provider })

  const keys = await api.query.staking.validators.keys()
  const validators = keys.map(({ args: [validatorId] }) =>
    validatorId.toString()
  )

  console.debug(validators)

  process.exit(0)

})()
