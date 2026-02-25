import { Chain, Address, Hex, Hash, TransactionReceipt, PublicClient, WalletClient, Account } from 'viem';

/**
 * MegaETH Chain Definitions
 *
 * Source: https://docs.megaeth.com / megaeth-ai-developer-skills
 * Chain IDs verified from official wallet-operations.md docs.
 */

/**
 * MegaETH Mainnet
 * Chain ID: 4326
 * RPC: https://mainnet.megaeth.com/rpc
 */
declare const megaethMainnet: {
    readonly id: 4326;
    readonly name: "MegaETH Mainnet";
    readonly nativeCurrency: {
        readonly decimals: 18;
        readonly name: "Ether";
        readonly symbol: "ETH";
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://mainnet.megaeth.com/rpc"];
            readonly webSocket: readonly ["wss://mainnet.megaeth.com/ws"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "MegaETH Explorer";
            readonly url: "https://mega.etherscan.io";
        };
    };
};
/**
 * MegaETH Testnet (Carrot)
 * Chain ID: 6343
 * RPC: https://carrot.megaeth.com/rpc
 */
declare const megaethTestnet: {
    readonly id: 6343;
    readonly name: "MegaETH Testnet";
    readonly nativeCurrency: {
        readonly decimals: 18;
        readonly name: "Ether";
        readonly symbol: "ETH";
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://carrot.megaeth.com/rpc"];
            readonly webSocket: readonly ["wss://carrot.megaeth.com/ws"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "MegaETH Testnet Explorer";
            readonly url: "https://megaeth-testnet-v2.blockscout.com";
        };
    };
    readonly testnet: true;
};
/** All supported MegaETH chains */
declare const megaethChains: readonly [{
    readonly id: 4326;
    readonly name: "MegaETH Mainnet";
    readonly nativeCurrency: {
        readonly decimals: 18;
        readonly name: "Ether";
        readonly symbol: "ETH";
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://mainnet.megaeth.com/rpc"];
            readonly webSocket: readonly ["wss://mainnet.megaeth.com/ws"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "MegaETH Explorer";
            readonly url: "https://mega.etherscan.io";
        };
    };
}, {
    readonly id: 6343;
    readonly name: "MegaETH Testnet";
    readonly nativeCurrency: {
        readonly decimals: 18;
        readonly name: "Ether";
        readonly symbol: "ETH";
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://carrot.megaeth.com/rpc"];
            readonly webSocket: readonly ["wss://carrot.megaeth.com/ws"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "MegaETH Testnet Explorer";
            readonly url: "https://megaeth-testnet-v2.blockscout.com";
        };
    };
    readonly testnet: true;
}];
/** Chain ID → Chain lookup */
declare const chainById: Record<number, Chain>;

/**
 * MegaFlow SDK Types
 */

/**
 * A single call operation in a batch.
 * Mirrors the `Call` struct in MegaRouter.sol.
 */
interface MegaCall {
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
interface MegaCallResult {
    /** Whether the call succeeded */
    success: boolean;
    /** Raw bytes returned from the call */
    returnData: Hex;
}
/** Full result after executing a batch (standard async flow) */
interface MegaFlowExecutionResult {
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
interface MegaFlowSyncResult {
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
interface MegaFlowSimulationResult {
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
/** Options for execute() and executeSync() */
interface ExecuteOptions {
    /** Gas limit override */
    gasLimit?: bigint;
    /** Max fee per gas override */
    maxFeePerGas?: bigint;
    /** Max priority fee override */
    maxPriorityFeePerGas?: bigint;
    /** Nonce override */
    nonce?: number;
}
/** Configuration for creating a MegaFlowBuilder */
interface MegaFlowConfig {
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
interface MegaFlowClientConfig extends MegaFlowConfig {
    /** Pre-configured viem PublicClient (optional) */
    publicClient?: PublicClient;
    /** Pre-configured viem WalletClient (optional) */
    walletClient?: WalletClient;
}
interface SwapParams {
    router: Address;
    amountIn: bigint;
    amountOutMin: bigint;
    path: Address[];
    to: Address;
    deadline?: bigint;
}
interface ApproveAndSwapParams extends SwapParams {
    token: Address;
    /** Current on-chain allowance (for safe approve pattern) */
    currentAllowance?: bigint;
}
interface TransferParams {
    token: Address;
    to: Address;
    amount: bigint;
}
interface KyberQuoteParams {
    tokenIn: Address | 'ETH';
    tokenOut: Address | 'ETH';
    amountIn: bigint;
    /** Slippage in basis points (e.g. 50 = 0.5%) */
    slippageBps?: number;
}
interface KyberRouteSummary {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    gas: string;
    route: unknown[];
    [key: string]: unknown;
}
interface KyberBuildResult {
    routerAddress: Address;
    data: Hex;
    value: string;
    gas: string;
}
interface BatchExecutedEvent {
    sender: Address;
    callCount: bigint;
    totalValue: bigint;
    blockNumber: bigint;
    transactionHash: Hex;
}
interface CallExecutedEvent {
    callIndex: bigint;
    target: Address;
    value: bigint;
    success: boolean;
    blockNumber: bigint;
    transactionHash: Hex;
}
type OperationType = 'transfer' | 'approve' | 'safeApprove' | 'swap' | 'wrap' | 'unwrap' | 'kyberSwap' | 'nftTransfer' | 'custom';
interface RecordedOperation {
    readonly type: OperationType;
    readonly call: MegaCall;
    readonly metadata?: Record<string, unknown>;
    readonly timestamp: number;
}
interface BuilderState {
    readonly calls: readonly MegaCall[];
    readonly operations: readonly RecordedOperation[];
    readonly totalValue: bigint;
    readonly chainId: number;
}
interface BalanceCheck {
    token: Address | 'ETH';
    required: bigint;
    available: bigint;
    sufficient: boolean;
}
interface PreflightResult {
    valid: boolean;
    simulation: MegaFlowSimulationResult;
    balanceChecks: BalanceCheck[];
    estimatedGas: bigint;
    estimatedCost: bigint;
    warnings: string[];
    errors: string[];
}
type MegaFlowErrorCode = 'EMPTY_BATCH' | 'WALLET_NOT_CONNECTED' | 'NO_ACCOUNT' | 'SIMULATION_FAILED' | 'EXECUTION_FAILED' | 'INSUFFICIENT_BALANCE' | 'INSUFFICIENT_ALLOWANCE' | 'KYBER_API_ERROR' | 'NETWORK_ERROR' | 'USER_REJECTED' | 'TIMEOUT';

/**
 * MegaFlow SDK Constants & ABIs
 */
/**
 * Full ABI for the MegaRouter.sol contract.
 * Keep in sync with contracts/src/MegaRouter.sol
 */
declare const MEGA_ROUTER_ABI: readonly [{
    readonly name: "executeBatch";
    readonly type: "function";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly type: "address";
            readonly name: "target";
        }, {
            readonly type: "uint256";
            readonly name: "value";
        }, {
            readonly type: "bytes";
            readonly name: "callData";
        }];
        readonly name: "calls";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly type: "bool";
            readonly name: "success";
        }, {
            readonly type: "bytes";
            readonly name: "returnData";
        }];
        readonly name: "results";
    }];
}, {
    readonly name: "executeBatchWithOutput";
    readonly type: "function";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly type: "address";
            readonly name: "target";
        }, {
            readonly type: "uint256";
            readonly name: "value";
        }, {
            readonly type: "bytes";
            readonly name: "callData";
        }];
        readonly name: "calls";
    }, {
        readonly type: "uint256";
        readonly name: "outputCallIndex";
    }, {
        readonly type: "uint256";
        readonly name: "outputOffset";
    }, {
        readonly type: "uint256";
        readonly name: "outputLength";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly type: "bool";
            readonly name: "success";
        }, {
            readonly type: "bytes";
            readonly name: "returnData";
        }];
        readonly name: "results";
    }, {
        readonly type: "bytes";
        readonly name: "extractedOutput";
    }];
}, {
    readonly name: "calculateRequiredETH";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly type: "address";
            readonly name: "target";
        }, {
            readonly type: "uint256";
            readonly name: "value";
        }, {
            readonly type: "bytes";
            readonly name: "callData";
        }];
        readonly name: "calls";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "flatFee";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "feeCollector";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "BatchExecuted";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "sender";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "callCount";
    }, {
        readonly type: "uint256";
        readonly name: "totalValue";
    }];
}, {
    readonly name: "CallExecuted";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "callIndex";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "target";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "value";
    }, {
        readonly type: "bool";
        readonly name: "success";
    }];
}, {
    readonly name: "ReentrancyGuard";
    readonly type: "error";
    readonly inputs: readonly [];
}, {
    readonly name: "InsufficientETH";
    readonly type: "error";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "required";
    }, {
        readonly type: "uint256";
        readonly name: "provided";
    }];
}, {
    readonly name: "InvalidTarget";
    readonly type: "error";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "callIndex";
    }];
}, {
    readonly name: "EmptyCalldata";
    readonly type: "error";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "callIndex";
    }];
}, {
    readonly name: "CallFailed";
    readonly type: "error";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "callIndex";
    }, {
        readonly type: "bytes";
        readonly name: "returnData";
    }];
}, {
    readonly name: "FeeTransferFailed";
    readonly type: "error";
    readonly inputs: readonly [];
}, {
    readonly name: "SweepFailed";
    readonly type: "error";
    readonly inputs: readonly [];
}];
declare const ERC20_ABI: readonly [{
    readonly name: "name";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "symbol";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "decimals";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint8";
    }];
}, {
    readonly name: "totalSupply";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "balanceOf";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "account";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "allowance";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "owner";
    }, {
        readonly type: "address";
        readonly name: "spender";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "transfer";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly name: "transferFrom";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "from";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly name: "approve";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "spender";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly name: "Transfer";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "from";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "to";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "value";
    }];
}, {
    readonly name: "Approval";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "owner";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "spender";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "value";
    }];
}];
declare const ERC721_ABI: readonly [{
    readonly name: "name";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "symbol";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "tokenURI";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "ownerOf";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "balanceOf";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "owner";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "isApprovedForAll";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "owner";
    }, {
        readonly type: "address";
        readonly name: "operator";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly name: "getApproved";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "transferFrom";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "from";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "safeTransferFrom";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "from";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "approve";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "setApprovalForAll";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "operator";
    }, {
        readonly type: "bool";
        readonly name: "approved";
    }];
    readonly outputs: readonly [];
}];
declare const UNISWAP_V2_ROUTER_ABI: readonly [{
    readonly name: "factory";
    readonly type: "function";
    readonly stateMutability: "pure";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "WETH";
    readonly type: "function";
    readonly stateMutability: "pure";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "swapExactTokensForTokens";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly name: "amountOutMin";
        readonly type: "uint256";
    }, {
        readonly type: "address[]";
        readonly name: "path";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "swapTokensForExactTokens";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }, {
        readonly name: "amountInMax";
        readonly type: "uint256";
    }, {
        readonly type: "address[]";
        readonly name: "path";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "swapExactETHForTokens";
    readonly type: "function";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "amountOutMin";
        readonly type: "uint256";
    }, {
        readonly type: "address[]";
        readonly name: "path";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "swapExactTokensForETH";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly name: "amountOutMin";
        readonly type: "uint256";
    }, {
        readonly type: "address[]";
        readonly name: "path";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "swapETHForExactTokens";
    readonly type: "function";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }, {
        readonly type: "address[]";
        readonly name: "path";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "getAmountsOut";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "amountIn";
        readonly type: "uint256";
    }, {
        readonly type: "address[]";
        readonly name: "path";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "getAmountsIn";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "amountOut";
        readonly type: "uint256";
    }, {
        readonly type: "address[]";
        readonly name: "path";
    }];
    readonly outputs: readonly [{
        readonly name: "amounts";
        readonly type: "uint256[]";
    }];
}, {
    readonly name: "addLiquidity";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "tokenA";
    }, {
        readonly type: "address";
        readonly name: "tokenB";
    }, {
        readonly name: "amountADesired";
        readonly type: "uint256";
    }, {
        readonly name: "amountBDesired";
        readonly type: "uint256";
    }, {
        readonly name: "amountAMin";
        readonly type: "uint256";
    }, {
        readonly name: "amountBMin";
        readonly type: "uint256";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amountA";
        readonly type: "uint256";
    }, {
        readonly name: "amountB";
        readonly type: "uint256";
    }, {
        readonly name: "liquidity";
        readonly type: "uint256";
    }];
}, {
    readonly name: "removeLiquidity";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "tokenA";
    }, {
        readonly type: "address";
        readonly name: "tokenB";
    }, {
        readonly name: "liquidity";
        readonly type: "uint256";
    }, {
        readonly name: "amountAMin";
        readonly type: "uint256";
    }, {
        readonly name: "amountBMin";
        readonly type: "uint256";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly name: "deadline";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "amountA";
        readonly type: "uint256";
    }, {
        readonly name: "amountB";
        readonly type: "uint256";
    }];
}];
declare const WETH_ABI: readonly [{
    readonly name: "name";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "symbol";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "decimals";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint8";
    }];
}, {
    readonly name: "totalSupply";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "balanceOf";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "account";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "allowance";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "owner";
    }, {
        readonly type: "address";
        readonly name: "spender";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "transfer";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly name: "transferFrom";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "from";
    }, {
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly name: "approve";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "spender";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly name: "deposit";
    readonly type: "function";
    readonly stateMutability: "payable";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
}, {
    readonly name: "withdraw";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "wad";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "Transfer";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "from";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "to";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "value";
    }];
}, {
    readonly name: "Approval";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "owner";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "spender";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "value";
    }];
}];
/**
 * Known MegaETH gas limits for common operations.
 * MegaETH intrinsic gas is 60,000 (not 21,000 like Ethereum!).
 * Source: gas-model.md
 */
declare const MEGAETH_GAS_LIMITS: {
    /** Simple ETH transfer — 60k on MegaETH, not 21k */
    readonly TRANSFER: 60000n;
    /** ERC20 transfer */
    readonly ERC20_TRANSFER: 100000n;
    /** ERC20 approve */
    readonly ERC20_APPROVE: 80000n;
    /** DEX swap */
    readonly SWAP: 350000n;
};
/** MegaETH stable base fee in wei (0.001 gwei) */
declare const MEGAETH_BASE_FEE = 1000000n;
declare const MEGAETH_TOKENS: {
    /** Wrapped ETH */
    WETH: "0x4200000000000000000000000000000000000006";
    /** MEGA governance token */
    MEGA: "0x28B7E77f82B25B95953825F1E3eA0E36c1c29861";
    /** USDM stablecoin */
    USDM: "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7";
};
/**
 * MegaETH L1 bridge contract (on Ethereum mainnet).
 * Send ETH here to bridge to MegaETH.
 */
declare const MEGAETH_L1_BRIDGE: "0x0CA3A2FBC3D770b578223FBB6b062fa875a2eE75";
/**
 * KyberSwap Aggregator API base URL for MegaETH.
 * Source: wallet-operations.md
 */
declare const KYBERSWAP_API_BASE: "https://aggregator-api.kyberswap.com/megaeth/api/v1";

/**
 * MegaFlow Utility Functions
 */

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
declare function parseCallResults(receipt: TransactionReceipt, callCount: number, rawReturnData?: Hex): MegaCallResult[];
/**
 * Parse the `BatchExecuted` event from a transaction receipt.
 */
declare function parseBatchExecutedEvent(receipt: TransactionReceipt): BatchExecutedEvent | null;
/**
 * Parse all `CallExecuted` events from a receipt.
 */
declare function parseCallExecutedEvents(receipt: TransactionReceipt): CallExecutedEvent[];
/**
 * Apply MegaETH gas buffer.
 * MegaETH opcode costs differ from standard EVM.
 * Uses 10% buffer by default (viem's default 20% is too aggressive for MegaETH).
 */
declare function applyMegaethGasBuffer(estimate: bigint, bufferPct?: number): bigint;
/**
 * Encode deadline as a unix timestamp (seconds) n minutes from now.
 */
declare function deadlineInMinutes(minutes: number): bigint;
/**
 * Build the MegaCall(s) for a safe ERC20 approve.
 * Uses the "approve(0) → approve(amount)" pattern to avoid race conditions
 * required by tokens like USDT that revert on non-zero → non-zero approve.
 */
declare function buildSafeApproveCalls(params: {
    token: Address;
    spender: Address;
    amount: bigint;
    currentAllowance: bigint;
}): MegaCall[];
/**
 * Fetch a swap quote from KyberSwap Aggregator for MegaETH.
 */
declare function getKyberQuote(params: KyberQuoteParams): Promise<KyberRouteSummary>;
/**
 * Build a KyberSwap transaction for on-chain submission.
 */
declare function buildKyberSwap(params: {
    routeSummary: KyberRouteSummary;
    sender: Address;
    recipient: Address;
    slippageBps?: number;
}): Promise<KyberBuildResult>;
/**
 * Check if error is a user rejection (MetaMask etc.)
 */
declare function isUserRejection(error: unknown): boolean;
/**
 * Validate Ethereum address format
 */
declare function isValidAddress(address: string): address is Address;
/**
 * Validate hex string format
 */
declare function isValidHex(hex: string): hex is Hex;
/**
 * Split calls into chunks (for very large batches that may exceed gas limits)
 */
declare function chunkCalls<T>(calls: T[], maxPerBatch?: number): T[][];
/**
 * Calculate total ETH value across a set of calls
 */
declare function calculateTotalValue(calls: Array<{
    value: bigint;
}>): bigint;
/**
 * Typed SDK error with an error code for programmatic handling.
 */
declare class MegaFlowError extends Error {
    readonly code: MegaFlowErrorCode;
    readonly cause?: unknown | undefined;
    constructor(message: string, code: MegaFlowErrorCode, cause?: unknown | undefined);
}

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

declare class MegaFlowBuilder {
    protected calls: MegaCall[];
    protected operations: RecordedOperation[];
    protected publicClient: PublicClient;
    protected walletClient?: WalletClient;
    protected routerAddress: Address;
    protected chain: Chain;
    protected readonly debug: boolean;
    constructor(config?: MegaFlowConfig);
    /**
     * Connect a pre-built viem WalletClient.
     */
    connect(walletClient: WalletClient): this;
    /**
     * Connect using a viem Account object.
     * Creates an internal WalletClient bound to MegaETH's chain/RPC.
     */
    connectWithAccount(account: Account, rpcUrl?: string): this;
    /**
     * Disconnect the wallet (for cleanup).
     */
    disconnect(): this;
    /**
     * Add a raw call (pre-encoded calldata).
     */
    add(target: Address, callData: Hex, value?: bigint): this;
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
    }): this;
    /**
     * Send native ETH to an address.
     * Uses a minimal `receive()` call (empty calldata is not allowed by MegaRouter,
     * so we send a 1-byte noop that any contract with a `receive()` will handle).
     */
    sendETH(to: Address, value: bigint): this;
    /**
     * ERC20 approve.
     * Uses the simple single-approve pattern.
     * For safe two-step approve, use `safeApprove()`.
     */
    approve(token: Address, spender: Address, amount: bigint): this;
    /**
     * Safe ERC20 approve — resets allowance to 0 first if non-zero,
     * then sets the new amount. Prevents ERC20 approval race conditions
     * (required by some tokens like USDT).
     *
     * @param currentAllowance Current on-chain allowance. Pass 0n if unknown and you want a single approve.
     */
    safeApprove(token: Address, spender: Address, amount: bigint, currentAllowance: bigint): this;
    /**
     * ERC20 transfer.
     */
    transfer(token: Address, to: Address, amount: bigint): this;
    /**
     * ERC20 transferFrom.
     */
    transferFrom(token: Address, from: Address, to: Address, amount: bigint): this;
    /**
     * Batch transfer same token to multiple recipients in one batch.
     * @example .multiTransfer(USDC, [{ to: addr1, amount: 100n }, { to: addr2, amount: 200n }])
     */
    multiTransfer(token: Address, transfers: Array<{
        to: Address;
        amount: bigint;
    }>): this;
    /**
     * ERC721 safeTransferFrom.
     */
    transferNFT(nft: Address, from: Address, to: Address, tokenId: bigint): this;
    /**
     * ERC721 approve (single token).
     */
    approveNFT(nft: Address, to: Address, tokenId: bigint): this;
    /**
     * ERC721 setApprovalForAll.
     */
    setApprovalForAll(nft: Address, operator: Address, approved: boolean): this;
    /**
     * Wrap ETH → WETH.
     * The value is sent as ETH and WETH is received in return.
     */
    wrapETH(wethAddress: Address | undefined, amount: bigint): this;
    /**
     * Unwrap WETH → ETH.
     */
    unwrapWETH(wethAddress: Address | undefined, amount: bigint): this;
    /**
     * Token→Token swap via Uniswap V2 router interface.
     */
    swapExactTokensForTokens(params: SwapParams): this;
    /**
     * ETH→Token swap via Uniswap V2 router interface.
     */
    swapExactETHForTokens(params: Omit<SwapParams, 'amountIn'> & {
        amountIn: bigint;
    }): this;
    /**
     * Token→ETH swap via Uniswap V2 router interface.
     */
    swapExactTokensForETH(params: SwapParams): this;
    /**
     * Approve a token and then swap in the same batch (2 calls, 1 tx).
     * This is the core "Sui-style composability" pattern.
     */
    approveAndSwap(params: ApproveAndSwapParams): this;
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
    kyberSwap(params: KyberQuoteParams, sender: Address): Promise<this>;
    /** Get a copy of queued calls */
    getCalls(): readonly MegaCall[];
    /** Get recorded operations (for debugging/tracking) */
    getOperations(): readonly RecordedOperation[];
    /** Get full builder state (for serialization/debugging) */
    getState(): BuilderState;
    /** Clear all queued calls and operation history */
    clear(): this;
    /** Remove and return the last call */
    pop(): MegaCall | undefined;
    /** Total ETH value across all calls */
    getTotalValue(): bigint;
    /** Number of calls in the current batch */
    get length(): number;
    /** Whether batch is empty */
    get isEmpty(): boolean;
    /** Whether a wallet is connected */
    get isConnected(): boolean;
    /** The connected account address (or undefined) */
    get account(): Address | undefined;
    /**
     * Get a human-readable summary of the queued batch.
     * Great for logging/debugging before execution.
     */
    summary(): string;
    /** Read the protocol flat fee from the MegaRouter contract */
    getFlatFee(): Promise<bigint>;
    /** Calculate total ETH required (sum of call values + flat fee) */
    calculateRequiredETH(): Promise<bigint>;
    /**
     * Simulate the batch via eth_call — no state changes, no gas spent.
     * Very useful for pre-flight checks before submitting the real transaction.
     */
    simulate(): Promise<MegaFlowSimulationResult>;
    /**
     * Execute the batch using the standard async flow:
     * 1. Simulate to get request params
     * 2. walletClient.writeContract → txHash
     * 3. waitForTransactionReceipt
     *
     * On MegaETH this is still very fast (~100-200ms) due to 10ms blocks.
     * For true synchronous receipts use `executeSync()`.
     */
    execute(options?: ExecuteOptions): Promise<MegaFlowExecutionResult>;
    /**
     * Execute using MegaETH's `eth_sendRawTransactionSync` (EIP-7966).
     * Returns the full receipt in one RPC round-trip (~10ms).
     *
     * This is the preferred method on MegaETH — no polling required.
     */
    executeSync(options?: ExecuteOptions): Promise<MegaFlowSyncResult>;
    /**
     * Same as executeSync but uses `realtime_sendRawTransaction` (MegaETH original).
     * Both are functionally identical; use `executeSync` for cross-chain compatibility.
     */
    executeRealtime(options?: ExecuteOptions): Promise<MegaFlowSyncResult>;
    private recordOperation;
    private extractFailedCallIndex;
    private log;
}

/**
 * MegaFlowClient — High-level stateful client for MegaETH
 *
 * Wraps MegaFlowBuilder with:
 * - Automatic nonce management for rapid sequential transactions
 * - WebSocket support for lower latency
 * - ERC20 balance/allowance reads
 * - Multicall token state fetching
 *
 * @example
 * ```typescript
 * import { MegaFlowClient } from '@megaflow-labs/sdk';
 * import { privateKeyToAccount } from 'viem/accounts';
 *
 * const account = privateKeyToAccount('0x...');
 *
 * // Zero-config: uses MegaETH Mainnet by default
 * const client = new MegaFlowClient().connectWithAccount(account);
 *
 * // Read state
 * const balance = await client.getTokenBalance(USDC, account.address);
 * const allowance = await client.getAllowance(USDC, account.address, DEX_ROUTER);
 *
 * // Build + execute in one call
 * const result = await client.batch()
 *   .safeApprove(USDC, DEX_ROUTER, amountIn, allowance)
 *   .swapExactTokensForTokens({ ... })
 *   .executeSync(); // instant receipt on MegaETH
 * ```
 */

declare class MegaFlowClient {
    private config;
    protected publicClient: PublicClient;
    protected walletClient?: WalletClient;
    private wsClient?;
    private nonceCache;
    constructor(config?: MegaFlowClientConfig);
    connectWithAccount(account: Account, rpcUrl?: string): this;
    connect(walletClient: WalletClient): this;
    /**
     * Enable a WebSocket client for lower latency.
     * WebSocket is 5-6x faster than HTTP on MegaETH.
     *
     * Requires the chain to have a webSocket URL configured.
     */
    enableWebSocket(wsUrl?: string): this;
    /** Active public client (prefers WebSocket when enabled) */
    get activeClient(): PublicClient;
    /**
     * Create a new MegaFlowBuilder linked to this client's configuration.
     * Start building calls, then call `.execute()` or `.executeSync()`.
     */
    batch(): MegaFlowBuilder;
    /**
     * Get the native ETH balance of an address.
     */
    getETHBalance(address: Address): Promise<bigint>;
    /**
     * Get the ERC20 token balance of an address.
     */
    getTokenBalance(token: Address, owner: Address): Promise<bigint>;
    /**
     * Get the current ERC20 allowance.
     */
    getAllowance(token: Address, owner: Address, spender: Address): Promise<bigint>;
    /**
     * Get multiple token balances in a single multicall.
     * Much faster than sequential calls on MegaETH (v2.0.14+).
     */
    getMultipleBalances(tokens: Address[], owner: Address): Promise<{
        token: Address;
        balance: bigint;
    }[]>;
    /**
     * Get token metadata (name, symbol, decimals) in a single multicall round-trip.
     */
    getTokenInfo(token: Address): Promise<{
        name: string;
        symbol: string;
        decimals: number;
        totalSupply: bigint;
    }>;
    /** Get protocol flat fee from the deployed router */
    getFlatFee(): Promise<bigint>;
    /** Get fee collector address from the deployed router */
    getFeeCollector(): Promise<Address>;
    /**
     * Get the next usable nonce for an address, respecting locally tracked nonces.
     *
     * Critical for MegaETH: 10ms blocks mean sequential txs can race.
     * Local nonce tracking prevents "already known" / "nonce too low" errors.
     */
    getNextNonce(address: Address): Promise<number>;
    /** Reset locally cached nonce for an address (call after a tx confirms or fails). */
    resetNonce(address: Address): void;
    /**
     * Get the current gas price from MegaETH RPC.
     * Returns the raw value (avoids viem's 20% buffer).
     */
    getGasPrice(): Promise<bigint>;
    /**
     * Bridge ETH from Ethereum mainnet to MegaETH.
     *
     * NOTE: This must be called from an Ethereum mainnet wallet client,
     * not the MegaETH wallet client.
     *
     * @param l1WalletClient - Ethereum mainnet wallet client
     * @param amount - Amount in wei to bridge
     */
    bridgeETHToMegaETH(l1WalletClient: WalletClient, amount: bigint): Promise<Hex>;
    get isConnected(): boolean;
    get account(): Address | undefined;
    get routerAddress(): Address;
}

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

/**
 * Create a MegaFlowBuilder with the given config.
 */
declare function createMegaFlow(config: MegaFlowConfig): MegaFlowBuilder;
/**
 * Create a MegaFlowClient with the given config.
 */
declare function createMegaFlowClient(config: MegaFlowClientConfig): MegaFlowClient;
/**
 * Quick builder for MegaETH Mainnet.
 */
declare function createMegaFlowMainnet(routerAddress: Address): MegaFlowBuilder;
/**
 * Quick builder for MegaETH Testnet (Carrot).
 */
declare function createMegaFlowTestnet(routerAddress: Address): MegaFlowBuilder;
/**
 * Quick full client for MegaETH Mainnet.
 */
declare function createMegaFlowClientMainnet(routerAddress: Address, rpcUrl?: string): MegaFlowClient;
/**
 * Quick full client for MegaETH Testnet (Carrot).
 */
declare function createMegaFlowClientTestnet(routerAddress: Address, rpcUrl?: string): MegaFlowClient;

export { type ApproveAndSwapParams, type BalanceCheck, type BatchExecutedEvent, type BuilderState, type CallExecutedEvent, ERC20_ABI, ERC721_ABI, type ExecuteOptions, KYBERSWAP_API_BASE, type KyberBuildResult, type KyberQuoteParams, type KyberRouteSummary, MEGAETH_BASE_FEE, MEGAETH_GAS_LIMITS, MEGAETH_L1_BRIDGE, MEGAETH_TOKENS, MEGA_ROUTER_ABI, type MegaCall, type MegaCallResult, MegaFlowBuilder, MegaFlowClient, type MegaFlowClientConfig, type MegaFlowConfig, MegaFlowError, type MegaFlowErrorCode, type MegaFlowExecutionResult, type MegaFlowSimulationResult, type MegaFlowSyncResult, type OperationType, type PreflightResult, type RecordedOperation, type SwapParams, type TransferParams, UNISWAP_V2_ROUTER_ABI, WETH_ABI, applyMegaethGasBuffer, buildKyberSwap, buildSafeApproveCalls, calculateTotalValue, chainById, chunkCalls, createMegaFlow, createMegaFlowClient, createMegaFlowClientMainnet, createMegaFlowClientTestnet, createMegaFlowMainnet, createMegaFlowTestnet, deadlineInMinutes, getKyberQuote, isUserRejection, isValidAddress, isValidHex, megaethChains, megaethMainnet, megaethTestnet, parseBatchExecutedEvent, parseCallExecutedEvents, parseCallResults };
