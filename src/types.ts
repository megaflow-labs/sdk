/**
 * MegaFlow SDK Types
 */

import {
    type Address,
    type Hex,
    type Chain,
    type Hash,
    type TransactionReceipt,
    type PublicClient,
    type WalletClient,
} from 'viem';

// ============================================================================
// Core Batch Types
// ============================================================================

/**
 * A single call operation in a batch.
 * Mirrors the `Call` struct in MegaRouter.sol.
 */
export interface MegaCall {
    /** Target contract address */
    target: Address;
    /** ETH value to send with the call (wei) */
    value: bigint;
    /** ABI-encoded function call */
    callData: Hex;
}

/**
 * Result from a single call in the batch.
 * Mirrors the `Result` struct in MegaRouter.sol.
 */
export interface MegaCallResult {
    /** Whether the call succeeded */
    success: boolean;
    /** Raw bytes returned from the call */
    returnData: Hex;
}

// ============================================================================
// Execution Results
// ============================================================================

/** Full result after executing a batch (standard async flow) */
export interface MegaFlowExecutionResult {
    /** Transaction hash */
    hash: Hash;
    /** Full transaction receipt */
    receipt: TransactionReceipt;
    /** Per-call results decoded from receipt logs */
    results: MegaCallResult[];
    /** Gas used for the whole batch */
    gasUsed: bigint;
    /** Effective gas price */
    effectiveGasPrice: bigint;
    /** Total cost in wei (gasUsed * effectiveGasPrice) */
    totalCost: bigint;
}

/** Result from executeSync (eth_sendRawTransactionSync) */
export interface MegaFlowSyncResult {
    /** Full transaction receipt (no hash separate — already included) */
    receipt: TransactionReceipt;
    /** Per-call results */
    results: MegaCallResult[];
    /** Gas used */
    gasUsed: bigint;
    /** Execution time in milliseconds (client-side measured) */
    executionTimeMs: number;
}

/** Simulation / dry-run result */
export interface MegaFlowSimulationResult {
    /** Whether simulation succeeded */
    success: boolean;
    /** Per-call simulated results (only if success) */
    results?: MegaCallResult[];
    /** Gas estimate for the batch */
    gasEstimate?: bigint;
    /** Error message (only if failed) */
    error?: string;
    /** Decoded revert reason (if available) */
    revertReason?: string;
    /** Index of the failed call (if determinable) */
    failedCallIndex?: number;
}

// ============================================================================
// Execution Options
// ============================================================================

/** Options for execute() and executeSync() */
export interface ExecuteOptions {
    /** Gas limit override */
    gasLimit?: bigint;
    /** Max fee per gas override */
    maxFeePerGas?: bigint;
    /** Max priority fee override */
    maxPriorityFeePerGas?: bigint;
    /** Nonce override */
    nonce?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/** Configuration for creating a MegaFlowBuilder */
export interface MegaFlowConfig {
    /** Deployed MegaRouter contract address. Defaults to MAINNET_ROUTER_ADDRESS. */
    routerAddress?: Address;
    /** Override RPC URL. Defaults to chain's public endpoint. */
    rpcUrl?: string;
    /** Chain to operate on. Defaults to megaethMainnet. */
    chain?: Chain;
    /** Enable debug logging */
    debug?: boolean;
}

/** Configuration for MegaFlowClient */
export interface MegaFlowClientConfig extends MegaFlowConfig {
    /** Pre-configured viem PublicClient (optional) */
    publicClient?: PublicClient;
    /** Pre-configured viem WalletClient (optional) */
    walletClient?: WalletClient;
}

// ============================================================================
// DEX / DeFi Types
// ============================================================================

export interface SwapParams {
    router: Address;
    amountIn: bigint;
    amountOutMin: bigint;
    path: Address[];
    to: Address;
    deadline?: bigint;
}

export interface ApproveAndSwapParams extends SwapParams {
    token: Address;
    /** Current on-chain allowance (for safe approve pattern) */
    currentAllowance?: bigint;
}

export interface TransferParams {
    token: Address;
    to: Address;
    amount: bigint;
}

// ============================================================================
// KyberSwap Integration Types
// ============================================================================

export interface KyberQuoteParams {
    tokenIn: Address | 'ETH';
    tokenOut: Address | 'ETH';
    amountIn: bigint;
    /** Slippage in basis points (e.g. 50 = 0.5%) */
    slippageBps?: number;
}

export interface KyberRouteSummary {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    gas: string;
    route: unknown[];
    [key: string]: unknown;
}

export interface KyberBuildResult {
    routerAddress: Address;
    data: Hex;
    value: string;
    gas: string;
}

// ============================================================================
// Event Types (decoded from contract logs)
// ============================================================================

export interface BatchExecutedEvent {
    sender: Address;
    callCount: bigint;
    totalValue: bigint;
    blockNumber: bigint;
    transactionHash: Hex;
}

export interface CallExecutedEvent {
    callIndex: bigint;
    target: Address;
    value: bigint;
    success: boolean;
    blockNumber: bigint;
    transactionHash: Hex;
}

// ============================================================================
// Operation Tracking Types
// ============================================================================

export type OperationType =
    | 'transfer'
    | 'approve'
    | 'safeApprove'
    | 'swap'
    | 'wrap'
    | 'unwrap'
    | 'kyberSwap'
    | 'nftTransfer'
    | 'custom';

export interface RecordedOperation {
    readonly type: OperationType;
    readonly call: MegaCall;
    readonly metadata?: Record<string, unknown>;
    readonly timestamp: number;
}

export interface BuilderState {
    readonly calls: readonly MegaCall[];
    readonly operations: readonly RecordedOperation[];
    readonly totalValue: bigint;
    readonly chainId: number;
}

// ============================================================================
// Preflight Check Types
// ============================================================================

export interface BalanceCheck {
    token: Address | 'ETH';
    required: bigint;
    available: bigint;
    sufficient: boolean;
}

export interface PreflightResult {
    valid: boolean;
    simulation: MegaFlowSimulationResult;
    balanceChecks: BalanceCheck[];
    estimatedGas: bigint;
    estimatedCost: bigint;
    warnings: string[];
    errors: string[];
}

// ============================================================================
// Error Types
// ============================================================================

export type MegaFlowErrorCode =
    | 'EMPTY_BATCH'
    | 'WALLET_NOT_CONNECTED'
    | 'NO_ACCOUNT'
    | 'SIMULATION_FAILED'
    | 'EXECUTION_FAILED'
    | 'INSUFFICIENT_BALANCE'
    | 'INSUFFICIENT_ALLOWANCE'
    | 'KYBER_API_ERROR'
    | 'NETWORK_ERROR'
    | 'USER_REJECTED'
    | 'TIMEOUT';
