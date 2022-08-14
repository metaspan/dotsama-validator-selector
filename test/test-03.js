
// listen for stakers selected event
// https://polkadot.js.org/docs/substrate/events#staking

const { ApiPromise, WsProvider } = require('@polkadot/api')
const { endpoints } = require('./test-endpoints')

const chain_id = 'kusama'
const endpoint = 'parity';

async function main () {

  const provider = new WsProvider(endpoints[chain_id][endpoint])
  const api = await ApiPromise.create({ provider: provider })

  // const [chain, nodeName, nodeVersion] = await Promise.all([
  //   api.rpc.system.chain(),
  //   api.rpc.system.name(),
  //   api.rpc.system.version()
  // ]);
  // console.log(`connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

  // Subscribe to system events via storage
  api.query.system.events((events) => {
    console.log(`\nReceived ${events.length} events:`);

    // Loop through the Vec<EventRecord>
    events.forEach((record) => {
      console.debug(record.toJSON())
      // Extract the phase, event and the event types
      const { event, phase } = record;
      const types = event.typeDef;
      // console.log('types', types)

      // // Show what we are busy with
      // console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
      // // console.log(`\t\t${event.meta.documentation.toString()}`);

      // // Loop through each of the parameters, displaying the type and data
      // event.data.forEach((data, index) => {
      //   console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
      // });
    });
  });

  // const keys = await api.query.staking.validators.keys()
  // const validators = keys.map(({ args: [validatorId] }) =>
  //   validatorId.toString()
  // )
  // console.debug(validators)
  // process.exit(0)

}

main().catch(err => {
  console.debug(err)
  process.exit(-1)
})
