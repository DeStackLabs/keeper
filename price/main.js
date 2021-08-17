/**
 * 更新价格缓存
 */
global.config = require('../config/index')()
global.logger = require('../lib/log').logger
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();


(async () => {
    let ping = await CoinGeckoClient.ping()
    console.log(ping);

    let name2id = {}
    let list = await CoinGeckoClient.coins.list()
   
        if (list.success) {
            for (let i = 0; i < list.data.length; i++) {
               name2id[list.data[i].name] = list.data[i].id
            }
        }
   
    for (chain in config.chain) {
        let P = require('./' + chain + '.js');
        let p = new P(config.chain[chain], name2id)
        p.start()
    }

})()
