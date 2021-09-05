// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Refund is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  uint256 public immutable MAX_TOKENS = 2;
  mapping(address => bool) public claimed;
  IERC20 public stakingToken;
  IERC20 public refundToken;
  uint256 public totalClaimed;

  event Claimed(address claimer, uint256 amount);
  event Rescued(address token, uint256 amount);

  constructor(IERC20 _stakingToken, IERC20 _refundToken) {
    stakingToken = _stakingToken;
    refundToken = _refundToken;
  }

  function claim() external {
    require(!claimed[msg.sender], "Caller has already claimed");
    uint256 refund = refundToken.balanceOf(address(this)).add(totalClaimed).mul(stakingToken.balanceOf(msg.sender)).div(stakingToken.totalSupply());
    refundToken.safeTransfer(msg.sender, refund);
    emit Claimed(msg.sender, refund);
    totalClaimed += refund;
    claimed[msg.sender] = true;
  }

  function rescueTokens(IERC20 token) onlyOwner external {
    uint256 balance = token.balanceOf(address(this));
    token.safeTransfer(msg.sender, balance);
    emit Rescued(address(token), balance);
  }
}
