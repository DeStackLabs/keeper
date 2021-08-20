const redis = require('../lib/redis')
const Web3 = require('web3');
const Web3WsProvider = require('web3-providers-ws')
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
        this.web3 = new Web3(new Web3WsProvider(config.chain.ethereum.ws[0], config.chain.ethereum.websocketOptions));
        this.ERC20 = {}
        for (let i = 0; i < config.chain.ethereum.tokenlist.tokens.length; i++) {
            let contract = config.chain.ethereum.tokenlist.tokens[i].address.toLowerCase()
            this.ERC20[contract] = new this.web3.eth.Contract(config.chain.ethereum.abis['ERC20'], contract)
        }

        //加载defi处理器
        this.defi = []
        for (let i = 0; i < config.chain.ethereum.defi.length; i++) {
            let defi = config.chain.ethereum.defi[i]
            let D = require('./defi/' + defi + '.js');
            let d = new D()
            this.defi.push(d)
        }
    }

    async real(transfer) {
        logger.info('Updater ERC20 start')
        let blockNumber = transfer.blockNumber
        let transactionIndex = transfer.transactionIndex
        let contract = transfer.address.toLowerCase() // ERC20 合约地址
        let from = transfer.from
        let to = transfer.to
        //转给DEFI 处理
        this.defi.forEach((d) => {
            d.update(from, contract)
            d.update(to, contract)
        }
        )

        if (!this.ERC20[contract]) {
            logger.info("Updater ERC20 Tokenlist Don't Have This Token", contract)
            return
        }
        console.log('set ERC20 ', blockNumber, transactionIndex, contract)

        this.updateErc20(from, contract)
        this.updateErc20(to, contract)
    }
    async updateErc20(address, contract) {
        if (!address || !contract)
            return

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