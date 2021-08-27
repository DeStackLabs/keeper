const redis = require('../lib/redis')
const KEY = require('../lib/key')
const Eth = require('../realtime/ETH')
const Erc20 = require('../realtime/ERC20')
const BN = require('bignumber.js');
BN.config({ DECIMAL_PLACES: 6 })

class Ethereum {
    constructor() {
        this.ETH_CONTRACT = config.chain.ethereum.CONTRACT
        this.contracts = {}
        for (let i = 0; i < config.chain.ethereum.tokenlist.tokens.length; i++) {
            this.contracts[config.chain.ethereum.tokenlist.tokens[i].address.toLowerCase()] = config.chain.ethereum.tokenlist.tokens[i]
        }
        this.contracts[this.ETH_CONTRACT] = { "chainId": 1, "address": this.ETH_CONTRACT, "name": "Ethereum", "symbol": "ETH", "decimals": 18, "logoURI": "" }

        //加载defi处理器
        this.defis = {}
        for (let i = 0; i < config.chain.ethereum.defi.length; i++) {
            let defi = config.chain.ethereum.defi[i]
            let D = require('./defi/' + defi + '.js');
            let d = new D()
            this.defis[d.name] = d
        }
    }
    async wallet(address) {
        let wallet = {}
        wallet['totalValue'] = new BN(0)

        let balances = await redis.hgetall(KEY.ETHEREUM_BALANCE(address))
        for (let contract in balances) {
            // console.log(contract, balances[contract])
            let balance
            let price
            try {
                balance = new BN(balances[contract])
                price = await redis.get(KEY.ETHEREUM_PRICE(contract))
                price = JSON.parse(price)
                if (!balance.isZero() && !balance.isNaN()/*&& price && price.usd*/) {
                    if (this.contracts[contract]) {
                        let symbol = this.contracts[contract].symbol
                        let name = this.contracts[contract].name
                        let decimals = this.contracts[contract].decimals

                        price = price.usd
                        let value = balance.multipliedBy(price)
                        value = value.dividedBy(Math.pow(10, decimals))
                        balance = balance.dividedBy(Math.pow(10, decimals))

                        wallet['totalValue'] = wallet['totalValue'].plus(value)
                        wallet[symbol] = {
                            contract: contract,
                            symbol: symbol,
                            name: name,
                            decimals: decimals,
                            price: price,
                            balance: balance.toString(),
                            value: value.toString()
                        }

                        console.log(contract, address, symbol, name, decimals, price.toString(), balance.toString(), 'value=', value.toString())
                    }
                }
            } catch (e) {
                console.log('Wallet Parse Error', e, address, balance, price)
            }
        }
        wallet['totalValue'] = wallet['totalValue'].toString()
        return wallet
    }
    async defi(address) {
        let data = {}
        for (let d in this.defis) {
            data[d] = await this.defis[d].assets(address)
        }

        return data
    }
}


module.exports = Ethereum