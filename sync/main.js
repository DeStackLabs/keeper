global.config = require('../config/index')()
global.logger = require('../lib/log').logger

const Ethereum=require('./ethereum');

(async () => {

    let e=new Ethereum()
    let addr='0x0dd6a8de365b2800f828e95feef637027cebfdc6'
    await e.eth(addr)
    await e.erc20(addr)
})()