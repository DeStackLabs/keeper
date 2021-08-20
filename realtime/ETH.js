const redis = require('../lib/redis')
const Web3 = require('web3');
const Web3WsProvider = require('web3-providers-ws')
/**
 *  更新ETH 资产
 */

const {
    logger
} = require("../lib/log");
const KEY = require('../lib/key')


class ETH {
    constructor() {
        this.name = 'ETH'
        this.ETH_CONTRACT = config.chain.ethereum.CONTRACT
        this.web3 = new Web3(new Web3WsProvider(config.chain.ethereum.ws[0], config.chain.ethereum.websocketOptions));
    }

    async real(transaction) {
        logger.info('Update ETH start')
        let number = transaction.number
        let transactionIndex = transaction.transactionIndex
        let from = transaction.from
        let to = transaction.to
        console.log(transaction.number, transaction.transactionIndex, from, to)

        if (from) {
            this.updateETH(from)
        }
        if (to) {
            this.updateETH(to)
        }

    }
    async updateETH(address) {
        try {
            let balance = await this.web3.eth.getBalance(address)
            await redis.hset(KEY.ETHEREUM_BALANCE(address), this.ETH_CONTRACT/*特殊代表ETH */, balance)
            console.log('Set ETH ', address, balance)
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = ETH