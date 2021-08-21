require("chai")
  .use(require("bn-chai")(web3.utils.BN))
  .use(require("chai-as-promised"))
  .should();

const Refund = artifacts.require("Refund");
const ERC20 = artifacts.require("ERC20Mock");

contract("Refund", (accounts) => {
  let contract, stakingToken, token0, token1, owner, claimer;

  before(async () => {
    owner = accounts[0];
    claimer = accounts[1];

    stakingToken = await ERC20.new();
    token0 = await ERC20.new();
    token1 = await ERC20.new();
    contract = await Refund.new(stakingToken.address, [
      token0.address,
      token1.address,
    ]);
    await stakingToken.transfer(claimer, 100); // 10% of supply
    await token0.transfer(contract.address, 100);
    await token1.transfer(contract.address, 100);
  });

  describe("#claim", () => {
    it("should work", async () => {
      const token0BalanceBefore = await token0.balanceOf(claimer);
      const token1BalanceBefore = await token1.balanceOf(claimer);
      await contract.claim({ from: claimer });
      const token0BalanceAfter = await token0.balanceOf(claimer);
      const token1BalanceAfter = await token1.balanceOf(claimer);

      token0BalanceAfter.sub(token0BalanceBefore).should.eq.BN(10); // 10% of supply
      token1BalanceAfter.sub(token1BalanceBefore).should.eq.BN(10); // 10% of supply
    });

    it("should disallow double claim", async () => {
      await contract
        .claim({ from: claimer })
        .should.be.rejectedWith("Caller has already claimed");
    });
  });

  describe("#rescueTokens", () => {
    it("should claim any remaining tokens", async () => {
      const token0BalanceBefore = await token0.balanceOf(owner);
      const token1BalanceBefore = await token1.balanceOf(owner);
      await contract.rescueTokens();
      const token0BalanceAfter = await token0.balanceOf(owner);
      const token1BalanceAfter = await token1.balanceOf(owner);
      token0BalanceAfter.sub(token0BalanceBefore).should.eq.BN(90); // 90% of supply
      token1BalanceAfter.sub(token1BalanceBefore).should.eq.BN(90); // 90% of supply
    });
  });
});
