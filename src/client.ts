/**
 * MegaFlowClient — High-level stateful client for MegaETH
 *
 * Wraps MegaFlowBuilder with:
 * - Automatic nonce management for rapid sequential transactions
 * - WebSocket support for lower latency
 * - ERC20 balance/allowance reads
 * - Multicall token state fetching
 *
 * @example Zero-config (recommended)
 * ```typescript
 * import { MegaFlowClient, parseUnits } from '@megaflow-labs/sdk';
 *
 * // One import, no viem required
 * const client = MegaFlowClient.fromPrivateKey('0xYOUR_PRIVATE_KEY');
 *
 * const result = await client.batch()
 *   .safeApprove(USDC, DEX_ROUTER, parseUnits('100', 6), 0n)
 *   .swapExactTokensForTokens({ ... })
 *   .executeSync(); // instant receipt on MegaETH
 * ```
 *
 * @example With existing viem account
 * ```typescript
 * import { MegaFlowClient } from '@megaflow-labs/sdk';
 * import { privateKeyToAccount } from 'viem/accounts';
 *
 * const client = new MegaFlowClient().connectWithAccount(privateKeyToAccount('0x...'));
 * ```
 */

import {
    createPublicClient,
    createWalletClient,
    http,
    webSocket,
    type Address,
    type Hex,
    type PublicClient,
    type WalletClient,
    type Account,
    type TransactionReceipt,
    parseEther,
} from 'viem';
import { multicall } from 'viem/actions';
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts';
import { megaethMainnet } from './chains';
import { ERC20_ABI, MEGA_ROUTER_ABI, MEGAETH_TOKENS, MEGAETH_L1_BRIDGE, MAINNET_ROUTER_ADDRESS } from './constants';
import type { MegaFlowClientConfig, MegaFlowExecutionResult, MegaFlowSyncResult } from './types';
import { MegaFlowBuilder } from './builder';

export class MegaFlowClient {
    private config: MegaFlowClientConfig;
    protected publicClient: PublicClient;
    protected walletClient?: WalletClient;
    private wsClient?: PublicClient;

    // Local nonce cache: address → last used nonce
    private nonceCache: Map<string, number> = new Map();

    constructor(config: MegaFlowClientConfig = {}) {
        this.config = {
            ...config,
            routerAddress: config.routerAddress ?? MAINNET_ROUTER_ADDRESS,
        };

        // Use provided clients or create defaults
        if (config.publicClient) {
            this.publicClient = config.publicClient;
        } else {
            const rpcUrl = config.rpcUrl ?? (config.chain ?? megaethMainnet).rpcUrls.default.http[0];
            this.publicClient = createPublicClient({
                chain: config.chain ?? megaethMainnet,
                transport: http(rpcUrl, { timeout: 30_000 }),
            });
        }

        if (config.walletClient) {
            this.walletClient = config.walletClient;
        }
    }

    // ==========================================================================
    // Static factories — zero external imports needed
    // ==========================================================================

    /**
     * Create a client from a raw private key.
     * Eliminates the need to import `privateKeyToAccount` from viem/accounts.
     *
     * @example
     * ```typescript
     * import { MegaFlowClient, parseUnits } from '@megaflow-labs/sdk';
     * const client = MegaFlowClient.fromPrivateKey('0xYOUR_PRIVATE_KEY');
     * ```
     */
    static fromPrivateKey(privateKey: Hex, config: MegaFlowClientConfig = {}): MegaFlowClient {
        const account = privateKeyToAccount(privateKey);
        return new MegaFlowClient(config).connectWithAccount(account);
    }

    /**
     * Create a client from a BIP-39 mnemonic phrase.
     *
     * @example
     * ```typescript
     * const client = MegaFlowClient.fromMnemonic('word1 word2 ... word12');
     * ```
     */
    static fromMnemonic(mnemonic: string, config: MegaFlowClientConfig = {}): MegaFlowClient {
        const account = mnemonicToAccount(mnemonic);
        return new MegaFlowClient(config).connectWithAccount(account);
    }

    // ==========================================================================
    // Connection
    // ==========================================================================

    /**
     * The connected account's address, or undefined if not yet connected.
     */
    get address(): Address | undefined {
        return (this.walletClient?.account as { address?: Address } | undefined)?.address;
    }

    connectWithAccount(account: Account, rpcUrl?: string): this {
        const chain = this.config.chain ?? megaethMainnet;
        this.walletClient = createWalletClient({
            account,
            chain,
            transport: http(rpcUrl ?? chain.rpcUrls.default.http[0]),
        });
        return this;
    }

    connect(walletClient: WalletClient): this {
        this.walletClient = walletClient;
        return this;
    }

    /**
     * Enable a WebSocket client for lower latency.
     * WebSocket is 5-6x faster than HTTP on MegaETH.
     *
     * Requires the chain to have a webSocket URL configured.
     */
    enableWebSocket(wsUrl?: string): this {
        const chain = this.config.chain ?? megaethMainnet;
        const url = wsUrl ??
            (chain.rpcUrls.default as { webSocket?: string[] }).webSocket?.[0];

        if (!url) throw new Error('No WebSocket URL available for this chain.');

        this.wsClient = createPublicClient({
            chain,
            // viem's webSocket transport handles reconnection internally.
            // MegaETH requires a keepalive ping every 30s — viem handles this
            // via the underlying WebSocket ping frames automatically.
            transport: webSocket(url),
        });
        return this;
    }

    /** Active public client (prefers WebSocket when enabled) */
    get activeClient(): PublicClient {
        return this.wsClient ?? this.publicClient;
    }

    // ==========================================================================
    // Batch Builder Factory
    // ==========================================================================

    /**
     * Create a new MegaFlowBuilder linked to this client's configuration.
     * Start building calls, then call `.execute()` or `.executeSync()`.
     */
    batch(): MegaFlowBuilder {
        const builder = new MegaFlowBuilder({
            routerAddress: this.config.routerAddress,
            rpcUrl: this.config.rpcUrl,
            chain: this.config.chain,
        });

        if (this.walletClient) builder.connect(this.walletClient);
        return builder;
    }

    // ==========================================================================
    // Token Reads (Multicall batched for efficiency)
    // ==========================================================================

    /**
     * Get the native ETH balance of an address.
     */
    async getETHBalance(address: Address): Promise<bigint> {
        return this.publicClient.getBalance({ address });
    }

    /**
     * Get the ERC20 token balance of an address.
     */
    async getTokenBalance(token: Address, owner: Address): Promise<bigint> {
        return this.publicClient.readContract({
            address: token,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [owner],
        }) as Promise<bigint>;
    }

    /**
     * Get the current ERC20 allowance.
     */
    async getAllowance(token: Address, owner: Address, spender: Address): Promise<bigint> {
        return this.publicClient.readContract({
            address: token,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [owner, spender],
        }) as Promise<bigint>;
    }

    /**
     * Get multiple token balances in a single multicall.
     * Much faster than sequential calls on MegaETH (v2.0.14+).
     */
    async getMultipleBalances(
        tokens: Address[],
        owner: Address,
    ): Promise<{ token: Address; balance: bigint }[]> {
        const contracts = tokens.map((token) => ({
            address: token,
            abi: ERC20_ABI,
            functionName: 'balanceOf' as const,
            args: [owner] as const,
        }));

        const results = await multicall(this.publicClient, { contracts });

        return tokens.map((token, i) => ({
            token,
            balance: (results[i].status === 'success' ? results[i].result : 0n) as bigint,
        }));
    }

    /**
     * Get token metadata (name, symbol, decimals) in a single multicall round-trip.
     */
    async getTokenInfo(token: Address): Promise<{
        name: string;
        symbol: string;
        decimals: number;
        totalSupply: bigint;
    }> {
        const [name, symbol, decimals, totalSupply] = await multicall(this.publicClient, {
            contracts: [
                { address: token, abi: ERC20_ABI, functionName: 'name' },
                { address: token, abi: ERC20_ABI, functionName: 'symbol' },
                { address: token, abi: ERC20_ABI, functionName: 'decimals' },
                { address: token, abi: ERC20_ABI, functionName: 'totalSupply' },
            ],
        });

        return {
            name: (name.result ?? '') as string,
            symbol: (symbol.result ?? '') as string,
            decimals: (decimals.result ?? 18) as number,
            totalSupply: (totalSupply.result ?? 0n) as bigint,
        };
    }

    // ==========================================================================
    // Router Reads
    // ==========================================================================

    /** Get protocol flat fee from the deployed router */
    async getFlatFee(): Promise<bigint> {
        return this.publicClient.readContract({
            address: this.config.routerAddress!,
            abi: MEGA_ROUTER_ABI,
            functionName: 'flatFee',
        }) as Promise<bigint>;
    }

    /** Get fee collector address from the deployed router */
    async getFeeCollector(): Promise<Address> {
        return this.publicClient.readContract({
            address: this.config.routerAddress!,
            abi: MEGA_ROUTER_ABI,
            functionName: 'feeCollector',
        }) as Promise<Address>;
    }

    // ==========================================================================
    // Nonce Management
    // ==========================================================================

    /**
     * Get the next usable nonce for an address, respecting locally tracked nonces.
     *
     * Critical for MegaETH: 10ms blocks mean sequential txs can race.
     * Local nonce tracking prevents "already known" / "nonce too low" errors.
     */
    async getNextNonce(address: Address): Promise<number> {
        const key = address.toLowerCase();

        // Fetch pending nonce from network
        const networkNonce = await this.publicClient.getTransactionCount({
            address,
            blockTag: 'pending',
        });

        const lastUsed = this.nonceCache.get(key) ?? -1;
        const nonce = Math.max(networkNonce, lastUsed + 1);

        this.nonceCache.set(key, nonce);
        return nonce;
    }

    /** Reset locally cached nonce for an address (call after a tx confirms or fails). */
    resetNonce(address: Address): void {
        this.nonceCache.delete(address.toLowerCase());
    }

    // ==========================================================================
    // Gas Helpers
    // ==========================================================================

    /**
     * Get the current gas price from MegaETH RPC.
     * Returns the raw value (avoids viem's 20% buffer).
     */
    async getGasPrice(): Promise<bigint> {
        const price = await this.publicClient.request({
            method: 'eth_gasPrice',
        });
        return BigInt(price as string);
    }

    // ==========================================================================
    // MegaETH Bridge Helper
    // ==========================================================================

    /**
     * Bridge ETH from Ethereum mainnet to MegaETH.
     *
     * NOTE: This must be called from an Ethereum mainnet wallet client,
     * not the MegaETH wallet client.
     *
     * @param l1WalletClient - Ethereum mainnet wallet client
     * @param amount - Amount in wei to bridge
     */
    async bridgeETHToMegaETH(
        l1WalletClient: WalletClient,
        amount: bigint,
    ): Promise<Hex> {
        if (!l1WalletClient.account) {
            throw new Error('L1 wallet client has no account');
        }

        const hash = await l1WalletClient.sendTransaction({
            account: l1WalletClient.account,
            to: MEGAETH_L1_BRIDGE,
            value: amount,
            chain: l1WalletClient.chain,
        });

        return hash;
    }

    // ==========================================================================
    // Connection Status
    // ==========================================================================

    get isConnected(): boolean {
        return !!this.walletClient?.account;
    }

    get account(): Address | undefined {
        return this.walletClient?.account?.address;
    }

    get routerAddress(): Address {
        return this.config.routerAddress!;
    }
}
