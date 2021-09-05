const Refund = artifacts.require("Refund");

module.exports = function (deployer) {
  deployer.deploy(
    Refund,
    "0x969D7653ddBAbb42589d73EfBC2051432332A940", // DualStakingRewards
    "0x573bcebd09ff805ed32df2cb1a968418dc74dcf7" // POOF-UBE LP
  );
};
