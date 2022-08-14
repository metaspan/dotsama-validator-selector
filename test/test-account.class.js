
class Account {

  address = null
  api = null
  tags = [] // validator, council, 

  // constructor(stash) {
  //   this.stash = stash
  // }

  constructor (address=undefined, api=undefined) {
    console.debug(`Address constructor(): ${address}`, api?'with api':'no api')
    this.address = address
    this.api = api
  }

  async getHash () {
    return await this.api.query.system.account.hash(this.address)
  }

  // https://polkadot.js.org/docs/api/start/api.query.other/
  /**
   * @warning not tested!
   * @returns 
   */
  async getMeta () {
    // const { meta, method, section } = await this.api.query.system.account(this.address)
    const { meta, method, section } = this.api.query.system.account
    return meta
  }

  async getIdentity () {
    return await this.api.query.identity.identityOf(this.address)
  }

  // STAKING

  // SYSTEM
  /**
   * api.query.balances.account
   * @returns 
   */
  async getSystemAccount () {
    return await this.api.query.system.account(this.address)
  }
  
  // BALANCES
  /**
   * api.query.balances.account
   * @returns 
   */
  async getBalancesAccount () {
    return await this.api.query.balances.account(this.address)
  }
  /**
   * api.query.balances.locks
   * @returns 
   */
  async getLocks () {
    return await this.api.query.balances.locks(this.address)
  }
  /**
   * api.query.balances.reserves
   * @returns 
   */
   async getReserves () {
    return await this.api.query.balances.reserves(this.address)
  }

  /**
   * api.query.elections.voting
   * @returns 
   */
   async getElectionVoting () {
    return await this.api.query.elections.voting(this.address)
  }

  /**
   * api.query.democracy.votingOf
   * @returns 
   */
  async getDemocracyVoting () {
    return await this.api.query.democracy.votingOf(this.address)
  }

  /**
   * api.query.contracts.contractInfoOf
   * @returns 
   */
   async getContractInfo () {
    return await this.api.query.contracts.contractInfoOf(this.address)
  }

  // isValidator () {
  //   return undefined
  // }

}

module.exports = { Account }
