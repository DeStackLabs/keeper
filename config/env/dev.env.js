process.env.DEBUG = process.env.DEBUG || 'dev-errer:*'

module.exports = {
    name: 'keeper',
    chain: {
        'ethereum': {
            'chainId': 1,
            'CONTRACT': '0x00000000000000000000000000000000',
            'ws': ['ws://47.119.181.27:9546', 'wss://mainnet.infura.io/ws/v3/861993c46ab2463498f1683b6883eda3'],
            'filters': ['ETH', 'ERC20'],
            'abis': { 'ERC20': '' },
            'defi':['BalancerV2'],
            'websocketOptions': {
                timeout: 5000,
                clientConfig: {
                    keepalive: true,
                    keepaliveInterval: 60000
                },
                reconnect: {
                    auto: true,
                    delay: 5000,
                    maxAttempts: 100,
                    onTimeout: false
                }
            }
        }
    },
    kafka: {
        'kafkaHost': '127.0.0.1:9092',
        'topic': 'filter',
        'consumerGroup': 'updater',
        'sasl': { mechanism: 'plain', username: '***', password: '***' }
    },
    redis: {
        host: '127.0.0.1',
        port: '6379',
        password: '***'
    }
}
