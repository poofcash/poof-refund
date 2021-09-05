require("chai")
  .use(require("bn-chai")(web3.utils.BN))
  .use(require("chai-as-promised"))
  .should();

const Refund = artifacts.require("Refund");
const ERC20 = artifacts.require("ERC20Mock");

contract("Refund", (accounts) => {
  let contract, stakingToken, token0, token1, owner, claimer1;

  before(async () => {
    owner = accounts[0];
    claimer1 = accounts[1];
    claimer2 = accounts[2];

    stakingToken = await ERC20.new();
    token0 = await ERC20.new();
    token1 = await ERC20.new();
    contract = await Refund.new(stakingToken.address, token0.address);
    await stakingToken.transfer(claimer1, 100); // 10% of supply
    await stakingToken.transfer(claimer2, 900); // 90% of supply
    await token0.transfer(contract.address, 100);
    await token1.transfer(contract.address, 100);
  });

  describe("#claim", () => {
    it("should work", async () => {
      // Claimer 1
      let token0BalanceBefore = await token0.balanceOf(claimer1);
      await contract.claim({ from: claimer1 });
      let token0BalanceAfter = await token0.balanceOf(claimer1);

      token0BalanceAfter.sub(token0BalanceBefore).should.eq.BN(10); // 10% of supply

      // Claimer 2
      token0BalanceBefore = await token0.balanceOf(claimer2);
      await contract.claim({ from: claimer2 });
      token0BalanceAfter = await token0.balanceOf(claimer2);

      token0BalanceAfter.sub(token0BalanceBefore).should.eq.BN(90); // 90% of supply
    });

    it("should disallow double claim", async () => {
      await contract
        .claim({ from: claimer1 })
        .should.be.rejectedWith("Caller has already claimed");
    });
  });

  describe("#rescueTokens", () => {
    it("should claim any remaining tokens", async () => {
      const token0BalanceBefore = await token0.balanceOf(owner);
      await contract.rescueTokens(token0.address);
      const token0BalanceAfter = await token0.balanceOf(owner);
      token0BalanceAfter.sub(token0BalanceBefore).should.eq.BN(0); // 0% of supply

      const token1BalanceBefore = await token1.balanceOf(owner);
      await contract.rescueTokens(token1.address);
      const token1BalanceAfter = await token1.balanceOf(owner);
      token1BalanceAfter.sub(token1BalanceBefore).should.eq.BN(100); // 100% of supply
    });
  });
});
