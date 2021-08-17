// In Node.js
const Web3 = require('web3');

let web3 = new Web3('wss://mainnet.infura.io/ws/v3/ae772e26d84442f6b9c781d39e7c58a0');
console.log(web3);
web3.eth.getAccounts().then(console.log);

global.config = require('./config/index')()

let address="0x47140a767a861f7a1f3b0dd22a2f463421c28814"//'0x77fba179c79de5b7653f68b5039af940ada60ce0'
let from ='0x0dd6a8de365b2800f828e95feef637027cebfdc6'
let contract=new web3.eth.Contract(config.chain.ethereum.abis['ERC20'], address)
contract.methods.balanceOf(address).call({},(error,result)=>{
    console.log(address,error,from,result)
})

return 

var subscription = web3.eth.subscribe('logs', {
    topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
}, function(error, result){
    
        console.log(error,result);

        
        console.log('address=',result.address)
        console.log('from=',web3.eth.abi.decodeParameter('address',result.topics[1]))
        console.log('to=',web3.eth.abi.decodeParameter('address',result.topics[2]))
        console.log('value=',web3.eth.abi.decodeParameter('uint256',result.data))
});