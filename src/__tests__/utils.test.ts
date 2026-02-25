/**
 * Unit tests for MegaFlow utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    decodeRevertError,
    applyMegaethGasBuffer,
    deadlineInMinutes,
    buildSafeApproveCalls,
    assertCallsNotEmpty,
    assertWalletConnected,
    assertAccount,
    parseCallResults,
    MegaFlowError,
} from '../utils';
import type { MegaCall } from '../types';
import { encodeAbiParameters, encodeFunctionData, parseAbi, keccak256, toBytes } from 'viem';

// ============================================================================
// decodeRevertError
// ============================================================================

describe('decodeRevertError', () => {
    it('returns generic message for empty data', () => {
        expect(decodeRevertError('0x')).toContain('no data');
    });

    it('decodes Error(string) revert', () => {
        // Error(string) selector = 0x08c379a0
        const msg = 'Insufficient balance';
        const encoded = encodeAbiParameters([{ type: 'string' }], [msg]);
        const data = `0x08c379a0${encoded.slice(2)}` as `0x${string}`;
        expect(decodeRevertError(data)).toBe(`Reverted: ${msg}`);
    });

    it('decodes Panic(0x11) — overflow', () => {
        const encoded = encodeAbiParameters([{ type: 'uint256' }], [0x11n]);
        const data = `0x4e487b71${encoded.slice(2)}` as `0x${string}`;
        expect(decodeRevertError(data)).toContain('overflow');
    });

    it('returns unknown selector message for unrecognised errors', () => {
        const result = decodeRevertError('0xdeadbeef00000000');
        expect(result).toContain('0xdeadbeef');
    });

    it('decodes CallFailed with inner Error(string)', () => {
        // Build inner Error(string)
        const innerMsg = 'transfer amount exceeds balance';
        const innerEncoded = encodeAbiParameters([{ type: 'string' }], [innerMsg]);
        const innerData = `0x08c379a0${innerEncoded.slice(2)}` as `0x${string}`;

        // Build outer CallFailed(uint256, bytes)  — selector 0x85d9d0b8
        const outerEncoded = encodeAbiParameters(
            [{ type: 'uint256' }, { type: 'bytes' }],
            [2n, innerData],
        );
        const data = `0x85d9d0b8${outerEncoded.slice(2)}` as `0x${string}`;

        const result = decodeRevertError(data);
        expect(result).toContain('Call #2');
        expect(result).toContain(innerMsg);
    });
});

// ============================================================================
// applyMegaethGasBuffer
// ============================================================================

describe('applyMegaethGasBuffer', () => {
    it('applies 10% buffer by default', () => {
        expect(applyMegaethGasBuffer(100_000n)).toBe(110_000n);
    });

    it('applies custom buffer', () => {
        expect(applyMegaethGasBuffer(100_000n, 30)).toBe(130_000n);
    });

    it('handles 0 estimate', () => {
        expect(applyMegaethGasBuffer(0n)).toBe(0n);
    });
});

// ============================================================================
// deadlineInMinutes
// ============================================================================

describe('deadlineInMinutes', () => {
    it('returns a timestamp in the future', () => {
        const now = BigInt(Math.floor(Date.now() / 1000));
        const deadline = deadlineInMinutes(5);
        expect(deadline).toBeGreaterThan(now);
        expect(deadline).toBeLessThanOrEqual(now + 301n);
    });
});

// ============================================================================
// buildSafeApproveCalls
// ============================================================================

describe('buildSafeApproveCalls', () => {
    const TOKEN = '0x1111111111111111111111111111111111111111' as const;
    const SPENDER = '0x2222222222222222222222222222222222222222' as const;
    const AMOUNT = 1000n;

    it('returns single approve when current allowance is 0', () => {
        const calls = buildSafeApproveCalls({
            token: TOKEN,
            spender: SPENDER,
            amount: AMOUNT,
            currentAllowance: 0n,
        });
        expect(calls).toHaveLength(1);
        expect(calls[0].target).toBe(TOKEN);
    });

    it('returns two approves (reset + set) when allowance is non-zero and different', () => {
        const calls = buildSafeApproveCalls({
            token: TOKEN,
            spender: SPENDER,
            amount: AMOUNT,
            currentAllowance: 500n,
        });
        expect(calls).toHaveLength(2);
        // First call should approve 0
        expect(calls[0].callData).toContain('0'.repeat(64));
    });

    it('returns single approve when current allowance equals new amount', () => {
        const calls = buildSafeApproveCalls({
            token: TOKEN,
            spender: SPENDER,
            amount: AMOUNT,
            currentAllowance: AMOUNT,
        });
        expect(calls).toHaveLength(1);
    });

    it('callData starts with approve selector 0x095ea7b3', () => {
        const calls = buildSafeApproveCalls({
            token: TOKEN,
            spender: SPENDER,
            amount: AMOUNT,
            currentAllowance: 0n,
        });
        expect(calls[0].callData.toLowerCase().slice(0, 10)).toBe('0x095ea7b3');
    });
});

// ============================================================================
// Validation helpers
// ============================================================================

describe('assertCallsNotEmpty', () => {
    it('throws MegaFlowError when calls is empty', () => {
        expect(() => assertCallsNotEmpty([])).toThrowError(MegaFlowError);
    });

    it('throws with EMPTY_BATCH code', () => {
        try {
            assertCallsNotEmpty([]);
        } catch (e) {
            expect((e as MegaFlowError).code).toBe('EMPTY_BATCH');
        }
    });

    it('does not throw when calls has items', () => {
        const call: MegaCall = {
            target: '0x1111111111111111111111111111111111111111',
            value: 0n,
            callData: '0x00',
        };
        expect(() => assertCallsNotEmpty([call])).not.toThrow();
    });
});

describe('assertWalletConnected', () => {
    it('throws when walletClient is undefined', () => {
        expect(() => assertWalletConnected(undefined)).toThrowError(MegaFlowError);
    });

    it('throws with WALLET_NOT_CONNECTED code', () => {
        try {
            assertWalletConnected(null);
        } catch (e) {
            expect((e as MegaFlowError).code).toBe('WALLET_NOT_CONNECTED');
        }
    });

    it('does not throw when walletClient is provided', () => {
        expect(() => assertWalletConnected({})).not.toThrow();
    });
});

describe('assertAccount', () => {
    it('throws when account is missing', () => {
        expect(() => assertAccount({})).toThrowError(MegaFlowError);
    });

    it('does not throw when account is present', () => {
        expect(() => assertAccount({ account: { address: '0x123' } })).not.toThrow();
    });
});

// ============================================================================
// MegaFlowError
// ============================================================================

describe('MegaFlowError', () => {
    it('has correct name and code', () => {
        const err = new MegaFlowError('test', 'EMPTY_BATCH');
        expect(err.name).toBe('MegaFlowError');
        expect(err.code).toBe('EMPTY_BATCH');
        expect(err.message).toContain('[MegaFlow]');
    });

    it('is instanceof Error', () => {
        expect(new MegaFlowError('x', 'EMPTY_BATCH')).toBeInstanceOf(Error);
    });
});
