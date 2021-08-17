const path = require('path')
const extend = require('extend')
const fs = require('fs')

module.exports = function config() {
    const env = process.env.NODE_ENV || 'dev'
    console.log('Current NODE_ENV', env)
    const config = {}

    const envPath = path.resolve(__dirname + `/env/${env}.env.js`)
    try {
        extend(config, require(envPath))
    } catch (err) {
        throw JSON.stringify({ text: `Load ${env} Config Error：${envPath}` })
    }

    if (config.chain) {
        for (chain in config.chain) {
            try {
                for (name in config.chain[chain].abis) {
                    try {
                        let abi = JSON.parse(fs.readFileSync(__dirname + '/abi/' + name + '.abi'))
                        config.chain[chain].abis[name] = abi
                    } catch (err) {
                        console.log('Load Extend Config Error：' + __dirname + '/abi/' + name + '.abi')
                    }

                }

            } catch (err) {
                console.log('Load Extend Config Error：' + __dirname + '/' + chain + ' abi')
            }
        }
    }

    config.chain['ethereum'].tokenlist = JSON.parse(fs.readFileSync(__dirname + '/tokenlist/coingecko.json'))
   /** *特殊处理 ETH
    config.chain['ethereum'].tokenlist.tokens.push({ "chainId": 1, "address": "0x00000000000000000000000000000000", "name": "Ethereum", "symbol": "ETH", "decimals": 18, "logoURI": "" })
    //todo  过滤价格为0的 不热门的
    **/
    console.log(config)
    return config
}
