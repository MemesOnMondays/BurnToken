# BurnToken

A ERC20 token with a novel burn mechanism where any user can burn funds and it will be matched by an equal amount of the teams allocation which is partially locked in the contract.

Launching Monday 4th September 2023

https://burntoken.xyz

For updates subscribe to https://memesonmondays.com

Contract sends 99% of tokens to a liquidity pool on Uniswap v3. LP NFT receipt is locked in the contract permanently. Ownership is renounced as part of the addLiquidity() function.

Full unit test suite included which needs a mainnet fork to execute.

```shell
npm install
npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/
npx hardhat test --network local
```
