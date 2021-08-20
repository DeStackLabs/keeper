https://uniswap.org/tokenlist.schema.json
https://tokens.coingecko.com/all.json
https://tokenlists.org/

生成coingecko.json
https://tokens.coingecko.com/all.json

BalancerV2:
https://raw.githubusercontent.com/balancer-labs/balancer-v2-monorepo/master/pkg/deployments/tasks/20210418-vault/output/mainnet.json   =========>生成BalancerV2在主网上的Value合约地址

生成BalancerV2.json:
1. https://thegraph.com/legacy-explorer/subgraph/balancer-labs/balancer-v2?selected=playground
2. 执行查询 {
  {
  balancers{
    id
    poolCount
    pools (first :200){
      address
      id
      symbol
      totalWeight
      tokensList
      tokens {
        symbol
        decimals
        name
        address
        balance
        weight
      }
    }
  }
}

生成BalancerV2的Value的ABI
https://raw.githubusercontent.com/balancer-labs/balancer-v2-monorepo/master/pkg/deployments/tasks/20210418-vault/abi/Vault.json