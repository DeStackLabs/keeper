
global.config = require('../config/index')()
global.logger = require('../lib/log').logger

let filters = []
let chainnel
for (chain in config.chain) {
    for (var i = 0; i < config.chain[chain].filters.length; i++) {
        let F = require('./' + config.chain[chain].filters[i] + '.js');
        let f = new F(chain, config.chain[chain], chainnel)
        f.start()
        filters.push(f)
    }
}

