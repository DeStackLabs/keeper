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
        this.abiValue = JSON.parse(fs.readFileSync(__dirname + '/../../config/abi/BalancerV2_Value.abi'))
        this.addressValue = (JSON.parse(fs.readFileSync(__dirname + '/../../config/tokenlist/BalancerV2_Value.json'))).Vault
        this.Value = new this.web3.eth.Contract(this.abiValue, this.addressValue)

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
    /**
     * 查询账户在BalancerV2的资产
     * @param  address 
     */
    async assets(address) {
        let BalancerV2 = {}
        BalancerV2.total = new BN(0)
        BalancerV2.pools = []
        try {
            for (let pool in this.pools) {
                let poolId = this.pools[pool].id
                let contract = this.pools[pool].contract //合约对象
                let tokenBalance = await contract.methods.balanceOf(address).call() //池子代币个人数量
                //池子代币个人数量不为0 才处理
                tokenBalance = new BN(tokenBalance)
                if (!tokenBalance.isZero() && !tokenBalance.isNaN()) {
                    let tokens = [] //该池子下的token信息
                    let total = new BN(0) //该池子下的总价值
                    let tokenSupply = await contract.methods.totalSupply().call() //池子代币总量
                    let pooltokens = await this.Value.methods.getPoolTokens(poolId).call()
                    for (let i = 0; (i < pooltokens.tokens.length) && (i < this.pools[pool].tokens.length) && (i < pooltokens.balances.length); i++) {
                        let token = pooltokens.tokens[i].toLowerCase()
                        //找到资产代币价格和符号/小数点
                        let symbol = this.pools[pool].tokens[i].symbol
                        let decimals = this.pools[pool].tokens[i].decimals
                        let price = await redis.get(KEY.ETHEREUM_PRICE(token))
                        if (!price)
                            break

                        price = JSON.parse(price)
                        price = price.usd //资产代币价格
                        let totalBalance = pooltokens.balances[i] //资产代币总余额
                        totalBalance = new BN(totalBalance)
                        /**
                         * 总资产=资产代币价格*资产代币总余额
                         * 池子占比=池子代币个人数量/池子代币总量
                         * 个人资产=池子占比*总资产
                         */
                        let totalValue = totalBalance.multipliedBy(price).dividedBy(Math.pow(10, decimals))
                        let balance = totalBalance.multipliedBy(tokenBalance).dividedBy(tokenSupply).dividedBy(Math.pow(10, decimals))
                        let value = totalBalance.multipliedBy(price).multipliedBy(tokenBalance).dividedBy(tokenSupply).dividedBy(Math.pow(10, decimals))

                        total = total.plus(value)
                        tokens.push({
                            token, symbol, decimals, price, 'weight': this.pools[pool].tokens[i].weight, 'totalBalance': totalBalance.toString(),
                            'totalValue': totalValue.toString(),
                            'balance': balance.toString(),
                            'value': value.toString()
                        })

                        //console.log(token, symbol, price, totalBalance.toString(), totalValue.toString(), balance.toString(), value.toString())
                    }
                    BalancerV2.total = BalancerV2.total.plus(total) //累加总额
                    BalancerV2.pools.push({
                        poolId, pool, tokens, 'totalWeight': this.pools[pool].totalWeight
                    })
                }
            }
        } catch (e) {
            console.log('BalancerV2 assets', e)
        }
        return BalancerV2
    }
}

module.exports = BalancerV2

/**
    let address='0x8c766a2d8aefcf133696ba6089cfdd61582ea4ae'

    let B=new BalancerV2()
    B.assets(address).then((a)=>{
        console.log(JSON.stringify(a))
    })
 */