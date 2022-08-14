export const endpoints = {
  polkadot: {
    parity: 'wss://rpc.polkadot.io',
    onFinality: 'wss://polkadot.api.onfinality.io/public-ws',
    dwellir: 'wss://polkadot-rpc.dwellir.com',
    local: 'ws://192.168.1.92:30225'
  },
  kusama: {
    // local: 'wss://192.168.1.85:30225',
    // local: 'http://192.168.1.85:40224',
    onFinality: 'wss://kusama.api.onfinality.io/public-ws',
    parity: 'wss://kusama-rpc.polkadot.io',
    dwellir: 'wss://kusama-rpc.dwellir.com',
    local: 'ws://192.168.1.85:40225'
  },
  // parallel: {
  //   onFinality: 'wss://parallel.api.onfinality.io/public-ws'
  // }
}

// module.exports = { endpoints }
