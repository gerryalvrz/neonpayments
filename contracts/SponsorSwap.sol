// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
  function balanceOf(address) external view returns (uint256);
  function decimals() external view returns (uint8);
  function symbol() external view returns (string memory);
  function transfer(address,uint256) external returns (bool);
  function transferFrom(address,address,uint256) external returns (bool);
  function approve(address,uint256) external returns (bool);
}

interface IEIP3009 {
  function transferWithAuthorization(
    address from,
    address to,
    uint256 value,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
}

interface IEIP2612 {
  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external;
}

interface IUniswapV2Router02 {
  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts);

  function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts);
}

contract SponsorSwap {
  address public immutable router;
  address public immutable usdc;

  event Swapped(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

  constructor(address _router, address _usdc) {
    router = _router;
    usdc = _usdc;
  }

  function _approveMax(address token, address spender, uint256 amount) internal {
    IERC20(token).approve(spender, 0);
    IERC20(token).approve(spender, amount);
  }

  function swapWithAuthorization(
    address token,
    address from,
    uint256 amount,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s,
    uint256 minOut,
    address receiver,
    uint256 deadline
  ) external returns (uint256 out) {
    IEIP3009(token).transferWithAuthorization(from, address(this), amount, validAfter, validBefore, nonce, v, r, s);
    _approveMax(token, router, amount);
    address[] memory path = new address[](2);
    path[0] = token;
    path[1] = usdc;
    uint256[] memory amts = IUniswapV2Router02(router).swapExactTokensForTokens(amount, minOut, path, address(this), deadline);
    out = amts[amts.length - 1];
    IERC20(usdc).transfer(receiver, out);
    emit Swapped(from, token, amount, out);
  }

  function swapWithPermit(
    address token,
    address from,
    uint256 amount,
    uint256 deadlinePermit,
    uint8 v,
    bytes32 r,
    bytes32 s,
    uint256 minOut,
    address receiver,
    uint256 deadlineSwap
  ) external returns (uint256 out) {
    IEIP2612(token).permit(from, address(this), amount, deadlinePermit, v, r, s);
    IERC20(token).transferFrom(from, address(this), amount);
    _approveMax(token, router, amount);
    address[] memory path = new address[](2);
    path[0] = token;
    path[1] = usdc;
    uint256[] memory amts = IUniswapV2Router02(router).swapExactTokensForTokens(amount, minOut, path, address(this), deadlineSwap);
    out = amts[amts.length - 1];
    IERC20(usdc).transfer(receiver, out);
    emit Swapped(from, token, amount, out);
  }

  function swapFromApproved(
    address token,
    address from,
    uint256 amount,
    uint256 minOut,
    address receiver,
    uint256 deadline
  ) external returns (uint256 out) {
    IERC20(token).transferFrom(from, address(this), amount);
    _approveMax(token, router, amount);
    address[] memory path = new address[](2);
    path[0] = token;
    path[1] = usdc;
    // optional on-chain check for path output
    // (will revert inside router if no liquidity)
    uint256[] memory amts = IUniswapV2Router02(router).swapExactTokensForTokens(amount, minOut, path, address(this), deadline);
    out = amts[amts.length - 1];
    IERC20(usdc).transfer(receiver, out);
    emit Swapped(from, token, amount, out);
  }

  function swapFromApprovedPath(
    address[] calldata path,
    address from,
    uint256 amount,
    uint256 minOut,
    address receiver,
    uint256 deadline
  ) external returns (uint256 out) {
    require(path.length >= 2, "bad_path");
    address token = path[0];
    require(path[path.length - 1] == usdc, "must_end_usdc");
    IERC20(token).transferFrom(from, address(this), amount);
    _approveMax(token, router, amount);
    uint256[] memory amts = IUniswapV2Router02(router).swapExactTokensForTokens(amount, minOut, path, address(this), deadline);
    out = amts[amts.length - 1];
    IERC20(usdc).transfer(receiver, out);
    emit Swapped(from, token, amount, out);
  }

  function swapWithAuthorizationPath(
    address[] calldata path,
    address from,
    uint256 amount,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s,
    uint256 minOut,
    address receiver,
    uint256 deadline
  ) external returns (uint256 out) {
    require(path.length >= 2, "bad_path");
    address token = path[0];
    require(path[path.length - 1] == usdc, "must_end_usdc");
    IEIP3009(token).transferWithAuthorization(from, address(this), amount, validAfter, validBefore, nonce, v, r, s);
    _approveMax(token, router, amount);
    uint256[] memory amts = IUniswapV2Router02(router).swapExactTokensForTokens(amount, minOut, path, address(this), deadline);
    out = amts[amts.length - 1];
    IERC20(usdc).transfer(receiver, out);
    emit Swapped(from, token, amount, out);
  }
}
