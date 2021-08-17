const redis = require('../lib/redis')
const Web3 = require('web3');
/**
 *  更新ERC20 资产
 */

const {
    logger
} = require("../lib/log");
const KEY = require('../lib/key')


class Erc20 {
    constructor() {
        this.name = 'Erc20'
        this.web3 = new Web3(config.chain.ethereum.ws[0]);
        this.ERC20 = {}
        for (let i = 0; i < config.chain.ethereum.tokenlist.tokens.length; i++) {
            let contract = config.chain.ethereum.tokenlist.tokens[i].address.toLowerCase()
            this.ERC20[contract] = new this.web3.eth.Contract(config.chain.ethereum.abis['ERC20'], contract)
        }
    }

    async real(transfer) {
        logger.info('Updater ERC20 start')
        let blockNumber = transfer.blockNumber
        let transactionIndex = transfer.transactionIndex
        let contract = transfer.address.toLowerCase() // ERC20 合约地址
        if (!this.ERC20[contract]) {
            logger.info("Updater ERC20 Don't Have This Token", contract)
            return
        }
        console.log('set ERC20 ', blockNumber, transactionIndex, contract)

        let from = transfer.from
        let to = transfer.to

        if (from) {
            this.updateErc20(from, contract)
        }
        if (to) {
            this.updateErc20(to, contract)
        }

    }
    async updateErc20(address, contract) {
        try {
            let balance = await this.ERC20[contract].methods.balanceOf(address).call()
            await redis.hset(KEY.ETHEREUM_BALANCE(address), contract, balance) // address=>{contract=>value;}
            console.log('Set ERC20 ', contract, address, balance)
        } catch (e) {
            console.log("Error", contract, address, e)
        }
    }
}

module.exports = Erc20