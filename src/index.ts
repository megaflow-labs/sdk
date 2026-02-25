/**
 * @megaflow/sdk
 *
 * MegaFlow SDK — Batch Transaction Builder for MegaETH
 *
 * Build, simulate and execute multiple on-chain operations as a single
 * atomic transaction through the MegaRouter contract. All operations
 * either succeed together or revert together.
 *
 * @example Quick start
 * ```typescript
 * import { MegaFlowClient } from '@megaflow-labs/sdk';
 * import { privateKeyToAccount } from 'viem/accounts';
 *
 * const account = privateKeyToAccount('0x...');
 *
 * // Zero-config: uses MegaETH Mainnet by default
 * const client = new MegaFlowClient().connectWithAccount(account);
 *
 * const allowance = await client.getAllowance(USDC, account.address, DEX_ROUTER);
 *
 * const result = await client.batch()
 *   .safeApprove(USDC, DEX_ROUTER, parseUnits('100', 6), allowance)
 *   .swapExactTokensForTokens({
 *     router: DEX_ROUTER,
 *     amountIn: parseUnits('100', 6),
 *     amountOutMin: parseEther('0.03'),
 *     path: [USDC, WETH],
 *     to: account.address,
 *   })
 *   .executeSync(); // instant receipt on MegaETH
 * ```
 */

// Chains
export { megaethMainnet, megaethTestnet, megaethChains, chainById } from './chains';

// Types
export type {
  MegaCall,
  MegaCallResult,
  MegaFlowExecutionResult,
  MegaFlowSimulationResult,
  MegaFlowSyncResult,
  MegaFlowConfig,
  MegaFlowClientConfig,
  ExecuteOptions,
  SwapParams,
  ApproveAndSwapParams,
  TransferParams,
  KyberQuoteParams,
  KyberRouteSummary,
  KyberBuildResult,
  BatchExecutedEvent,
  CallExecutedEvent,
  OperationType,
  RecordedOperation,
  BuilderState,
  BalanceCheck,
  PreflightResult,
  MegaFlowErrorCode,
} from './types';

// Constants
export {
  MEGA_ROUTER_ABI,
  ERC20_ABI,
  ERC721_ABI,
  UNISWAP_V2_ROUTER_ABI,
  WETH_ABI,
  MEGAETH_GAS_LIMITS,
  MEGAETH_BASE_FEE,
  MEGAETH_TOKENS,
  MEGAETH_L1_BRIDGE,
  KYBERSWAP_API_BASE,
} from './constants';

// Utilities
export {
  parseCallResults,
  parseBatchExecutedEvent,
  parseCallExecutedEvents,
  applyMegaethGasBuffer,
  deadlineInMinutes,
  buildSafeApproveCalls,
  getKyberQuote,
  buildKyberSwap,
  isUserRejection,
  isValidAddress,
  isValidHex,
  chunkCalls,
  calculateTotalValue,
  MegaFlowError,
} from './utils';

// Core classes
export { MegaFlowBuilder } from './builder';
export { MegaFlowClient } from './client';

// ============================================================================
// Convenience factory functions
// ============================================================================

import { MegaFlowBuilder } from './builder';
import { MegaFlowClient } from './client';
import { megaethMainnet, megaethTestnet } from './chains';
import type { MegaFlowConfig, MegaFlowClientConfig } from './types';
import type { Address } from 'viem';

/**
 * Create a MegaFlowBuilder with the given config.
 */
export function createMegaFlow(config: MegaFlowConfig): MegaFlowBuilder {
  return new MegaFlowBuilder(config);
}

/**
 * Create a MegaFlowClient with the given config.
 */
export function createMegaFlowClient(config: MegaFlowClientConfig): MegaFlowClient {
  return new MegaFlowClient(config);
}

/**
 * Quick builder for MegaETH Mainnet.
 */
export function createMegaFlowMainnet(routerAddress: Address): MegaFlowBuilder {
  return new MegaFlowBuilder({ routerAddress, chain: megaethMainnet });
}

/**
 * Quick builder for MegaETH Testnet (Carrot).
 */
export function createMegaFlowTestnet(routerAddress: Address): MegaFlowBuilder {
  return new MegaFlowBuilder({ routerAddress, chain: megaethTestnet });
}

/**
 * Quick full client for MegaETH Mainnet.
 */
export function createMegaFlowClientMainnet(
  routerAddress: Address,
  rpcUrl?: string,
): MegaFlowClient {
  return new MegaFlowClient({ routerAddress, chain: megaethMainnet, rpcUrl });
}

/**
 * Quick full client for MegaETH Testnet (Carrot).
 */
export function createMegaFlowClientTestnet(
  routerAddress: Address,
  rpcUrl?: string,
): MegaFlowClient {
  return new MegaFlowClient({ routerAddress, chain: megaethTestnet, rpcUrl });
}
