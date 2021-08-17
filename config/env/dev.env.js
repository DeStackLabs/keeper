process.env.DEBUG = process.env.DEBUG || 'dev-errer:*'

module.exports = {
    name: 'keeper',
    chain: {
        'ethereum': {
            'chainId':1,
            'CONTRACT':'0x00000000000000000000000000000000',
            'ws': ['wss://mainnet.infura.io/ws/v3/861993c46ab2463498f1683b6883eda3'],
            'filters': ['ETH', 'ERC20'],
            'abis': { 'ERC20': '' }
        }
    },
    kafka:{
        'kafkaHost':'127.0.0.1:9092',
        'topic':'filter',
        'consumerGroup': 'updater',
        'sasl': { mechanism: 'plain', username: '***', password: '***' }
    },
    redis: {
        host: '127.0.0.1',
        port: '6379',
        password: '***'
    }
}
