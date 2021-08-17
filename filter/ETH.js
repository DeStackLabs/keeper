/**
 *  过滤ETH 资产变更交易
 */

const Web3 = require('web3');
const {
    logger
} = require("../lib/log");
const fs = require('fs')
const kafka = require("../lib/kafka")

class ETH {
    constructor(chain, config, channel) {
        this.heightPath=__dirname + '/height/eth'
        this.name = 'ETH'
        this.chain = chain
        this.web3 = new Web3(config.ws[0]);


    }
    //追上最新高度
    async sync() {
        let last = parseInt(fs.readFileSync(this.heightPath))
        while (last <= await this.web3.eth.getBlockNumber()) {
            let block=await  this.web3.eth.getBlock(last, true)
            this.process(block)
          
            last++
        }
    }
    process(block){
        if (!block || !block.transactions ){
            console.log('Filter ETH Process  Error Block ',block)
            return 
        }
        for (let i = 0; i < block.transactions.length; i++) {
            let t = block.transactions[i]
            this.send({ number: block.number, blockHash: block.hash, transactionIndex: t.transactionIndex, from: t.from, to: t.to, value: t.value })
        }
        //todo coinbase
        
        fs.writeFileSync(this.heightPath,block.number.toString()) //写入更新
        console.log('Filter ETH Process  Block',block.number)
    }
    async start() {
        logger.info('Filter ETH start')
        await this.sync()
        this.subscribe = this.web3.eth.subscribe('newBlockHeaders', (error, header) => {
            if (!error) {
                this.web3.eth.getBlock(header.hash, true, (error, block) => {
                    this.process(block)
                })
                //  console.log(error,header)
            } else {
                logger.error(error, header)
            }
            /**
             * todo: exception process
             */

        })
    }

    send(transaction) {
        /**
         * {
                    number: xx,
                    blockHash:xx
                    transactionIndex: 55,
                    from:xxxxx,
                    to:xxxxxxx,
                    value:xxx
                    }
         */
        kafka.send({
            key:'ETH',
            value:transaction
        })
        console.log(transaction)
    }


}

module.exports = ETH