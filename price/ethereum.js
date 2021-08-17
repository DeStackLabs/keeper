const { sleep } = require('../lib/helper/assist')
const CoinGecko = require('coingecko-api')
const CoinGeckoClient = new CoinGecko()
const redis = require('../lib/redis')
const KEY = require('../lib/key')

class Ethereum {
    constructor(config, name2id) {
        this.ETH_CONTRACT=config.CONTRACT
        this.currencies = ['usd']
        this.tokenIds = [] //需要查询的token 的id
        this.id2contract = {}//id=>合约地址
        for (let i = 0; i < config.tokenlist.tokens.length; i++) {
            let name = config.tokenlist.tokens[i].name
            if (name2id[name]) {
                this.tokenIds.push(name2id[name])
                config.tokenlist.tokens[i].id = name2id[name]
                this.id2contract[name2id[name]] = config.tokenlist.tokens[i].address //缓存 id=>合约地址
            }
        }
        this.init()
    }
    async init() {
        //获取Ethereum 价格
        let ethereum = await CoinGeckoClient.simple.price({
            ids: ['ethereum'],
            vs_currencies: this.currencies
        })
        if (ethereum.success) {
            let price = ethereum.data['ethereum']
            await redis.set(KEY.ETHEREUM_PRICE(this.ETH_CONTRACT), JSON.stringify( price)) // contract=>{{ usd: 0.02901058 }}
            console.log('Set ETH Price', this.ETH_CONTRACT, price)
        }
        //console.log(ethereum)
    }
    async start() {
        logger.info('Price Ethereum Start')
        let step = 50

        while (await sleep(30000)) {
            for (let i = 0; i < this.tokenIds.length;) {
                try {
                    let start = i
                    let end = (this.tokenIds.length > (i + step)) ? i + step : this.tokenIds.length
                    let tokens = await CoinGeckoClient.simple.price({
                        ids: this.tokenIds.slice(start, end),
                        vs_currencies: this.currencies
                    })
                    if (tokens.success) {
                        for (let id in tokens.data) {
                            let contract = this.id2contract[id]
                            let price = tokens.data[id]
                            console.log('Set Token Price', id, contract, price)
                            await redis.set(KEY.ETHEREUM_PRICE(contract), JSON.stringify(price)) // contract=>{{ usd: 0.02901058 }}
                        }
                    }

                    i = end
                } catch (e) {
                    console.log('ethereum price ', e)
                }

            }
        }
    }
}

module.exports = Ethereum
