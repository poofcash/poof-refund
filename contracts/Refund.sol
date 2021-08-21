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
  IERC20[] public tokens;

  event Claimed(address claimer, uint256 tokenIdx, uint256 amount);
  event Rescued(address token, uint256 amount);

  constructor(IERC20 _stakingToken, IERC20[] memory _tokens) {
    require(_tokens.length <= 2, "Exceeded max allowed tokens");
    stakingToken = _stakingToken;
    tokens = _tokens;
  }

  function claim() external {
    require(!claimed[msg.sender], "Caller has already claimed");
    for (uint i = 0; i < tokens.length; i++) {
      IERC20 token = tokens[i];
      uint256 refund = token.balanceOf(address(this)).mul(stakingToken.balanceOf(msg.sender)).div(stakingToken.totalSupply());
      token.safeTransfer(msg.sender, refund);
      emit Claimed(msg.sender, i, refund);
    }
    claimed[msg.sender] = true;
  }

  function rescueTokens(IERC20 token) onlyOwner external {
    uint256 balance = token.balanceOf(address(this));
    token.safeTransfer(msg.sender, balance);
    emit Rescued(address(token), balance);
  }
}
