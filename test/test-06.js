
// https://github.com/polkadot-js/apps/blob/master/packages/page-staking/src/useNominations.ts#L12

const { ApiPromise, WsProvider } = require('@polkadot/api')
const { endpoints } = require('./test-endpoints')
const fs = require('fs')

const chain_id = 'polkadot'
const endpoint = 'local';
// const endpoint = 'parity';

const { Validator } = require('./test-validator.class')
const { Account } = require('./test-account.class')

async function main () {

  const provider = new WsProvider(endpoints[chain_id][endpoint])
  const api = await ApiPromise.create({ provider: provider })
  // const signedBlock = await api.rpc.chain.getBlock('0xbc8090c55c508a422b33f1af00d10f48bc410ddb6491314c035bcbe8d01da9a5') // block '11432264')
  // const apiAt = await api.at(signedBlock.block.header.hash)

  const validator = '16ce9zrmiuAtdi9qv1tuiQ1RC1xR6y6NgnBcRtMoQeAobqpZ' // METASPAN
  // const validator = '15QPDZMfwSj7Ej4ZTWry5Hg4DnWiYRMCDrjsYtKPThMrGQVH'
  // const validator = '1zugcawsx74AgoC4wz2dMEVFVDNo7rVuTRjZMnfNp9T49po' // ZUG CAPITAL/11

  // const val = new Validator(validator, api)
  // const account = await val.getAccount()
  // console.debug('account')
  // console.debug(account.toJSON())

  // const { meta, method, section } = await api.query.system.account // (validator);
  // console.debug(meta.toJSON())

  // // Display some info on a specific entry
  // console.log(`${section}.${method}: ${meta.documentation.join(' ')}`);
  // console.log(`query key: ${api.query.system.account.key(ADDR)}`);

  // // current set of validators (active)
  // const validators = await api.query.session.validators()
  // console.log(validators.toJSON())

  // const acc = new Account(validator, api)
  // let account = await acc.getSystemAccount()
  // console.log(account.toJSON())

  // account = await acc.getBalancesAccount()
  // console.log(account.toJSON())

  // // Retrieve the active era
  // const activeEra = await api.query.staking.activeEra();

  // // retrieve all exposures for the active era
  // const exposures = await api.query.staking.erasStakers.entries(activeEra.index);

  // // exposures.forEach(([key, exposure]) => {
  // for (var idx = 0; idx < exposures.length; idx++) {
  //   console.debug(exposures[idx])
  //   // [key, exposure] = exposures[idx]
  //   // console.log('key arguments:', key.args.map((k) => k.toHuman()));
  //   // console.log('     exposure:', exposure.toHuman());
  // };

  const val = new Validator(validator, api)
  const prefs = await val.getPrefs()
  // const prefs = await api.query.staking.validators(validator);
  console.log(JSON.stringify(prefs.toHuman())); // {"commission":"0"}


  // const intentions = await api.query.staking.intentions();
  // console.log('intentions:', intentions);
  // const stakeIndex = intentions.indexOf(address);
  // console.log('index:', intentions.indexOf(ALICE));

  console.debug('done')

  setTimeout(() => {
    process.exit(0)
  }, 5000)

}

main().catch(err => {
  console.debug(err)
  process.exit(-1)
})
