生成ABI
~~~
cd ./node_modules/@openzeppelin/contracts
solcjs --base-path . -o ../../../config/ABI/ --abi  ./token/ERC20/ERC20.sol
~~~

开启kafka
~~~
bin/zookeeper-server-start.sh config/zookeeper.properties
bin/kafka-server-start.sh config/server.properties
//创建topic 
bin/kafka-topics.sh --create --topic filter --bootstrap-server localhost:9092
//查询topic
bin/kafka-topics.sh --describe --topic filter --bootstrap-server localhost:9092
//生产
 bin/kafka-console-producer.sh --topic filter --bootstrap-server localhost:9092
//消费
bin/kafka-console-consumer.sh --topic filter --from-beginning --bootstrap-server localhost:9092
~~~