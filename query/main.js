global.config = require('../config/index')()
global.logger = require('../lib/log').logger

const Ethereum=require('./ethereum');

(async () => {

    let e=new Ethereum()
    let addr='0x8c766a2d8aefcf133696ba6089cfdd61582ea4ae'
    let wallet=await e.wallet(addr)
    let defi=await e.defi(addr)
    console.log(JSON.stringify( wallet))
    console.log(JSON.stringify( defi))
})()