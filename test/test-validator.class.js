const { Account } = require('./test-account.class')

class Validator extends Account {
  stash = null
  api = null
  maxNominators = 256
  nominators = []

  // constructor(stash) {
  //   this.stash = stash
  // }

  constructor (stash=undefined, api=undefined) {
    console.debug('Validator constructor():', stash, api?'with api':'no api')
    super(stash, api)
    this.address = stash
    this.stash = stash
    this.api = api
  }

  async getAccount () {
    return await this.api.query.system.account(this.stash)
  }

  /**
   * api.query.staking.validators
   * @returns 
   */
  async getPrefs () {
    return await this.api.query.staking.validators(this.address)
    // console.log(JSON.stringify(prefs.toHuman())); // {"commission":"0"}
  }

  async getNominatorStaking (api, apiChunkSize = 64, validator) {

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

  async getNominators(api, batchSize=256) {
    const nss = await this.getNominatorStaking(api, batchSize)
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

module.exports = { Validator } 