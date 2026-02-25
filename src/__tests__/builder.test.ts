/**
 * Unit tests for MegaFlowBuilder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MegaFlowBuilder } from '../builder';
import { megaethTestnet } from '../chains';
import { MEGAETH_TOKENS } from '../constants';
import { MegaFlowError } from '../utils';
import type { Address } from 'viem';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ROUTER_ADDR = '0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef' as Address;
const TOKEN_USDC = '0x1111111111111111111111111111111111111111' as Address;
const TOKEN_WETH = MEGAETH_TOKENS.WETH;
const DEX_ROUTER = '0x2222222222222222222222222222222222222222' as Address;
const USER = '0x3333333333333333333333333333333333333333' as Address;
const RECIPIENT = '0x4444444444444444444444444444444444444444' as Address;

// Helper — slice 4-byte selector from calldata
const sel = (callData: string) => callData.toLowerCase().slice(0, 10);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MegaFlowBuilder — construction', () => {
    it('creates with required config', () => {
        const b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR });
        expect(b.length).toBe(0);
        expect(b.isConnected).toBe(false);
        expect(b.account).toBeUndefined();
    });

    it('uses megaethMainnet by default (no throw)', () => {
        expect(() => new MegaFlowBuilder({ routerAddress: ROUTER_ADDR })).not.toThrow();
    });

    it('accepts testnet chain', () => {
        expect(() =>
            new MegaFlowBuilder({ routerAddress: ROUTER_ADDR, chain: megaethTestnet }),
        ).not.toThrow();
    });
});

describe('MegaFlowBuilder — generic add()', () => {
    let b: MegaFlowBuilder;

    beforeEach(() => { b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR }); });

    it('adds a raw call', () => {
        b.add(TOKEN_USDC, '0xdeadbeef', 0n);
        expect(b.length).toBe(1);
        expect(b.getCalls()[0].target).toBe(TOKEN_USDC);
        expect(b.getCalls()[0].callData).toBe('0xdeadbeef');
    });

    it('defaults value to 0n', () => {
        b.add(TOKEN_USDC, '0x00');
        expect(b.getCalls()[0].value).toBe(0n);
    });

    it('sets a custom value', () => {
        b.add(TOKEN_USDC, '0x00', 1n);
        expect(b.getCalls()[0].value).toBe(1n);
    });

    it('is chainable', () => {
        const result = b.add(TOKEN_USDC, '0x00').add(TOKEN_WETH, '0x01');
        expect(result).toBe(b);
        expect(b.length).toBe(2);
    });
});

describe('MegaFlowBuilder — ERC20 helpers', () => {
    let b: MegaFlowBuilder;

    beforeEach(() => { b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR }); });

    it('approve() encodes correct 4-byte selector (0x095ea7b3)', () => {
        b.approve(TOKEN_USDC, DEX_ROUTER, 1_000_000n);
        expect(b.getCalls()[0].target).toBe(TOKEN_USDC);
        expect(sel(b.getCalls()[0].callData)).toBe('0x095ea7b3');
        expect(b.getCalls()[0].value).toBe(0n);
    });

    it('transfer() encodes correct 4-byte selector (0xa9059cbb)', () => {
        b.transfer(TOKEN_USDC, RECIPIENT, 500_000n);
        expect(b.getCalls()[0].target).toBe(TOKEN_USDC);
        expect(sel(b.getCalls()[0].callData)).toBe('0xa9059cbb');
    });

    it('safeApprove() adds two calls when current allowance > 0 and different', () => {
        b.safeApprove(TOKEN_USDC, DEX_ROUTER, 1_000_000n, 500_000n);
        expect(b.length).toBe(2);
    });

    it('safeApprove() adds one call when current allowance is 0', () => {
        b.safeApprove(TOKEN_USDC, DEX_ROUTER, 1_000_000n, 0n);
        expect(b.length).toBe(1);
    });

    it('approveAndSwap() adds exactly 2 calls', () => {
        b.approveAndSwap({
            token: TOKEN_USDC,
            router: DEX_ROUTER,
            amountIn: 1_000_000n,
            amountOutMin: 0n,
            path: [TOKEN_USDC, TOKEN_WETH],
            to: USER,
        });
        expect(b.length).toBe(2);
    });

    it('transferFrom() encodes correct selector (0x23b872dd)', () => {
        b.transferFrom(TOKEN_USDC, USER, RECIPIENT, 100n);
        expect(sel(b.getCalls()[0].callData)).toBe('0x23b872dd');
    });
});

describe('MegaFlowBuilder — DEX swap helpers', () => {
    let b: MegaFlowBuilder;

    beforeEach(() => { b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR }); });

    it('swapExactTokensForTokens() targets router with selector 0x38ed1739', () => {
        b.swapExactTokensForTokens({
            router: DEX_ROUTER,
            amountIn: 1_000_000n,
            amountOutMin: 0n,
            path: [TOKEN_USDC, TOKEN_WETH],
            to: USER,
        });
        expect(b.getCalls()[0].target).toBe(DEX_ROUTER);
        expect(sel(b.getCalls()[0].callData)).toBe('0x38ed1739');
    });

    it('swapExactETHForTokens() sets ETH value and selector 0x7ff36ab5', () => {
        b.swapExactETHForTokens({
            router: DEX_ROUTER,
            amountIn: 1n,
            amountOutMin: 0n,
            path: [TOKEN_WETH, TOKEN_USDC],
            to: USER,
        });
        expect(b.getCalls()[0].value).toBe(1n);
        expect(sel(b.getCalls()[0].callData)).toBe('0x7ff36ab5');
    });

    it('swapExactTokensForETH() uses selector 0x18cbafe5', () => {
        b.swapExactTokensForETH({
            router: DEX_ROUTER,
            amountIn: 1_000n,
            amountOutMin: 0n,
            path: [TOKEN_USDC, TOKEN_WETH],
            to: USER,
        });
        expect(sel(b.getCalls()[0].callData)).toBe('0x18cbafe5');
    });
});

describe('MegaFlowBuilder — WETH helpers', () => {
    let b: MegaFlowBuilder;

    beforeEach(() => { b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR }); });

    it('wrapETH() targets WETH with selector 0xd0e30db0 and correct value', () => {
        b.wrapETH(TOKEN_WETH, 1_000n);
        expect(b.getCalls()[0].target).toBe(TOKEN_WETH);
        expect(b.getCalls()[0].value).toBe(1_000n);
        expect(sel(b.getCalls()[0].callData)).toBe('0xd0e30db0');
    });

    it('unwrapWETH() uses selector 0x2e1a7d4d with value 0', () => {
        b.unwrapWETH(TOKEN_WETH, 500n);
        expect(sel(b.getCalls()[0].callData)).toBe('0x2e1a7d4d');
        expect(b.getCalls()[0].value).toBe(0n);
    });
});

describe('MegaFlowBuilder — ERC721', () => {
    let b: MegaFlowBuilder;
    const NFT = '0x5555555555555555555555555555555555555555' as Address;

    beforeEach(() => { b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR }); });

    it('transferNFT() uses safeTransferFrom selector (0x42842e0e)', () => {
        b.transferNFT(NFT, USER, RECIPIENT, 42n);
        expect(sel(b.getCalls()[0].callData)).toBe('0x42842e0e');
    });

    it('approveNFT() uses approve selector (0x095ea7b3)', () => {
        b.approveNFT(NFT, USER, 1n);
        expect(sel(b.getCalls()[0].callData)).toBe('0x095ea7b3');
    });

    it('setApprovalForAll() uses correct selector (0xa22cb465)', () => {
        b.setApprovalForAll(NFT, DEX_ROUTER, true);
        expect(sel(b.getCalls()[0].callData)).toBe('0xa22cb465');
    });
});

describe('MegaFlowBuilder — utility methods', () => {
    let b: MegaFlowBuilder;

    beforeEach(() => {
        b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR });
        b.add(TOKEN_USDC, '0x00', 100n);
        b.add(TOKEN_WETH, '0x01', 200n);
    });

    it('getTotalValue() sums all call values', () => {
        expect(b.getTotalValue()).toBe(300n);
    });

    it('getCalls() returns an immutable copy', () => {
        const calls = b.getCalls() as unknown[];
        calls.push({});
        expect(b.length).toBe(2);
    });

    it('clear() resets calls to empty', () => {
        b.clear();
        expect(b.length).toBe(0);
        expect(b.getTotalValue()).toBe(0n);
    });

    it('clear() is chainable', () => {
        expect(b.clear()).toBe(b);
    });

    it('sendETH() sets 0x00 callData and given value', () => {
        b.clear().sendETH(RECIPIENT, 42n);
        expect(b.getCalls()[0].callData).toBe('0x00');
        expect(b.getCalls()[0].value).toBe(42n);
    });
});

describe('MegaFlowBuilder — execute guards', () => {
    it('simulate() throws MegaFlowError with EMPTY_BATCH when no calls', async () => {
        const b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR });
        try {
            await b.simulate();
            expect.fail('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(MegaFlowError);
            expect((e as MegaFlowError).code).toBe('EMPTY_BATCH');
        }
    });

    it('execute() throws MegaFlowError with WALLET_NOT_CONNECTED', async () => {
        const b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR });
        b.add(TOKEN_USDC, '0x00');
        try {
            await b.execute();
            expect.fail('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(MegaFlowError);
            expect((e as MegaFlowError).code).toBe('WALLET_NOT_CONNECTED');
        }
    });

    it('executeSync() throws MegaFlowError with WALLET_NOT_CONNECTED', async () => {
        const b = new MegaFlowBuilder({ routerAddress: ROUTER_ADDR });
        b.add(TOKEN_USDC, '0x00');
        try {
            await b.executeSync();
            expect.fail('should have thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(MegaFlowError);
            expect((e as MegaFlowError).code).toBe('WALLET_NOT_CONNECTED');
        }
    });
});
