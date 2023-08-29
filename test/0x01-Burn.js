const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const IERC20 = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";

/*
  Note requires a mainnet fork to interact with Uniswap
  npx hardhat node --fork https://eth-mainnet.alchemyapi.io/v2/YOURAPIKEY
*/

describe("Burn", function () {
  let token,pool,owner,user1,oneETH;
  
  it("Deployment", async function () {
    [owner,user1] = await ethers.getSigners();
    oneETH = ethers.utils.parseEther('1');
    const Token = await hre.ethers.getContractFactory("Burn");
    token = await Token.deploy();
    await token.deployed();
    expect(await token.name()).to.eq('BURN🔥');
  });

  it("Add Liquidity", async function () {
    await token.addLiquidity();
    const balance = await token.balanceOf(token.address);
    //expect(balance).to.lt(10000);
  });

  it("Revert On Second addLiquidity", async function () {
    await expect(token.addLiquidity()).to.be.reverted;
  });

  it("Team Balance", async function () {
    const balance = await token.balanceOf(owner.address);
    const expected = ethers.utils.parseEther('5000000');
    expect(balance).to.eq(expected);
  });

  it("Check Liquidity Pool", async function () {
    const poolAddress = await token.pool();
    const poolAbi = ["function fee() external view returns (uint24)","function swap(address,bool,int256,uint160,bytes) external returns (int256, int256)"];
    pool = await hre.ethers.getContractAt(poolAbi, poolAddress);
    const fee = await pool.fee();
    expect(fee).to.eq(3000);
  });

  it("Make Swap WETH > TOKEN", async function () {
    const wethAbi = [
      "function approve(address, uint256) returns (bool)",
      "function deposit() payable",
    ];
    const routerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const weth = await hre.ethers.getContractAt(wethAbi, wethAddress);
    const value = ethers.utils.parseEther('1');
    await weth.connect(user1).deposit({value});
    await weth.connect(user1).approve(routerAddress, value);
    const routerAbi = ['function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'];
    router = await hre.ethers.getContractAt(routerAbi, routerAddress);
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const tx = await router.connect(user1).exactInputSingle([wethAddress, token.address, 3000, user1.address, deadline, value, 0, 0]);
    await tx.wait();
  });
  
  it("User1 Balance", async function () {
    const value = ethers.utils.parseEther('0.99');
    const balance = await token.balanceOf(user1.address);
    expect(balance).to.gt(value);
  });

  it("Burn function", async function () {
    const balance = await token.balanceOf(user1.address);
    const value = BigInt(balance) / 100n;
    await token.connect(user1).burn(value);
    const balance2 = await token.balanceOf(user1.address);
  });

  it("Make Swap TOKEN > WETH", async function () {
    const routerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const value = await token.balanceOf(user1.address);
    await token.connect(user1).approve(routerAddress, value);
    const routerAbi = ['function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'];
    router = await hre.ethers.getContractAt(routerAbi, routerAddress);
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const tx = await router.connect(user1).exactInputSingle([token.address, wethAddress, 3000, user1.address, deadline, value, 0, 0]);
    await tx.wait();
    const balance2 = await token.balanceOf(user1.address);
    expect(balance2).to.eq(0);
  });

  it("Should fail to withdraw team tokens too soon", async function () {
    await expect(token.connect(owner).withdrawAnythingLeft()).to.be.revertedWith('too soon');
  });

  it("Fast forward 8 days", async function () {
    const deployedTimestamp = await token.deployedTimestamp();
    const time1 = Number(deployedTimestamp) + (8 * 24 * 60 * 60);
    await time.increaseTo(Number(time1));
  });

  it("Should allow team to withdraw locked tokens", async function () {
    await token.connect(owner).withdrawAnythingLeft();
  });
  
/*
  it("Deploy Multiple Times", async function () {
    // This is to check the fixOrdering works depending on deployment address
    for (let i = 0; i < 10; i++) {
      const Token = await hre.ethers.getContractFactory("Burn");
      const token2 = await Token.deploy();
      await token2.deployed();
      await token2.addLiquidity();
      const balance = await token2.balanceOf(token2.address);
      expect(balance).to.lt(10000);
    }
  });
*/
});
