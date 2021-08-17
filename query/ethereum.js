const redis = require('../lib/redis')
const KEY = require('../lib/key')
const Eth = require('../realtime/ETH')
const Erc20 = require('../realtime/ERC20')
const BN = require('bn.js');

class Ethereum {
    constructor() {
        this.ETH_CONTRACT=config.chain.ethereum.CONTRACT
        this.contracts = {}
        for (let i = 0; i < config.chain.ethereum.tokenlist.tokens.length; i++) {
            this.contracts[config.chain.ethereum.tokenlist.tokens[i].address.toLowerCase()] = config.chain.ethereum.tokenlist.tokens[i]
        }
        this.contracts[this.ETH_CONTRACT]={ "chainId": 1, "address": this.ETH_CONTRACT, "name": "Ethereum", "symbol": "ETH", "decimals": 18, "logoURI": "" }
    }
    async wallet(address) {
        let wallet = {}
        wallet['totalValue']=new BN(0)

        let balances = await redis.hgetall(KEY.ETHEREUM_BALANCE(address))
        for (let contract in balances) {
           // console.log(contract, balances[contract])
            let balance
            let price
            try {
                balance = new BN(balances[contract])
                price = await redis.get(KEY.ETHEREUM_PRICE(contract))
                price = JSON.parse(price)
                if (!balance.isZero() /*&& price && price.usd*/) {
                    if (this.contracts[contract] ) {
                        let symbol = this.contracts[contract].symbol
                        let name = this.contracts[contract].name
                        let decimals = this.contracts[contract].decimals

                        let pricePrecision=1000000
                        let oldPrice=price.usd
                        let newPrice=new BN(oldPrice*pricePrecision) //避免丢失精度
                        let value=balance.mul(newPrice)

                        let base=new BN(10)
                        value=value.div(base.pow(new BN(decimals)))
                        value=value.div(new BN(pricePrecision))

                        wallet['totalValue']=wallet['totalValue'].add(value)
                        wallet[symbol]={
                            contract:contract,
                            symbol:symbol,
                            name:name,
                            decimals:decimals,
                            price:oldPrice,
                            balance:balance.toString(),
                            value:value.toString()
                        }
                        console.log(contract, address, symbol, name, decimals, oldPrice,newPrice.toString(), balance.toString(),'value=',value.toString())
                    }

                }
            } catch (e) {
                //console.log('Wallet Parse Error', e, address, balance, price)
            }


        }
        wallet['totalValue']=wallet['totalValue'].toString()
        return wallet
    }
}


module.exports = Ethereum