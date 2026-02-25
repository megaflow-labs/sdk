/**
 * MegaFlowBuilder — Chainable batch transaction builder for MegaETH
 *
 * Build and execute multiple on-chain operations atomically through
 * the MegaRouter contract. All operations either succeed together or
 * revert together — no partial failures.
 *
 * @example
 * ```typescript
 * const builder = new MegaFlowBuilder();
 *
 * const result = await builder
 *   .connect(walletClient)
 *   .approve(USDC, DEX_ROUTER, amountIn)
 *   .swapExactTokensForTokens({ router: DEX_ROUTER, ... })
 *   .transfer(WETH, recipient, amount)
 *   .execute();
 * ```
 */

import {
    createPublicClient,
    createWalletClient,
    encodeFunctionData,
    http,
    webSocket,
    type Address,
    type Hex,
    type PublicClient,
    type WalletClient,
    type Chain,
    type Account,
    type TransactionReceipt,
} from 'viem';
import { megaethMainnet } from './chains';
import {
    MEGA_ROUTER_ABI,
    ERC20_ABI,
    ERC721_ABI,
    UNISWAP_V2_ROUTER_ABI,
    WETH_ABI,
    MEGAETH_GAS_LIMITS,
    MEGAETH_BASE_FEE,
    MEGAETH_TOKENS,
    MAINNET_ROUTER_ADDRESS,
} from './constants';
import type {
    MegaCall,
    MegaCallResult,
    MegaFlowConfig,
    MegaFlowExecutionResult,
    MegaFlowSimulationResult,
    MegaFlowSyncResult,
    SwapParams,
    ApproveAndSwapParams,
    KyberQuoteParams,
    KyberBuildResult,
    RecordedOperation,
    OperationType,
    BuilderState,
    ExecuteOptions,
} from './types';
import {
    parseCallResults,
    parseBatchExecutedEvent,
    applyMegaethGasBuffer,
    deadlineInMinutes,
    buildSafeApproveCalls,
    getKyberQuote,
    buildKyberSwap,
    assertCallsNotEmpty,
    assertWalletConnected,
    assertAccount,
    decodeRevertError,
    MegaFlowError,
} from './utils';

export class MegaFlowBuilder {
    protected calls: MegaCall[] = [];
    protected operations: RecordedOperation[] = [];
    protected publicClient: PublicClient;
    protected walletClient?: WalletClient;
    protected routerAddress: Address;
    protected chain: Chain;
    protected readonly debug: boolean;

    constructor(config: MegaFlowConfig = {}) {
        this.routerAddress = config.routerAddress ?? MAINNET_ROUTER_ADDRESS;
        this.chain = config.chain ?? megaethMainnet;
        this.debug = config.debug ?? false;

        const rpcUrl = config.rpcUrl ?? this.chain.rpcUrls.default.http[0];

        this.publicClient = createPublicClient({
            chain: this.chain,
            transport: http(rpcUrl, {
                timeout: 30_000,
            }),
        });
    }

    // ==========================================================================
    // Connection
    // ==========================================================================

    /**
     * Connect a pre-built viem WalletClient.
     */
    connect(walletClient: WalletClient): this {
        this.walletClient = walletClient;
        this.log('Wallet connected', { account: walletClient.account?.address });
        return this;
    }

    /**
     * Connect using a viem Account object.
     * Creates an internal WalletClient bound to MegaETH's chain/RPC.
     */
    connectWithAccount(account: Account, rpcUrl?: string): this {
        this.walletClient = createWalletClient({
            account,
            chain: this.chain,
            transport: http(rpcUrl ?? this.chain.rpcUrls.default.http[0]),
        });
        return this;
    }

    /**
     * Disconnect the wallet (for cleanup).
     */
    disconnect(): this {
        this.walletClient = undefined;
        return this;
    }

    // ==========================================================================
    // Generic Call Builders
    // ==========================================================================

    /**
     * Add a raw call (pre-encoded calldata).
     */
    add(target: Address, callData: Hex, value: bigint = 0n): this {
        const call: MegaCall = { target, value, callData };
        this.calls.push(call);
        this.recordOperation('custom', call);
        return this;
    }

    /**
     * Add a type-safe ABI-encoded call.
     *
     * @example
     * builder.addCall({
     *   target: '0x...',
     *   abi: myAbi,
     *   functionName: 'mint',
     *   args: [recipient, amount],
     * })
     */
    addCall<TAbi extends readonly unknown[]>(params: {
        target: Address;
        abi: TAbi;
        functionName: string;
        args?: readonly unknown[];
        value?: bigint;
    }): this {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const callData = encodeFunctionData({
            abi: params.abi as unknown as any[],
            functionName: params.functionName,
            args: (params.args ?? []) as any[],
        });

        return this.add(params.target, callData as Hex, params.value ?? 0n);
    }

    /**
     * Send native ETH to an address.
     * Uses a minimal `receive()` call (empty calldata is not allowed by MegaRouter,
     * so we send a 1-byte noop that any contract with a `receive()` will handle).
     */
    sendETH(to: Address, value: bigint): this {
        const call: MegaCall = { target: to, value, callData: '0x00' };
        this.calls.push(call);
        this.recordOperation('custom', call, { type: 'sendETH', to, value: value.toString() });
        return this;
    }

    // ==========================================================================
    // ERC20 Helpers
    // ==========================================================================

    /**
     * ERC20 approve.
     * Uses the simple single-approve pattern.
     * For safe two-step approve, use `safeApprove()`.
     */
    approve(token: Address, spender: Address, amount: bigint): this {
        return this.addCall({
            target: token,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spender, amount],
        });
    }

    /**
     * Safe ERC20 approve — resets allowance to 0 first if non-zero,
     * then sets the new amount. Prevents ERC20 approval race conditions
     * (required by some tokens like USDT).
     *
     * @param currentAllowance Current on-chain allowance. Pass 0n if unknown and you want a single approve.
     */
    safeApprove(
        token: Address,
        spender: Address,
        amount: bigint,
        currentAllowance: bigint,
    ): this {
        const approvalCalls = buildSafeApproveCalls({
            token,
            spender,
            amount,
            currentAllowance,
        });
        for (const call of approvalCalls) {
            this.calls.push(call);
            this.recordOperation('safeApprove', call, { token, spender, amount: amount.toString() });
        }
        return this;
    }

    /**
     * ERC20 transfer.
     */
    transfer(token: Address, to: Address, amount: bigint): this {
        return this.addCall({
            target: token,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [to, amount],
        });
    }

    /**
     * ERC20 transferFrom.
     */
    transferFrom(token: Address, from: Address, to: Address, amount: bigint): this {
        return this.addCall({
            target: token,
            abi: ERC20_ABI,
            functionName: 'transferFrom',
            args: [from, to, amount],
        });
    }

    /**
     * Batch transfer same token to multiple recipients in one batch.
     * @example .multiTransfer(USDC, [{ to: addr1, amount: 100n }, { to: addr2, amount: 200n }])
     */
    multiTransfer(token: Address, transfers: Array<{ to: Address; amount: bigint }>): this {
        for (const { to, amount } of transfers) {
            this.transfer(token, to, amount);
        }
        return this;
    }

    // ==========================================================================
    // ERC721 Helpers
    // ==========================================================================

    /**
     * ERC721 safeTransferFrom.
     */
    transferNFT(nft: Address, from: Address, to: Address, tokenId: bigint): this {
        return this.addCall({
            target: nft,
            abi: ERC721_ABI,
            functionName: 'safeTransferFrom',
            args: [from, to, tokenId],
        });
    }

    /**
     * ERC721 approve (single token).
     */
    approveNFT(nft: Address, to: Address, tokenId: bigint): this {
        return this.addCall({
            target: nft,
            abi: ERC721_ABI,
            functionName: 'approve',
            args: [to, tokenId],
        });
    }

    /**
     * ERC721 setApprovalForAll.
     */
    setApprovalForAll(nft: Address, operator: Address, approved: boolean): this {
        return this.addCall({
            target: nft,
            abi: ERC721_ABI,
            functionName: 'setApprovalForAll',
            args: [operator, approved],
        });
    }

    // ==========================================================================
    // WETH Helpers
    // ==========================================================================

    /**
     * Wrap ETH → WETH.
     * The value is sent as ETH and WETH is received in return.
     */
    wrapETH(wethAddress: Address = MEGAETH_TOKENS.WETH, amount: bigint): this {
        return this.addCall({
            target: wethAddress,
            abi: WETH_ABI,
            functionName: 'deposit',
            value: amount,
        });
    }

    /**
     * Unwrap WETH → ETH.
     */
    unwrapWETH(wethAddress: Address = MEGAETH_TOKENS.WETH, amount: bigint): this {
        return this.addCall({
            target: wethAddress,
            abi: WETH_ABI,
            functionName: 'withdraw',
            args: [amount],
        });
    }

    // ==========================================================================
    // DEX Helpers (Uniswap V2 interface — works with any V2-compatible DEX)
    // ==========================================================================

    /**
     * Token→Token swap via Uniswap V2 router interface.
     */
    swapExactTokensForTokens(params: SwapParams): this {
        return this.addCall({
            target: params.router,
            abi: UNISWAP_V2_ROUTER_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [
                params.amountIn,
                params.amountOutMin,
                params.path,
                params.to,
                params.deadline ?? deadlineInMinutes(5),
            ],
        });
    }

    /**
     * ETH→Token swap via Uniswap V2 router interface.
     */
    swapExactETHForTokens(params: Omit<SwapParams, 'amountIn'> & { amountIn: bigint }): this {
        return this.addCall({
            target: params.router,
            abi: UNISWAP_V2_ROUTER_ABI,
            functionName: 'swapExactETHForTokens',
            args: [
                params.amountOutMin,
                params.path,
                params.to,
                params.deadline ?? deadlineInMinutes(5),
            ],
            value: params.amountIn,
        });
    }

    /**
     * Token→ETH swap via Uniswap V2 router interface.
     */
    swapExactTokensForETH(params: SwapParams): this {
        return this.addCall({
            target: params.router,
            abi: UNISWAP_V2_ROUTER_ABI,
            functionName: 'swapExactTokensForETH',
            args: [
                params.amountIn,
                params.amountOutMin,
                params.path,
                params.to,
                params.deadline ?? deadlineInMinutes(5),
            ],
        });
    }

    /**
     * Approve a token and then swap in the same batch (2 calls, 1 tx).
     * This is the core "Sui-style composability" pattern.
     */
    approveAndSwap(params: ApproveAndSwapParams): this {
        return this.approve(params.token, params.router, params.amountIn).swapExactTokensForTokens(params);
    }

    // ==========================================================================
    // KyberSwap Integration (Best-Route Aggregator on MegaETH)
    // ==========================================================================

    /**
     * Add a KyberSwap aggregator swap call.
     * Fetches route and encodes the on-chain call automatically.
     *
     * @example
     * await builder.kyberSwap({
     *   tokenIn: USDC,
     *   tokenOut: WETH,
     *   amountIn: parseUnits('100', 6),
     *   slippageBps: 30, // 0.3%
     * }, senderAddress);
     */
    async kyberSwap(params: KyberQuoteParams, sender: Address): Promise<this> {
        const route = await getKyberQuote(params);
        const built = await buildKyberSwap({
            routeSummary: route,
            sender,
            recipient: sender,
            slippageBps: params.slippageBps,
        });

        return this.add(
            built.routerAddress,
            built.data as Hex,
            BigInt(built.value),
        );
    }

    // ==========================================================================
    // Utility Methods
    // ==========================================================================

    /** Get a copy of queued calls */
    getCalls(): readonly MegaCall[] {
        return [...this.calls];
    }

    /** Get recorded operations (for debugging/tracking) */
    getOperations(): readonly RecordedOperation[] {
        return [...this.operations];
    }

    /** Get full builder state (for serialization/debugging) */
    getState(): BuilderState {
        return {
            calls: [...this.calls],
            operations: [...this.operations],
            totalValue: this.getTotalValue(),
            chainId: this.chain.id,
        };
    }

    /** Clear all queued calls and operation history */
    clear(): this {
        this.calls = [];
        this.operations = [];
        return this;
    }

    /** Remove and return the last call */
    pop(): MegaCall | undefined {
        this.operations.pop();
        return this.calls.pop();
    }

    /** Total ETH value across all calls */
    getTotalValue(): bigint {
        return this.calls.reduce((sum, c) => sum + c.value, 0n);
    }

    /** Number of calls in the current batch */
    get length(): number {
        return this.calls.length;
    }

    /** Whether batch is empty */
    get isEmpty(): boolean {
        return this.calls.length === 0;
    }

    /** Whether a wallet is connected */
    get isConnected(): boolean {
        return !!this.walletClient?.account;
    }

    /** The connected account address (or undefined) */
    get account(): Address | undefined {
        return this.walletClient?.account?.address;
    }

    /**
     * Get a human-readable summary of the queued batch.
     * Great for logging/debugging before execution.
     */
    summary(): string {
        const lines = [
            `MegaFlow Batch (${this.calls.length} calls)`,
            `Chain: ${this.chain.name} (${this.chain.id})`,
            `Router: ${this.routerAddress}`,
            `Total Value: ${this.getTotalValue()} wei`,
            '',
            'Operations:',
        ];
        this.operations.forEach((op, i) => {
            const target = op.call.target.slice(0, 10) + '...';
            lines.push(`  ${i + 1}. ${op.type} → ${target}`);
        });
        return lines.join('\n');
    }

    // ==========================================================================
    // On-Chain Reads
    // ==========================================================================

    /** Read the protocol flat fee from the MegaRouter contract */
    async getFlatFee(): Promise<bigint> {
        return this.publicClient.readContract({
            address: this.routerAddress,
            abi: MEGA_ROUTER_ABI,
            functionName: 'flatFee',
        }) as Promise<bigint>;
    }

    /** Calculate total ETH required (sum of call values + flat fee) */
    async calculateRequiredETH(): Promise<bigint> {
        if (this.calls.length === 0) return 0n;
        return this.publicClient.readContract({
            address: this.routerAddress,
            abi: MEGA_ROUTER_ABI,
            functionName: 'calculateRequiredETH',
            args: [this.calls],
        }) as Promise<bigint>;
    }

    // ==========================================================================
    // Simulation (Dry Run)
    // ==========================================================================

    /**
     * Simulate the batch via eth_call — no state changes, no gas spent.
     * Very useful for pre-flight checks before submitting the real transaction.
     */
    async simulate(): Promise<MegaFlowSimulationResult> {
        assertCallsNotEmpty(this.calls);

        try {
            const requiredETH = await this.calculateRequiredETH();

            const { result } = await this.publicClient.simulateContract({
                address: this.routerAddress,
                abi: MEGA_ROUTER_ABI,
                functionName: 'executeBatch',
                args: [this.calls],
                value: requiredETH,
                account: this.walletClient?.account,
            });

            const gasEstimate = await this.publicClient.estimateContractGas({
                address: this.routerAddress,
                abi: MEGA_ROUTER_ABI,
                functionName: 'executeBatch',
                args: [this.calls],
                value: requiredETH,
                account: this.walletClient?.account,
            });

            return {
                success: true,
                results: result as MegaCallResult[],
                gasEstimate: applyMegaethGasBuffer(gasEstimate),
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const revertReason = decodeRevertError(errorMessage as `0x${string}`);
            const failedCallIndex = this.extractFailedCallIndex(errorMessage);

            this.log('Simulation failed', { error: errorMessage, failedCallIndex });

            return {
                success: false,
                error: errorMessage,
                revertReason,
                failedCallIndex,
            };
        }
    }

    // ==========================================================================
    // Execution — Standard (async)
    // ==========================================================================

    /**
     * Execute the batch using the standard async flow:
     * 1. Simulate to get request params
     * 2. walletClient.writeContract → txHash
     * 3. waitForTransactionReceipt
     *
     * On MegaETH this is still very fast (~100-200ms) due to 10ms blocks.
     * For true synchronous receipts use `executeSync()`.
     */
    async execute(options: ExecuteOptions = {}): Promise<MegaFlowExecutionResult> {
        assertCallsNotEmpty(this.calls);
        assertWalletConnected(this.walletClient);
        assertAccount(this.walletClient!);

        this.log('Executing batch', { callCount: this.calls.length });

        const requiredETH = await this.calculateRequiredETH();

        const { request } = await this.publicClient.simulateContract({
            address: this.routerAddress,
            abi: MEGA_ROUTER_ABI,
            functionName: 'executeBatch',
            args: [this.calls],
            value: requiredETH,
            account: this.walletClient!.account!,
            gas: options.gasLimit,
            maxFeePerGas: options.maxFeePerGas,
            maxPriorityFeePerGas: options.maxPriorityFeePerGas,
            nonce: options.nonce,
        });

        const hash = await this.walletClient!.writeContract(request as never);
        this.log('Transaction sent', { hash });

        const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
        this.log('Transaction confirmed', { status: receipt.status, gasUsed: receipt.gasUsed.toString() });

        const results = parseCallResults(receipt, this.calls.length);

        return {
            hash,
            receipt,
            results,
            gasUsed: receipt.gasUsed,
            effectiveGasPrice: receipt.effectiveGasPrice,
            totalCost: receipt.gasUsed * receipt.effectiveGasPrice,
        };
    }

    // ==========================================================================
    // Execution — Synchronous (MegaETH-specific, EIP-7966)
    // ==========================================================================

    /**
     * Execute using MegaETH's `eth_sendRawTransactionSync` (EIP-7966).
     * Returns the full receipt in one RPC round-trip (~10ms).
     *
     * This is the preferred method on MegaETH — no polling required.
     */
    async executeSync(options: ExecuteOptions = {}): Promise<MegaFlowSyncResult> {
        assertCallsNotEmpty(this.calls);
        assertWalletConnected(this.walletClient);
        assertAccount(this.walletClient!);

        const startTime = performance.now();
        this.log('Executing batch (sync)', { callCount: this.calls.length });

        const requiredETH = await this.calculateRequiredETH();

        // 1. Simulate to get the validated request
        const { request } = await this.publicClient.simulateContract({
            address: this.routerAddress,
            abi: MEGA_ROUTER_ABI,
            functionName: 'executeBatch',
            args: [this.calls],
            value: requiredETH,
            account: this.walletClient!.account!,
            gas: options.gasLimit,
        });

        // 2. Sign the raw transaction
        const signedTx = await this.walletClient!.signTransaction({
            ...request,
            account: this.walletClient!.account!,
        } as never);

        // 3. Send with MegaETH sync method → instant receipt
        const receipt = await this.publicClient.request({
            method: 'eth_sendRawTransactionSync' as never,
            params: [signedTx] as never,
        }) as TransactionReceipt;

        const executionTimeMs = performance.now() - startTime;
        this.log('Sync execution completed', { executionTimeMs: executionTimeMs.toFixed(2) });

        const results = parseCallResults(receipt, this.calls.length);

        return { receipt, results, gasUsed: receipt.gasUsed, executionTimeMs };
    }

    /**
     * Same as executeSync but uses `realtime_sendRawTransaction` (MegaETH original).
     * Both are functionally identical; use `executeSync` for cross-chain compatibility.
     */
    async executeRealtime(options: ExecuteOptions = {}): Promise<MegaFlowSyncResult> {
        assertCallsNotEmpty(this.calls);
        assertWalletConnected(this.walletClient);
        assertAccount(this.walletClient!);

        const startTime = performance.now();
        const requiredETH = await this.calculateRequiredETH();

        const { request } = await this.publicClient.simulateContract({
            address: this.routerAddress,
            abi: MEGA_ROUTER_ABI,
            functionName: 'executeBatch',
            args: [this.calls],
            value: requiredETH,
            account: this.walletClient!.account!,
            gas: options.gasLimit,
        });

        const signedTx = await this.walletClient!.signTransaction({
            ...request,
            account: this.walletClient!.account!,
        } as never);

        const receipt = await this.publicClient.request({
            method: 'realtime_sendRawTransaction' as never,
            params: [signedTx] as never,
        }) as TransactionReceipt;

        const executionTimeMs = performance.now() - startTime;
        const results = parseCallResults(receipt, this.calls.length);
        return { receipt, results, gasUsed: receipt.gasUsed, executionTimeMs };
    }

    // ==========================================================================
    // Private Helpers
    // ==========================================================================

    private recordOperation(
        type: OperationType,
        call: MegaCall,
        metadata?: Record<string, unknown>,
    ): void {
        this.operations.push({
            type,
            call,
            metadata,
            timestamp: Date.now(),
        });
    }

    private extractFailedCallIndex(errorMessage: string): number | undefined {
        const match = errorMessage.match(/CallFailed\((\d+)/);
        if (match) return parseInt(match[1], 10);
        const indexMatch = errorMessage.match(/call\s*#?\s*(\d+)/i);
        if (indexMatch) return parseInt(indexMatch[1], 10);
        return undefined;
    }

    private log(message: string, data?: Record<string, unknown>): void {
        if (this.debug) {
            console.log(`[MegaFlow] ${message}`, data ?? '');
        }
    }
}
