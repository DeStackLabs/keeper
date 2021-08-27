const Web3 = require('web3');
const Web3WsProvider = require('web3-providers-ws')
const fs = require('fs')
const BN = require('bignumber.js');
BN.config({ DECIMAL_PLACES: 6 })

/**
 *  更新Uniswap V2的资产
 */

const {
    logger
} = require("../../lib/log");
const KEY = require('../../lib/key');
const ERC20Token = require('./ERC20Token')

class UniswapV2 {
    constructor() {
        this.name = 'BalancerV2'
        this.web3 = new Web3(new Web3WsProvider(config.chain.ethereum.ws[0], config.chain.ethereum.websocketOptions));

        this.ERC20Token = new ERC20Token()

        this.factoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
        this.FACTORY = new this.web3.eth.Contract(config.chain.ethereum.abis['IUniswapV2Factory'], this.factoryAddress)
        this.pairs = {};
        //构建所有的交易对
        (async () => {
            let allPairsLength = await this.FACTORY.methods.allPairsLength().call({})
            let pairAddress
            let token0Address
            let token1Address
            let token0
            let token1
            let reserves

            for (let i = 0; i < allPairsLength; i++) {
                console.log('pair', i)
                try {
                    pairAddress = await this.FACTORY.methods.allPairs(i).call({})
                    let pair = new this.web3.eth.Contract(config.chain.ethereum.abis['IUniswapV2Pair'], pairAddress)

                    token0Address = await pair.methods.token0().call({})
                    token0Address = token0Address.toLowerCase()
                    token1Address = await pair.methods.token1().call({})
                    token1Address = token1Address.toLowerCase()

                    token0 = await this.ERC20Token.token(token0Address)
                    token1 = await this.ERC20Token.token(token1Address)
                    //reserves = await pair.methods.getReserves().call({})

                    this.pairs[pairAddress] = { pair, token0, token1 }
                } catch (e) {
                    logger.error('UniswapV2 constructor,', e, pairAddress, token0Address, token1Address)
                }

                console.log(pairAddress, token0.address, token0.symbol, token0.decimals, token1.address, token1.symbol, token1.decimals)
            }
        })()


    }

    /**
     * 查询账户在UniswapV2的资产
     * @param  address 
     */
    async assets(address) {
        let data = {}
        data.total = new BN(0)
        data.pools = []
        for (let pair in this.pairs) {
            let total = new BN(0) //该池子下的总价值

            let balancer = await this.pairs[pair].pair.methods.balancerOf(address).call({}) //池子代币个人数量
            balancer = new BN(balancer)

            if (!balancer.isZero() && !balancer.isNaN()) {
                let reserves = await this.pairs[pair].pair.methods.getReserves().call({})
                this.pairs[pair].reserves = reserves //更新交易对信息
                let totalSupply = await this.pairs[pair].pair.methods.totalSupply(address).call({}) //池子代币总量


                let token0Value = await this.tokenValueOfPool(this.paris[pair].token0.address, reserves.reserve0, balancer, totalSupply, this.paris[pair].token0.decimals)
                total = total.plus(token0Value.value)
                let token0 = {
                    address: this.paris[pair].token0.address,
                    symbol: this.paris[pair].token0.symbol,
                    decimals: this.paris[pair].token0.decimals
                }
                token0 = Object.assign(token0, token0Value)

                let token1Value = await this.tokenValueOfPool(this.paris[pair].token1.address, reserves.reserve1, balancer, totalSupply, this.paris[pair].token1.decimals)
                total = total.plus(token1Value.value)
                let token1 = {
                    address: this.paris[pair].token1.address,
                    symbol: this.paris[pair].token1.symbol,
                    decimals: this.paris[pair].token1.decimals
                }
                token1 = Object.assign(token1, token1Value)

                data.total = data.total.plus(total) //累加总额
                data.pools.push({
                    pool, 'token': [
                        {
                            token0,
                            token1
                        }
                    ]
                })
            }
        }

        return data
    }
    async tokenValueOfPool(token, totalBalance/*资产代币总余额*/, tokenBalance/*池子代币个人数量*/, totalSupply/*池子代币总量*/, decimals) {
        let result = { 'balance': 0, 'value': 0, 'totalValue': 0, 'price': 0 }
        let price = await redis.get(KEY.ETHEREUM_PRICE(token))
        if (price) {

            price = JSON.parse(price)
            price = price.usd //资产代币价格
            totalBalance = new BN(totalBalance)
            totalSupply = new BN(totalSupply)
            /**
             * 总资产=资产代币价格*资产代币总余额
             * 池子占比=池子代币个人数量/池子代币总量
             * 个人资产=池子占比*总资产
             */
            let totalValue = totalBalance.multipliedBy(price).dividedBy(Math.pow(10, decimals))
            let balance = totalBalance.multipliedBy(tokenBalance).dividedBy(tokenSupply).dividedBy(Math.pow(10, decimals))
            let value = totalBalance.multipliedBy(price).multipliedBy(tokenBalance).dividedBy(tokenSupply).dividedBy(Math.pow(10, decimals))

            result.balance = balance
            result.value = value
            result.totalValue = totalValue
            result.price = price
        }
        return result
    }
}
module.exports = UniswapV2


