/**
 * Sync All Data Of account/address/ 
 */
const redis = require('../lib/redis')
const KEY = require('../lib/key')
const Eth = require('../realtime/ETH')
const Erc20 = require('../realtime/ERC20')

class Ethereum {
    constructor() {
        this.name = 'Ethereum'
        this.Eth = new Eth()
        this.Erc20 = new Erc20()
        this.contracs = []

        this.ERC20 = {}
        for (let i = 0; i < config.chain.ethereum.tokenlist.tokens.length; i++) {
            this.contracs.push(config.chain.ethereum.tokenlist.tokens[i].address.toLowerCase())
        }
    }

    async eth(address) {
        logger.info('Ethereum  ' + address)
        if (address) {
            await this.Eth.updateETH(address)
        }
    }
    async erc20(address) {
        if (address) {
            await this.contracs.forEach((c) => this.Erc20.updateErc20(address, c))
        }
    }
}

module.exports = Ethereum