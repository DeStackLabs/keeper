const { logger } = require('./log')
var Redis = require('ioredis')

client = new Redis({
    port: config.redis.port,
    host: config.redis.host,
    password: config.redis.password
})
client.on("error", function (error) {
    logger.error('Redis error', error)
})

module.exports = client