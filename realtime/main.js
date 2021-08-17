global.config = require('../config/index')()
global.logger = require('../lib/log').logger

const kafka = require('kafka-node');
const Offset = kafka.Offset;
const client = new kafka.KafkaClient({ kafkaHost: config.kafka.kafkaHost });
const offset = new Offset(client);

let option = {
    kafkaHost: config.kafka.kafkaHost,
    //groupId: config.kafka.consumerGroup,
    sessionTimeout: 15000,
    protocol: ['roundrobin'],
    fromOffset: 'latest',
    autoCommit: true,
    autoCommitIntervalMs: 1000
};
const consumer = new kafka.ConsumerGroup(option, config.kafka.topic)

console.log('consumer start');

consumer.on('error', function (error) {
    logger.error('error', error)
    //todo 处理异常
});
consumer.on('offsetOutOfRange', function (topic) {
    logger.error('offsetOutOfRange', topic)
    offset.fetch([topic], function (err, offsets) {
        let min = Math.min.apply(null, offsets[topic.topic][topic.partition])
        consumer.setOffset(topic.topic, topic.partition, min)
        logger.info('setOffset', topic.topic, topic.partition, min)
    })
});

//实时更新
let updater = []
consumer.on('message', async (message) => {
    try {
        let key = message.key
        let value = JSON.parse(message.value)

        if (updater[key]) {
            await updater[key].real(value)
        }
        else {
            try {
                let U = require('./' + key + '.js');
                let u = new U()
                updater[key] = u
                await u.real(value) 

            } catch (e) {
                logger.error('updater  error', key, e, message)
            }
        }
    } catch (e) {
        logger.error('consumer message error', e, message)
    }

});