const redis = require('../../lib/redis')
const Web3 = require('web3');
const Web3WsProvider = require('web3-providers-ws')
const fs = require('fs')
const BN = require('bignumber.js');
BN.config({ DECIMAL_PLACES: 6 })

/**
 *  更新Balancer V2的资产
 */

const {
    logger
} = require("../../lib/log");
const KEY = require('../../lib/key');

class BalancerV2 {
    constructor() {
        this.name = 'BalancerV2'
        this.web3 = new Web3(new Web3WsProvider(config.chain.ethereum.ws[0], config.chain.ethereum.websocketOptions));
        this.pools = {}
        let balancerpools = JSON.parse(fs.readFileSync(__dirname + '/../../config/tokenlist/BalancerV2.json'))
        //构建池子的合约
        for (let i = 0; i < balancerpools.data.balancers[0].pools.length; i++) {
            let pool = balancerpools.data.balancers[0].pools[i]
            let id = pool.id
            let totalWeight = pool.totalWeight
            pool.symbol = 'B'
            //按照权重比例生成名称
            for (let j = 0; j < pool.tokens.length; j++) {
                let token = pool.tokens[j]
                let per = token.weight ? (Math.floor(token.weight * 100 / totalWeight)) : ''
                pool.symbol += '-' + per + token.symbol
            }
            pool.address = pool.address.toLowerCase()
            pool.contract = new this.web3.eth.Contract(config.chain.ethereum.abis['ERC20'], pool.address)
            this.pools[pool.address] = pool
            //console.log(id, pool.symbol)
        }

        //Value合约
        this.addressValue = '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
        this.Value = new this.web3.eth.Contract(config.chain.ethereum.abis['BalancerV2Value'], this.addressValue)
    }

    async update(address, pool) {
        if (!this.pools[pool])
            return
        try {
            let balance = await this.pools[pool].methods.balanceOf(address).call()
            await redis.hset(KEY.ETHEREUM_BALANCEV2_BALANCER(address), pool, balance) // address=>{contract=>value;}
            console.log('Set BalancerV2 ', pool, address, balance)
        } catch (e) {
            console.log("Error", pool, address, e)
        }
    }
    
}

module.exports = BalancerV2
