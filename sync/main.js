global.config = require('../config/index')()
global.logger = require('../lib/log').logger

const Ethereum=require('./ethereum');

(async () => {

    let e=new Ethereum()
    let addr='0x8c766a2d8aefcf133696ba6089cfdd61582ea4ae'
    await e.eth(addr)
    await e.erc20(addr)
})()