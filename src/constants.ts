/**
 * MegaFlow SDK Constants & ABIs
 */

import { parseAbi } from 'viem';

// ============================================================================
// MegaRouter ABI
// ============================================================================

/**
 * Full ABI for the MegaRouter.sol contract.
 * Keep in sync with contracts/src/MegaRouter.sol
 */
export const MEGA_ROUTER_ABI = parseAbi([
    // Core batch execution
    'function executeBatch((address target, uint256 value, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] results)',
    'function executeBatchWithOutput((address target, uint256 value, bytes callData)[] calls, uint256 outputCallIndex, uint256 outputOffset, uint256 outputLength) payable returns ((bool success, bytes returnData)[] results, bytes extractedOutput)',

    // View helpers
    'function calculateRequiredETH((address target, uint256 value, bytes callData)[] calls) view returns (uint256)',
    'function flatFee() view returns (uint256)',
    'function feeCollector() view returns (address)',

    // Events
    'event BatchExecuted(address indexed sender, uint256 callCount, uint256 totalValue)',
    'event CallExecuted(uint256 indexed callIndex, address indexed target, uint256 value, bool success)',

    // Errors (for decoding reverts)
    'error ReentrancyGuard()',
    'error InsufficientETH(uint256 required, uint256 provided)',
    'error InvalidTarget(uint256 callIndex)',
    'error EmptyCalldata(uint256 callIndex)',
    'error CallFailed(uint256 callIndex, bytes returnData)',
    'error FeeTransferFailed()',
    'error SweepFailed()',
]);

// ============================================================================
// Common ERC20 ABI
// ============================================================================

export const ERC20_ABI = parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
]);

// ============================================================================
// Common ERC721 ABI
// ============================================================================

export const ERC721_ABI = parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    'function approve(address to, uint256 tokenId)',
    'function setApprovalForAll(address operator, bool approved)',
]);

// ============================================================================
// Uniswap V2 Router ABI
// ============================================================================

export const UNISWAP_V2_ROUTER_ABI = parseAbi([
    'function factory() pure returns (address)',
    'function WETH() pure returns (address)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
    'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] path, address to, uint deadline) returns (uint[] amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
    'function swapETHForExactTokens(uint amountOut, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
    'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)',
    'function getAmountsIn(uint amountOut, address[] path) view returns (uint[] amounts)',
    'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)',
    'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)',
]);

// ============================================================================
// WETH ABI
// ============================================================================

export const WETH_ABI = parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function deposit() payable',
    'function withdraw(uint256 wad)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
]);

// ============================================================================
// MegaETH Gas Model Constants
// ============================================================================

/**
 * Known MegaETH gas limits for common operations.
 * MegaETH intrinsic gas is 60,000 (not 21,000 like Ethereum!).
 * Source: gas-model.md
 */
export const MEGAETH_GAS_LIMITS = {
    /** Simple ETH transfer — 60k on MegaETH, not 21k */
    TRANSFER: 60_000n,
    /** ERC20 transfer */
    ERC20_TRANSFER: 100_000n,
    /** ERC20 approve */
    ERC20_APPROVE: 80_000n,
    /** DEX swap */
    SWAP: 350_000n,
} as const;

/** MegaETH stable base fee in wei (0.001 gwei) */
export const MEGAETH_BASE_FEE = 1_000_000n;

// ============================================================================
// MegaETH Well-Known Addresses (Mainnet)
// ============================================================================

/**
 * Well-known token addresses on MegaETH Mainnet.
 * Source: https://github.com/megaeth-labs/mega-tokenlist
 */
export const MAINNET_ROUTER_ADDRESS = '0x9c1528e7688ee7122781dc8ed05686383b763ccb' as const;

export const MEGAETH_TOKENS = {
    /** Wrapped ETH */
    WETH: '0x4200000000000000000000000000000000000006' as const,
    /** MEGA governance token */
    MEGA: '0x28B7E77f82B25B95953825F1E3eA0E36c1c29861' as const,
    /** USDM stablecoin */
    USDM: '0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7' as const,
} satisfies Record<string, `0x${string}`>;

/**
 * MegaETH L1 bridge contract (on Ethereum mainnet).
 * Send ETH here to bridge to MegaETH.
 */
export const MEGAETH_L1_BRIDGE = '0x0CA3A2FBC3D770b578223FBB6b062fa875a2eE75' as const;

/**
 * KyberSwap Aggregator API base URL for MegaETH.
 * Source: wallet-operations.md
 */
export const KYBERSWAP_API_BASE = 'https://aggregator-api.kyberswap.com/megaeth/api/v1' as const;
