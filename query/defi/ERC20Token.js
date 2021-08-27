const Web3 = require('web3');
const Web3WsProvider = require('web3-providers-ws')
const fs = require('fs')
const BN = require('bignumber.js');
BN.config({ DECIMAL_PLACES: 6 })

/**
 *  已知的ERC20 Token
 */

const {
    logger
} = require("../../lib/log");
const KEY = require('../../lib/key');

class ERC20Token {
    constructor() {
        this.name = 'ERC20Token'
        this.web3 = new Web3(new Web3WsProvider(config.chain.ethereum.ws[0], config.chain.ethereum.websocketOptions));

        this.ERC20 = {}
        let length=config.chain.ethereum.tokenlist.tokens.length
        for (let i = 0; i <length ; i++) {
            let address = config.chain.ethereum.tokenlist.tokens[i].address.toLowerCase()
            let token=Object.assign({}, config.chain.ethereum.tokenlist.tokens[i])
            token.contract = new this.web3.eth.Contract(config.chain.ethereum.abis['ERC20'], address)
            this.ERC20[address] = token
        }
        console.log('Finish ERC20Token Build ',length)
    }

    /**
     * 查询Token
     * @param  address 
     */
    async token(address) {
        if (!this.ERC20[address]) {
            let contract = new this.web3.eth.Contract(config.chain.ethereum.abis['ERC20'], address)
            let symbol = await contract.methods.symbol().call({})
            let decimals = await contract.methods.decimals().call({})
            let name = await contract.methods.name().call({})
            let token = { "chainId": 1, "address": address, "name": name, "symbol": symbol, "decimals": decimals, "logoURI": "" }
            //更新配置文件
            config.chain.ethereum.tokenlist.tokens.push(token)
            await this.writeTokenlist()

            let t=Object.assign({},token,{contract})
            this.ERC20[address] = t
        }
        
        return this.ERC20[address]
    }
    /**
     * 为了加快初始化速度
     * 更新tokenlist文件
     */
    async writeTokenlist() {
        
        fs.writeFileSync(__dirname + '/../../config/tokenlist/coingecko.json', JSON.stringify(config.chain.ethereum.tokenlist))
    }
}

module.exports = ERC20Token


