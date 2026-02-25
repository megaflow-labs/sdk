/**
 * MegaFlow Utility Functions
 */

import {
    decodeEventLog,
    decodeAbiParameters,
    decodeFunctionResult,
    hexToString,
    slice,
    size,
    type Hex,
    type TransactionReceipt,
    type Address,
} from 'viem';
import { MEGA_ROUTER_ABI, KYBERSWAP_API_BASE } from './constants';
import type {
    MegaCall,
    MegaCallResult,
    BatchExecutedEvent,
    CallExecutedEvent,
    KyberQuoteParams,
    KyberRouteSummary,
    KyberBuildResult,
    MegaFlowErrorCode,
} from './types';

// ============================================================================
// Revert Error Decoder
// ============================================================================

/**
 * Decode a reverted call's returnData into a human-readable error message.
 *
 * Handles:
 * - Standard `Error(string)` ABI-encoded reverts (selector 0x08c379a0)
 * - Panic reverts (selector 0x4e487b71)
 * - MegaRouter custom errors (ReentrancyGuard, CallFailed, etc.)
 * - Raw empty reverts
 */
export function decodeRevertError(returnData: Hex): string {
    if (!returnData || returnData === '0x' || returnData.length < 10) {
        return 'Execution reverted with no data';
    }

    const selector = returnData.slice(0, 10).toLowerCase();

    // Standard Error(string)
    if (selector === '0x08c379a0') {
        try {
            const [message] = decodeAbiParameters(
                [{ type: 'string' }],
                `0x${returnData.slice(10)}` as Hex,
            );
            return `Reverted: ${message}`;
        } catch {
            return `Reverted (Error selector found but decode failed)`;
        }
    }

    // Panic(uint256) — compiler-generated panics
    if (selector === '0x4e487b71') {
        try {
            const [code] = decodeAbiParameters(
                [{ type: 'uint256' }],
                `0x${returnData.slice(10)}` as Hex,
            );
            return `Panic: ${decodePanicCode(Number(code))}`;
        } catch {
            return 'Panic: unknown code';
        }
    }

    // MegaRouter custom errors
    const customErrors: Record<string, string> = {
        '0x3e3f8f73': 'ReentrancyGuard: re-entrant call',
        '0xfe9ba5cd': 'InsufficientETH: not enough ETH sent',
        '0xd4a5e2bf': 'InsufficientFee: flat fee not covered',
        '0x1425f8f8': 'InvalidTarget: call target is address(0)',
        '0x4a3f0f2d': 'EmptyCalldata: callData must not be empty',
        '0x85d9d0b8': 'CallFailed: one of the batch calls reverted',
        '0xb5e9e6d2': 'FeeTransferFailed: could not send fee to collector',
        '0x750b219c': 'SweepFailed: could not return leftover ETH',
    };

    if (customErrors[selector]) {
        // If it's a CallFailed, try to get the inner revert data
        if (selector === '0x85d9d0b8') {
            try {
                const [callIndex, innerData] = decodeAbiParameters(
                    [{ type: 'uint256' }, { type: 'bytes' }],
                    `0x${returnData.slice(10)}` as Hex,
                );
                const inner = decodeRevertError(innerData as Hex);
                return `Call #${callIndex} failed → ${inner}`;
            } catch {
                return customErrors[selector];
            }
        }
        return customErrors[selector];
    }

    return `Reverted with unknown selector ${selector}`;
}

function decodePanicCode(code: number): string {
    const codes: Record<number, string> = {
        0x00: 'generic panic',
        0x01: 'assert failed',
        0x11: 'arithmetic overflow/underflow',
        0x12: 'division by zero',
        0x21: 'invalid enum value',
        0x22: 'storage access out of bounds',
        0x31: 'pop on empty array',
        0x32: 'array index out of bounds',
        0x41: 'out of memory',
        0x51: 'uninitialized function pointer',
    };
    return codes[code] ?? `code 0x${code.toString(16)}`;
}

// ============================================================================
// Receipt / Log Parsing
// ============================================================================

/**
 * Parse per-call results from a transaction receipt AND simulateContract result.
 *
 * Priority:
 * 1. Actual `returnData` from `executeBatch()` return value (best — has all returnData)
 * 2. `CallExecuted` events from the receipt logs (has success flag, no returnData)
 * 3. Fallback: assume success for all calls
 *
 * @param receipt - The transaction receipt
 * @param callCount - Number of calls in the original batch
 * @param rawReturnData - Optional: the raw return bytes of `executeBatch` (ABI-encoded Result[])
 */
export function parseCallResults(
    receipt: TransactionReceipt,
    callCount: number,
    rawReturnData?: Hex,
): MegaCallResult[] {
    // Strategy 1: Decode from actual executeBatch() return value
    // The return type is `(bool success, bytes returnData)[]`
    if (rawReturnData && rawReturnData !== '0x' && rawReturnData.length > 2) {
        try {
            const decoded = decodeAbiParameters(
                [
                    {
                        type: 'tuple[]',
                        components: [
                            { name: 'success', type: 'bool' },
                            { name: 'returnData', type: 'bytes' },
                        ],
                    },
                ],
                rawReturnData,
            );

            const results = decoded[0] as Array<{ success: boolean; returnData: Hex }>;
            return results.map((r) => ({
                success: r.success,
                returnData: r.returnData,
            }));
        } catch {
            // fallthrough to event-based parsing
        }
    }

    // Strategy 2: Parse CallExecuted events from logs
    const resultMap = new Map<number, MegaCallResult>();

    for (const log of receipt.logs) {
        try {
            const decoded = decodeEventLog({
                abi: MEGA_ROUTER_ABI,
                data: log.data,
                topics: log.topics,
                strict: false,
            });

            if (decoded.eventName === 'CallExecuted') {
                const { callIndex, success } = decoded.args as {
                    callIndex: bigint;
                    target: Address;
                    value: bigint;
                    success: boolean;
                };

                resultMap.set(Number(callIndex), {
                    success,
                    returnData: '0x' as Hex, // events don't carry returnData
                });
            }
        } catch {
            // not a MegaRouter log
        }
    }

    if (resultMap.size > 0) {
        return Array.from({ length: callCount }, (_, i) =>
            resultMap.get(i) ?? { success: true, returnData: '0x' as Hex },
        );
    }

    // Strategy 3: Fallback
    return Array.from({ length: callCount }, () => ({
        success: true,
        returnData: '0x' as Hex,
    }));
}

/**
 * Parse the `BatchExecuted` event from a transaction receipt.
 */
export function parseBatchExecutedEvent(
    receipt: TransactionReceipt,
): BatchExecutedEvent | null {
    for (const log of receipt.logs) {
        try {
            const decoded = decodeEventLog({
                abi: MEGA_ROUTER_ABI,
                data: log.data,
                topics: log.topics,
                strict: false,
            });

            if (decoded.eventName === 'BatchExecuted') {
                const args = decoded.args as {
                    sender: Address;
                    callCount: bigint;
                    totalValue: bigint;
                };
                return {
                    sender: args.sender,
                    callCount: args.callCount,
                    totalValue: args.totalValue,
                    blockNumber: receipt.blockNumber,
                    transactionHash: receipt.transactionHash,
                };
            }
        } catch {
            // skip
        }
    }
    return null;
}

/**
 * Parse all `CallExecuted` events from a receipt.
 */
export function parseCallExecutedEvents(
    receipt: TransactionReceipt,
): CallExecutedEvent[] {
    const events: CallExecutedEvent[] = [];

    for (const log of receipt.logs) {
        try {
            const decoded = decodeEventLog({
                abi: MEGA_ROUTER_ABI,
                data: log.data,
                topics: log.topics,
                strict: false,
            });

            if (decoded.eventName === 'CallExecuted') {
                const args = decoded.args as {
                    callIndex: bigint;
                    target: Address;
                    value: bigint;
                    success: boolean;
                };
                events.push({
                    callIndex: args.callIndex,
                    target: args.target,
                    value: args.value,
                    success: args.success,
                    blockNumber: receipt.blockNumber,
                    transactionHash: receipt.transactionHash,
                });
            }
        } catch {
            // skip
        }
    }

    return events.sort((a, b) => Number(a.callIndex - b.callIndex));
}

// ============================================================================
// Gas Helpers
// ============================================================================

/**
 * Apply MegaETH gas buffer.
 * MegaETH opcode costs differ from standard EVM.
 * Uses 10% buffer by default (viem's default 20% is too aggressive for MegaETH).
 */
export function applyMegaethGasBuffer(estimate: bigint, bufferPct = 10): bigint {
    return (estimate * BigInt(100 + bufferPct)) / 100n;
}

/**
 * Encode deadline as a unix timestamp (seconds) n minutes from now.
 */
export function deadlineInMinutes(minutes: number): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
}

// ============================================================================
// Safe Approve Helper
// ============================================================================

/**
 * Build the MegaCall(s) for a safe ERC20 approve.
 * Uses the "approve(0) → approve(amount)" pattern to avoid race conditions
 * required by tokens like USDT that revert on non-zero → non-zero approve.
 */
export function buildSafeApproveCalls(params: {
    token: Address;
    spender: Address;
    amount: bigint;
    currentAllowance: bigint;
}): MegaCall[] {
    const { token, spender, amount, currentAllowance } = params;

    const approveCalldata = (amt: bigint): Hex => {
        // keccak256("approve(address,uint256)")[0:4] = 0x095ea7b3
        const selector = '0x095ea7b3';
        const paddedSpender = spender.slice(2).padStart(64, '0');
        const paddedAmount = amt.toString(16).padStart(64, '0');
        return `${selector}${paddedSpender}${paddedAmount}` as Hex;
    };

    const calls: MegaCall[] = [];

    // Reset existing non-zero allowance first
    if (currentAllowance > 0n && currentAllowance !== amount) {
        calls.push({ target: token, value: 0n, callData: approveCalldata(0n) });
    }

    calls.push({ target: token, value: 0n, callData: approveCalldata(amount) });
    return calls;
}

// ============================================================================
// KyberSwap Integration
// ============================================================================

/**
 * Fetch a swap quote from KyberSwap Aggregator for MegaETH.
 */
export async function getKyberQuote(
    params: KyberQuoteParams,
): Promise<KyberRouteSummary> {
    const ETH_PLACEHOLDER = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    const url = new URL(`${KYBERSWAP_API_BASE}/routes`);
    url.searchParams.set('tokenIn', params.tokenIn === 'ETH' ? ETH_PLACEHOLDER : params.tokenIn);
    url.searchParams.set('tokenOut', params.tokenOut === 'ETH' ? ETH_PLACEHOLDER : params.tokenOut);
    url.searchParams.set('amountIn', params.amountIn.toString());
    url.searchParams.set('gasInclude', 'true');

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`KyberSwap API error ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();
    if (json.code !== 0) throw new Error(`KyberSwap error: ${json.message}`);

    return json.data.routeSummary as KyberRouteSummary;
}

/**
 * Build a KyberSwap transaction for on-chain submission.
 */
export async function buildKyberSwap(params: {
    routeSummary: KyberRouteSummary;
    sender: Address;
    recipient: Address;
    slippageBps?: number;
}): Promise<KyberBuildResult> {
    const res = await fetch(`${KYBERSWAP_API_BASE}/route/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            routeSummary: params.routeSummary,
            sender: params.sender,
            recipient: params.recipient,
            slippageTolerance: params.slippageBps ?? 50,
        }),
    });

    if (!res.ok) {
        throw new Error(`KyberSwap build error ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    if (json.code !== 0) throw new Error(`KyberSwap build error: ${json.message}`);

    return json.data as KyberBuildResult;
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function assertCallsNotEmpty(calls: MegaCall[]): void {
    if (calls.length === 0) {
        throw new MegaFlowError(
            'No calls in batch. Add at least one call before executing.',
            'EMPTY_BATCH',
        );
    }
}

export function assertWalletConnected(walletClient: unknown): void {
    if (!walletClient) {
        throw new MegaFlowError(
            'Wallet not connected. Call connect() or connectWithAccount() first.',
            'WALLET_NOT_CONNECTED',
        );
    }
}

export function assertAccount(walletClient: { account?: unknown }): void {
    if (!walletClient.account) {
        throw new MegaFlowError(
            'Wallet has no account attached.',
            'NO_ACCOUNT',
        );
    }
}

/**
 * Check if error is a user rejection (MetaMask etc.)
 */
export function isUserRejection(error: unknown): boolean {
    if (error instanceof Error) {
        return (
            error.message.includes('User rejected') ||
            error.message.includes('user rejected') ||
            error.message.includes('User denied') ||
            error.message.includes('ACTION_REJECTED')
        );
    }
    return false;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): address is Address {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate hex string format
 */
export function isValidHex(hex: string): hex is Hex {
    return /^0x[a-fA-F0-9]*$/.test(hex);
}

// ============================================================================
// Batch Utilities
// ============================================================================

/**
 * Split calls into chunks (for very large batches that may exceed gas limits)
 */
export function chunkCalls<T>(calls: T[], maxPerBatch: number = 64): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < calls.length; i += maxPerBatch) {
        chunks.push(calls.slice(i, i + maxPerBatch));
    }
    return chunks;
}

/**
 * Calculate total ETH value across a set of calls
 */
export function calculateTotalValue(calls: Array<{ value: bigint }>): bigint {
    return calls.reduce((sum, call) => sum + call.value, 0n);
}

// ============================================================================
// Custom Error
// ============================================================================

/**
 * Typed SDK error with an error code for programmatic handling.
 */
export class MegaFlowError extends Error {
    constructor(
        message: string,
        public readonly code: MegaFlowErrorCode,
        public readonly cause?: unknown,
    ) {
        super(`[MegaFlow] ${message}`);
        this.name = 'MegaFlowError';
    }
}
