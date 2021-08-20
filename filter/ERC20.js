/**
 *  过滤ERC20 资产转账 事件
 *  TODO:追赶块高问题
 */
const Web3 = require('web3');
const Web3WsProvider = require('web3-providers-ws')
const {
    logger
} = require("../lib/log");
const fs = require('fs')
const kafka = require("../lib/kafka")

class ERC20 {
    constructor(chain, config, channel) {
        this.heightPath = __dirname + '/height/erc20'
        this.name = 'ERC20'
        this.chain = chain
        this.web3 = new Web3(new Web3WsProvider(config.ws[0], config.websocketOptions));
        this.addresses = [] //关注的token地址
        for (let i = 0; i < config.tokenlist.tokens.length; i++) {
            this.addresses.push(config.tokenlist.tokens[i].address)
        }

        /**
        *   0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef=keccak(Transfer(address,address,uint256)) 
        */
        this.options = {
            address: this.addresses,
            topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
        }
    }

    //追上最新高度
    async sync() {
        let last = parseInt(fs.readFileSync(this.heightPath))
        while (last <= await this.web3.eth.getBlockNumber()) {
            //let block = await this.web3.eth.getBlock(last, true)
            try {
                let events = await this.web3.eth.getPastLogs({ fromBlock: last, toBlock: last, address: this.options.address, topics: this.options.topics })
                for (let i = 0; i < events.length; i++)
                    this.process(events[i])

                last++
            } catch (e) {
                console.log('sync error', e)
            }

        }
    }
    process(event) {
        event.from = this.web3.eth.abi.decodeParameter('address', event.topics[1])
        event.to = this.web3.eth.abi.decodeParameter('address', event.topics[2])
        event.value = this.web3.eth.abi.decodeParameter('uint256', event.data)
        this.send(event)

        fs.writeFileSync(this.heightPath, event.blockNumber.toString()) //写入更新
        console.log('Filter ERC20 Process Event', event.blockNumber.toString(), event.logIndex.toString())
    }


    async start() {
        logger.info('Filter ERC20 Start')
        await this.sync()
        /**
         * todo:removed 字段的作用?
         */
        this.subscribe = this.web3.eth.subscribe('logs', this.options, (error, event) => {
            if (!error) {
                this.process(event)
            } else {
                logger.error(error, event)
            }
            /**
             * todo: exception process
             */

        })
    }


    send(transfer) {
        /**
         * {
                    removed: false,
                    logIndex: 108,
                    transactionIndex: 55,
                    transactionHash: '0x7737e5c5673a27e1ad6a654cbd5f3ad1f6e3133807ddf607f9a9d35538eb21b2',
                    blockHash: '0xb272921a61a14efdfacb9765dd2de7f167569d689027428843aa692fbaa3b6ab',
                    blockNumber: 12957318,
                    address: '0xdA86006036540822e0cd2861dBd2fD7FF9CAA0e8',
                    data: '0x00000000000000000000000000000000000000000000000000b1da74509054d6',
                    topics: [
                        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                        '0x0000000000000000000000002f727b3e54ede32a80341bd06eb7966d43a12b3e',
                        '0x000000000000000000000000e0fc63c39fab8d774ca1568e6d0679936c17b9ba'
                    ],
                    id: 'log_cb0f848e',
                    from:xxxxx,
                    to:xxxxxxx,
                    value:xxxx
                    }
         */
        kafka.send({
            key: 'ERC20',
            value: transfer
        })
        //console.log(transfer)
    }
}

module.exports = ERC20