// src/chains.ts
var megaethMainnet = {
  id: 4326,
  name: "MegaETH Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.megaeth.com/rpc"],
      webSocket: ["wss://mainnet.megaeth.com/ws"]
    }
  },
  blockExplorers: {
    default: {
      name: "MegaETH Explorer",
      url: "https://mega.etherscan.io"
    }
  }
};
var megaethTestnet = {
  id: 6343,
  name: "MegaETH Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: ["https://carrot.megaeth.com/rpc"],
      webSocket: ["wss://carrot.megaeth.com/ws"]
    }
  },
  blockExplorers: {
    default: {
      name: "MegaETH Testnet Explorer",
      url: "https://megaeth-testnet-v2.blockscout.com"
    }
  },
  testnet: true
};
var megaethChains = [megaethMainnet, megaethTestnet];
var chainById = {
  [megaethMainnet.id]: megaethMainnet,
  [megaethTestnet.id]: megaethTestnet
};

// src/constants.ts
import { parseAbi } from "viem";
var MEGA_ROUTER_ABI = parseAbi([
  // Core batch execution
  "function executeBatch((address target, uint256 value, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] results)",
  "function executeBatchWithOutput((address target, uint256 value, bytes callData)[] calls, uint256 outputCallIndex, uint256 outputOffset, uint256 outputLength) payable returns ((bool success, bytes returnData)[] results, bytes extractedOutput)",
  // View helpers
  "function calculateRequiredETH((address target, uint256 value, bytes callData)[] calls) view returns (uint256)",
  "function flatFee() view returns (uint256)",
  "function feeCollector() view returns (address)",
  // Events
  "event BatchExecuted(address indexed sender, uint256 callCount, uint256 totalValue)",
  "event CallExecuted(uint256 indexed callIndex, address indexed target, uint256 value, bool success)",
  // Errors (for decoding reverts)
  "error ReentrancyGuard()",
  "error InsufficientETH(uint256 required, uint256 provided)",
  "error InvalidTarget(uint256 callIndex)",
  "error EmptyCalldata(uint256 callIndex)",
  "error CallFailed(uint256 callIndex, bytes returnData)",
  "error FeeTransferFailed()",
  "error SweepFailed()"
]);
var ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]);
var ERC721_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)"
]);
var UNISWAP_V2_ROUTER_ABI = parseAbi([
  "function factory() pure returns (address)",
  "function WETH() pure returns (address)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] path, address to, uint deadline) returns (uint[] amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] path, address to, uint deadline) payable returns (uint[] amounts)",
  "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)",
  "function getAmountsIn(uint amountOut, address[] path) view returns (uint[] amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)"
]);
var WETH_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function deposit() payable",
  "function withdraw(uint256 wad)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]);
var MEGAETH_GAS_LIMITS = {
  /** Simple ETH transfer — 60k on MegaETH, not 21k */
  TRANSFER: 60000n,
  /** ERC20 transfer */
  ERC20_TRANSFER: 100000n,
  /** ERC20 approve */
  ERC20_APPROVE: 80000n,
  /** DEX swap */
  SWAP: 350000n
};
var MEGAETH_BASE_FEE = 1000000n;
var MAINNET_ROUTER_ADDRESS = "0x9c1528e7688ee7122781dc8ed05686383b763ccb";
var MEGAETH_TOKENS = {
  /** Wrapped ETH */
  WETH: "0x4200000000000000000000000000000000000006",
  /** MEGA governance token */
  MEGA: "0x28B7E77f82B25B95953825F1E3eA0E36c1c29861",
  /** USDM stablecoin */
  USDM: "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7"
};
var MEGAETH_L1_BRIDGE = "0x0CA3A2FBC3D770b578223FBB6b062fa875a2eE75";
var KYBERSWAP_API_BASE = "https://aggregator-api.kyberswap.com/megaeth/api/v1";

// src/utils.ts
import {
  decodeEventLog,
  decodeAbiParameters
} from "viem";
function decodeRevertError(returnData) {
  if (!returnData || returnData === "0x" || returnData.length < 10) {
    return "Execution reverted with no data";
  }
  const selector = returnData.slice(0, 10).toLowerCase();
  if (selector === "0x08c379a0") {
    try {
      const [message] = decodeAbiParameters(
        [{ type: "string" }],
        `0x${returnData.slice(10)}`
      );
      return `Reverted: ${message}`;
    } catch {
      return `Reverted (Error selector found but decode failed)`;
    }
  }
  if (selector === "0x4e487b71") {
    try {
      const [code] = decodeAbiParameters(
        [{ type: "uint256" }],
        `0x${returnData.slice(10)}`
      );
      return `Panic: ${decodePanicCode(Number(code))}`;
    } catch {
      return "Panic: unknown code";
    }
  }
  const customErrors = {
    "0x3e3f8f73": "ReentrancyGuard: re-entrant call",
    "0xfe9ba5cd": "InsufficientETH: not enough ETH sent",
    "0xd4a5e2bf": "InsufficientFee: flat fee not covered",
    "0x1425f8f8": "InvalidTarget: call target is address(0)",
    "0x4a3f0f2d": "EmptyCalldata: callData must not be empty",
    "0x85d9d0b8": "CallFailed: one of the batch calls reverted",
    "0xb5e9e6d2": "FeeTransferFailed: could not send fee to collector",
    "0x750b219c": "SweepFailed: could not return leftover ETH"
  };
  if (customErrors[selector]) {
    if (selector === "0x85d9d0b8") {
      try {
        const [callIndex, innerData] = decodeAbiParameters(
          [{ type: "uint256" }, { type: "bytes" }],
          `0x${returnData.slice(10)}`
        );
        const inner = decodeRevertError(innerData);
        return `Call #${callIndex} failed \u2192 ${inner}`;
      } catch {
        return customErrors[selector];
      }
    }
    return customErrors[selector];
  }
  return `Reverted with unknown selector ${selector}`;
}
function decodePanicCode(code) {
  const codes = {
    0: "generic panic",
    1: "assert failed",
    17: "arithmetic overflow/underflow",
    18: "division by zero",
    33: "invalid enum value",
    34: "storage access out of bounds",
    49: "pop on empty array",
    50: "array index out of bounds",
    65: "out of memory",
    81: "uninitialized function pointer"
  };
  return codes[code] ?? `code 0x${code.toString(16)}`;
}
function parseCallResults(receipt, callCount, rawReturnData) {
  if (rawReturnData && rawReturnData !== "0x" && rawReturnData.length > 2) {
    try {
      const decoded = decodeAbiParameters(
        [
          {
            type: "tuple[]",
            components: [
              { name: "success", type: "bool" },
              { name: "returnData", type: "bytes" }
            ]
          }
        ],
        rawReturnData
      );
      const results = decoded[0];
      return results.map((r) => ({
        success: r.success,
        returnData: r.returnData
      }));
    } catch {
    }
  }
  const resultMap = /* @__PURE__ */ new Map();
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: MEGA_ROUTER_ABI,
        data: log.data,
        topics: log.topics,
        strict: false
      });
      if (decoded.eventName === "CallExecuted") {
        const { callIndex, success } = decoded.args;
        resultMap.set(Number(callIndex), {
          success,
          returnData: "0x"
          // events don't carry returnData
        });
      }
    } catch {
    }
  }
  if (resultMap.size > 0) {
    return Array.from(
      { length: callCount },
      (_, i) => resultMap.get(i) ?? { success: true, returnData: "0x" }
    );
  }
  return Array.from({ length: callCount }, () => ({
    success: true,
    returnData: "0x"
  }));
}
function parseBatchExecutedEvent(receipt) {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: MEGA_ROUTER_ABI,
        data: log.data,
        topics: log.topics,
        strict: false
      });
      if (decoded.eventName === "BatchExecuted") {
        const args = decoded.args;
        return {
          sender: args.sender,
          callCount: args.callCount,
          totalValue: args.totalValue,
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.transactionHash
        };
      }
    } catch {
    }
  }
  return null;
}
function parseCallExecutedEvents(receipt) {
  const events = [];
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: MEGA_ROUTER_ABI,
        data: log.data,
        topics: log.topics,
        strict: false
      });
      if (decoded.eventName === "CallExecuted") {
        const args = decoded.args;
        events.push({
          callIndex: args.callIndex,
          target: args.target,
          value: args.value,
          success: args.success,
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.transactionHash
        });
      }
    } catch {
    }
  }
  return events.sort((a, b) => Number(a.callIndex - b.callIndex));
}
function applyMegaethGasBuffer(estimate, bufferPct = 10) {
  return estimate * BigInt(100 + bufferPct) / 100n;
}
function deadlineInMinutes(minutes) {
  return BigInt(Math.floor(Date.now() / 1e3) + minutes * 60);
}
function buildSafeApproveCalls(params) {
  const { token, spender, amount, currentAllowance } = params;
  const approveCalldata = (amt) => {
    const selector = "0x095ea7b3";
    const paddedSpender = spender.slice(2).padStart(64, "0");
    const paddedAmount = amt.toString(16).padStart(64, "0");
    return `${selector}${paddedSpender}${paddedAmount}`;
  };
  const calls = [];
  if (currentAllowance > 0n && currentAllowance !== amount) {
    calls.push({ target: token, value: 0n, callData: approveCalldata(0n) });
  }
  calls.push({ target: token, value: 0n, callData: approveCalldata(amount) });
  return calls;
}
async function getKyberQuote(params) {
  const ETH_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
  const url = new URL(`${KYBERSWAP_API_BASE}/routes`);
  url.searchParams.set("tokenIn", params.tokenIn === "ETH" ? ETH_PLACEHOLDER : params.tokenIn);
  url.searchParams.set("tokenOut", params.tokenOut === "ETH" ? ETH_PLACEHOLDER : params.tokenOut);
  url.searchParams.set("amountIn", params.amountIn.toString());
  url.searchParams.set("gasInclude", "true");
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`KyberSwap API error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.code !== 0) throw new Error(`KyberSwap error: ${json.message}`);
  return json.data.routeSummary;
}
async function buildKyberSwap(params) {
  const res = await fetch(`${KYBERSWAP_API_BASE}/route/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      routeSummary: params.routeSummary,
      sender: params.sender,
      recipient: params.recipient,
      slippageTolerance: params.slippageBps ?? 50
    })
  });
  if (!res.ok) {
    throw new Error(`KyberSwap build error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.code !== 0) throw new Error(`KyberSwap build error: ${json.message}`);
  return json.data;
}
function assertCallsNotEmpty(calls) {
  if (calls.length === 0) {
    throw new MegaFlowError(
      "No calls in batch. Add at least one call before executing.",
      "EMPTY_BATCH"
    );
  }
}
function assertWalletConnected(walletClient) {
  if (!walletClient) {
    throw new MegaFlowError(
      "Wallet not connected. Call connect() or connectWithAccount() first.",
      "WALLET_NOT_CONNECTED"
    );
  }
}
function assertAccount(walletClient) {
  if (!walletClient.account) {
    throw new MegaFlowError(
      "Wallet has no account attached.",
      "NO_ACCOUNT"
    );
  }
}
function isUserRejection(error) {
  if (error instanceof Error) {
    return error.message.includes("User rejected") || error.message.includes("user rejected") || error.message.includes("User denied") || error.message.includes("ACTION_REJECTED");
  }
  return false;
}
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
function isValidHex(hex) {
  return /^0x[a-fA-F0-9]*$/.test(hex);
}
function chunkCalls(calls, maxPerBatch = 64) {
  const chunks = [];
  for (let i = 0; i < calls.length; i += maxPerBatch) {
    chunks.push(calls.slice(i, i + maxPerBatch));
  }
  return chunks;
}
function calculateTotalValue(calls) {
  return calls.reduce((sum, call) => sum + call.value, 0n);
}
var MegaFlowError = class extends Error {
  constructor(message, code, cause) {
    super(`[MegaFlow] ${message}`);
    this.code = code;
    this.cause = cause;
    this.name = "MegaFlowError";
  }
};

// src/builder.ts
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http
} from "viem";
var MegaFlowBuilder = class {
  constructor(config = {}) {
    this.calls = [];
    this.operations = [];
    this.routerAddress = config.routerAddress ?? MAINNET_ROUTER_ADDRESS;
    this.chain = config.chain ?? megaethMainnet;
    this.debug = config.debug ?? false;
    const rpcUrl = config.rpcUrl ?? this.chain.rpcUrls.default.http[0];
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(rpcUrl, {
        timeout: 3e4
      })
    });
  }
  // ==========================================================================
  // Connection
  // ==========================================================================
  /**
   * Connect a pre-built viem WalletClient.
   */
  connect(walletClient) {
    this.walletClient = walletClient;
    this.log("Wallet connected", { account: walletClient.account?.address });
    return this;
  }
  /**
   * Connect using a viem Account object.
   * Creates an internal WalletClient bound to MegaETH's chain/RPC.
   */
  connectWithAccount(account, rpcUrl) {
    this.walletClient = createWalletClient({
      account,
      chain: this.chain,
      transport: http(rpcUrl ?? this.chain.rpcUrls.default.http[0])
    });
    return this;
  }
  /**
   * Disconnect the wallet (for cleanup).
   */
  disconnect() {
    this.walletClient = void 0;
    return this;
  }
  // ==========================================================================
  // Generic Call Builders
  // ==========================================================================
  /**
   * Add a raw call (pre-encoded calldata).
   */
  add(target, callData, value = 0n) {
    const call = { target, value, callData };
    this.calls.push(call);
    this.recordOperation("custom", call);
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
  addCall(params) {
    const callData = encodeFunctionData({
      abi: params.abi,
      functionName: params.functionName,
      args: params.args ?? []
    });
    return this.add(params.target, callData, params.value ?? 0n);
  }
  /**
   * Send native ETH to an address.
   * Uses a minimal `receive()` call (empty calldata is not allowed by MegaRouter,
   * so we send a 1-byte noop that any contract with a `receive()` will handle).
   */
  sendETH(to, value) {
    const call = { target: to, value, callData: "0x00" };
    this.calls.push(call);
    this.recordOperation("custom", call, { type: "sendETH", to, value: value.toString() });
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
  approve(token, spender, amount) {
    return this.addCall({
      target: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, amount]
    });
  }
  /**
   * Safe ERC20 approve — resets allowance to 0 first if non-zero,
   * then sets the new amount. Prevents ERC20 approval race conditions
   * (required by some tokens like USDT).
   *
   * @param currentAllowance Current on-chain allowance. Pass 0n if unknown and you want a single approve.
   */
  safeApprove(token, spender, amount, currentAllowance) {
    const approvalCalls = buildSafeApproveCalls({
      token,
      spender,
      amount,
      currentAllowance
    });
    for (const call of approvalCalls) {
      this.calls.push(call);
      this.recordOperation("safeApprove", call, { token, spender, amount: amount.toString() });
    }
    return this;
  }
  /**
   * ERC20 transfer.
   */
  transfer(token, to, amount) {
    return this.addCall({
      target: token,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to, amount]
    });
  }
  /**
   * ERC20 transferFrom.
   */
  transferFrom(token, from, to, amount) {
    return this.addCall({
      target: token,
      abi: ERC20_ABI,
      functionName: "transferFrom",
      args: [from, to, amount]
    });
  }
  /**
   * Batch transfer same token to multiple recipients in one batch.
   * @example .multiTransfer(USDC, [{ to: addr1, amount: 100n }, { to: addr2, amount: 200n }])
   */
  multiTransfer(token, transfers) {
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
  transferNFT(nft, from, to, tokenId) {
    return this.addCall({
      target: nft,
      abi: ERC721_ABI,
      functionName: "safeTransferFrom",
      args: [from, to, tokenId]
    });
  }
  /**
   * ERC721 approve (single token).
   */
  approveNFT(nft, to, tokenId) {
    return this.addCall({
      target: nft,
      abi: ERC721_ABI,
      functionName: "approve",
      args: [to, tokenId]
    });
  }
  /**
   * ERC721 setApprovalForAll.
   */
  setApprovalForAll(nft, operator, approved) {
    return this.addCall({
      target: nft,
      abi: ERC721_ABI,
      functionName: "setApprovalForAll",
      args: [operator, approved]
    });
  }
  // ==========================================================================
  // WETH Helpers
  // ==========================================================================
  /**
   * Wrap ETH → WETH.
   * The value is sent as ETH and WETH is received in return.
   */
  wrapETH(wethAddress = MEGAETH_TOKENS.WETH, amount) {
    return this.addCall({
      target: wethAddress,
      abi: WETH_ABI,
      functionName: "deposit",
      value: amount
    });
  }
  /**
   * Unwrap WETH → ETH.
   */
  unwrapWETH(wethAddress = MEGAETH_TOKENS.WETH, amount) {
    return this.addCall({
      target: wethAddress,
      abi: WETH_ABI,
      functionName: "withdraw",
      args: [amount]
    });
  }
  // ==========================================================================
  // DEX Helpers (Uniswap V2 interface — works with any V2-compatible DEX)
  // ==========================================================================
  /**
   * Token→Token swap via Uniswap V2 router interface.
   */
  swapExactTokensForTokens(params) {
    return this.addCall({
      target: params.router,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [
        params.amountIn,
        params.amountOutMin,
        params.path,
        params.to,
        params.deadline ?? deadlineInMinutes(5)
      ]
    });
  }
  /**
   * ETH→Token swap via Uniswap V2 router interface.
   */
  swapExactETHForTokens(params) {
    return this.addCall({
      target: params.router,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: "swapExactETHForTokens",
      args: [
        params.amountOutMin,
        params.path,
        params.to,
        params.deadline ?? deadlineInMinutes(5)
      ],
      value: params.amountIn
    });
  }
  /**
   * Token→ETH swap via Uniswap V2 router interface.
   */
  swapExactTokensForETH(params) {
    return this.addCall({
      target: params.router,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: "swapExactTokensForETH",
      args: [
        params.amountIn,
        params.amountOutMin,
        params.path,
        params.to,
        params.deadline ?? deadlineInMinutes(5)
      ]
    });
  }
  /**
   * Approve a token and then swap in the same batch (2 calls, 1 tx).
   * This is the core "Sui-style composability" pattern.
   */
  approveAndSwap(params) {
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
  async kyberSwap(params, sender) {
    const route = await getKyberQuote(params);
    const built = await buildKyberSwap({
      routeSummary: route,
      sender,
      recipient: sender,
      slippageBps: params.slippageBps
    });
    return this.add(
      built.routerAddress,
      built.data,
      BigInt(built.value)
    );
  }
  // ==========================================================================
  // Utility Methods
  // ==========================================================================
  /** Get a copy of queued calls */
  getCalls() {
    return [...this.calls];
  }
  /** Get recorded operations (for debugging/tracking) */
  getOperations() {
    return [...this.operations];
  }
  /** Get full builder state (for serialization/debugging) */
  getState() {
    return {
      calls: [...this.calls],
      operations: [...this.operations],
      totalValue: this.getTotalValue(),
      chainId: this.chain.id
    };
  }
  /** Clear all queued calls and operation history */
  clear() {
    this.calls = [];
    this.operations = [];
    return this;
  }
  /** Remove and return the last call */
  pop() {
    this.operations.pop();
    return this.calls.pop();
  }
  /** Total ETH value across all calls */
  getTotalValue() {
    return this.calls.reduce((sum, c) => sum + c.value, 0n);
  }
  /** Number of calls in the current batch */
  get length() {
    return this.calls.length;
  }
  /** Whether batch is empty */
  get isEmpty() {
    return this.calls.length === 0;
  }
  /** Whether a wallet is connected */
  get isConnected() {
    return !!this.walletClient?.account;
  }
  /** The connected account address (or undefined) */
  get account() {
    return this.walletClient?.account?.address;
  }
  /**
   * Get a human-readable summary of the queued batch.
   * Great for logging/debugging before execution.
   */
  summary() {
    const lines = [
      `MegaFlow Batch (${this.calls.length} calls)`,
      `Chain: ${this.chain.name} (${this.chain.id})`,
      `Router: ${this.routerAddress}`,
      `Total Value: ${this.getTotalValue()} wei`,
      "",
      "Operations:"
    ];
    this.operations.forEach((op, i) => {
      const target = op.call.target.slice(0, 10) + "...";
      lines.push(`  ${i + 1}. ${op.type} \u2192 ${target}`);
    });
    return lines.join("\n");
  }
  // ==========================================================================
  // On-Chain Reads
  // ==========================================================================
  /** Read the protocol flat fee from the MegaRouter contract */
  async getFlatFee() {
    return this.publicClient.readContract({
      address: this.routerAddress,
      abi: MEGA_ROUTER_ABI,
      functionName: "flatFee"
    });
  }
  /** Calculate total ETH required (sum of call values + flat fee) */
  async calculateRequiredETH() {
    if (this.calls.length === 0) return 0n;
    return this.publicClient.readContract({
      address: this.routerAddress,
      abi: MEGA_ROUTER_ABI,
      functionName: "calculateRequiredETH",
      args: [this.calls]
    });
  }
  // ==========================================================================
  // Simulation (Dry Run)
  // ==========================================================================
  /**
   * Simulate the batch via eth_call — no state changes, no gas spent.
   * Very useful for pre-flight checks before submitting the real transaction.
   */
  async simulate() {
    assertCallsNotEmpty(this.calls);
    try {
      const requiredETH = await this.calculateRequiredETH();
      const { result } = await this.publicClient.simulateContract({
        address: this.routerAddress,
        abi: MEGA_ROUTER_ABI,
        functionName: "executeBatch",
        args: [this.calls],
        value: requiredETH,
        account: this.walletClient?.account
      });
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: this.routerAddress,
        abi: MEGA_ROUTER_ABI,
        functionName: "executeBatch",
        args: [this.calls],
        value: requiredETH,
        account: this.walletClient?.account
      });
      return {
        success: true,
        results: result,
        gasEstimate: applyMegaethGasBuffer(gasEstimate)
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const revertReason = decodeRevertError(errorMessage);
      const failedCallIndex = this.extractFailedCallIndex(errorMessage);
      this.log("Simulation failed", { error: errorMessage, failedCallIndex });
      return {
        success: false,
        error: errorMessage,
        revertReason,
        failedCallIndex
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
  async execute(options = {}) {
    assertCallsNotEmpty(this.calls);
    assertWalletConnected(this.walletClient);
    assertAccount(this.walletClient);
    this.log("Executing batch", { callCount: this.calls.length });
    const requiredETH = await this.calculateRequiredETH();
    const { request } = await this.publicClient.simulateContract({
      address: this.routerAddress,
      abi: MEGA_ROUTER_ABI,
      functionName: "executeBatch",
      args: [this.calls],
      value: requiredETH,
      account: this.walletClient.account,
      gas: options.gasLimit,
      maxFeePerGas: options.maxFeePerGas,
      maxPriorityFeePerGas: options.maxPriorityFeePerGas,
      nonce: options.nonce
    });
    const hash = await this.walletClient.writeContract(request);
    this.log("Transaction sent", { hash });
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    this.log("Transaction confirmed", { status: receipt.status, gasUsed: receipt.gasUsed.toString() });
    const results = parseCallResults(receipt, this.calls.length);
    return {
      hash,
      receipt,
      results,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      totalCost: receipt.gasUsed * receipt.effectiveGasPrice
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
  async executeSync(options = {}) {
    assertCallsNotEmpty(this.calls);
    assertWalletConnected(this.walletClient);
    assertAccount(this.walletClient);
    const startTime = performance.now();
    this.log("Executing batch (sync)", { callCount: this.calls.length });
    const requiredETH = await this.calculateRequiredETH();
    const { request } = await this.publicClient.simulateContract({
      address: this.routerAddress,
      abi: MEGA_ROUTER_ABI,
      functionName: "executeBatch",
      args: [this.calls],
      value: requiredETH,
      account: this.walletClient.account,
      gas: options.gasLimit
    });
    const signedTx = await this.walletClient.signTransaction({
      ...request,
      account: this.walletClient.account
    });
    const receipt = await this.publicClient.request({
      method: "eth_sendRawTransactionSync",
      params: [signedTx]
    });
    const executionTimeMs = performance.now() - startTime;
    this.log("Sync execution completed", { executionTimeMs: executionTimeMs.toFixed(2) });
    const results = parseCallResults(receipt, this.calls.length);
    return { receipt, results, gasUsed: receipt.gasUsed, executionTimeMs };
  }
  /**
   * Same as executeSync but uses `realtime_sendRawTransaction` (MegaETH original).
   * Both are functionally identical; use `executeSync` for cross-chain compatibility.
   */
  async executeRealtime(options = {}) {
    assertCallsNotEmpty(this.calls);
    assertWalletConnected(this.walletClient);
    assertAccount(this.walletClient);
    const startTime = performance.now();
    const requiredETH = await this.calculateRequiredETH();
    const { request } = await this.publicClient.simulateContract({
      address: this.routerAddress,
      abi: MEGA_ROUTER_ABI,
      functionName: "executeBatch",
      args: [this.calls],
      value: requiredETH,
      account: this.walletClient.account,
      gas: options.gasLimit
    });
    const signedTx = await this.walletClient.signTransaction({
      ...request,
      account: this.walletClient.account
    });
    const receipt = await this.publicClient.request({
      method: "realtime_sendRawTransaction",
      params: [signedTx]
    });
    const executionTimeMs = performance.now() - startTime;
    const results = parseCallResults(receipt, this.calls.length);
    return { receipt, results, gasUsed: receipt.gasUsed, executionTimeMs };
  }
  // ==========================================================================
  // Private Helpers
  // ==========================================================================
  recordOperation(type, call, metadata) {
    this.operations.push({
      type,
      call,
      metadata,
      timestamp: Date.now()
    });
  }
  extractFailedCallIndex(errorMessage) {
    const match = errorMessage.match(/CallFailed\((\d+)/);
    if (match) return parseInt(match[1], 10);
    const indexMatch = errorMessage.match(/call\s*#?\s*(\d+)/i);
    if (indexMatch) return parseInt(indexMatch[1], 10);
    return void 0;
  }
  log(message, data) {
    if (this.debug) {
      console.log(`[MegaFlow] ${message}`, data ?? "");
    }
  }
};

// src/client.ts
import {
  createPublicClient as createPublicClient2,
  createWalletClient as createWalletClient2,
  http as http2,
  webSocket as webSocket2
} from "viem";
import { multicall } from "viem/actions";
import { privateKeyToAccount, mnemonicToAccount } from "viem/accounts";
var MegaFlowClient = class _MegaFlowClient {
  constructor(config = {}) {
    // Local nonce cache: address → last used nonce
    this.nonceCache = /* @__PURE__ */ new Map();
    this.config = {
      ...config,
      routerAddress: config.routerAddress ?? MAINNET_ROUTER_ADDRESS
    };
    if (config.publicClient) {
      this.publicClient = config.publicClient;
    } else {
      const rpcUrl = config.rpcUrl ?? (config.chain ?? megaethMainnet).rpcUrls.default.http[0];
      this.publicClient = createPublicClient2({
        chain: config.chain ?? megaethMainnet,
        transport: http2(rpcUrl, { timeout: 3e4 })
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
  static fromPrivateKey(privateKey, config = {}) {
    const account = privateKeyToAccount(privateKey);
    return new _MegaFlowClient(config).connectWithAccount(account);
  }
  /**
   * Create a client from a BIP-39 mnemonic phrase.
   *
   * @example
   * ```typescript
   * const client = MegaFlowClient.fromMnemonic('word1 word2 ... word12');
   * ```
   */
  static fromMnemonic(mnemonic, config = {}) {
    const account = mnemonicToAccount(mnemonic);
    return new _MegaFlowClient(config).connectWithAccount(account);
  }
  // ==========================================================================
  // Connection
  // ==========================================================================
  /**
   * The connected account's address, or undefined if not yet connected.
   */
  get address() {
    return this.walletClient?.account?.address;
  }
  connectWithAccount(account, rpcUrl) {
    const chain = this.config.chain ?? megaethMainnet;
    this.walletClient = createWalletClient2({
      account,
      chain,
      transport: http2(rpcUrl ?? chain.rpcUrls.default.http[0])
    });
    return this;
  }
  connect(walletClient) {
    this.walletClient = walletClient;
    return this;
  }
  /**
   * Enable a WebSocket client for lower latency.
   * WebSocket is 5-6x faster than HTTP on MegaETH.
   *
   * Requires the chain to have a webSocket URL configured.
   */
  enableWebSocket(wsUrl) {
    const chain = this.config.chain ?? megaethMainnet;
    const url = wsUrl ?? chain.rpcUrls.default.webSocket?.[0];
    if (!url) throw new Error("No WebSocket URL available for this chain.");
    this.wsClient = createPublicClient2({
      chain,
      // viem's webSocket transport handles reconnection internally.
      // MegaETH requires a keepalive ping every 30s — viem handles this
      // via the underlying WebSocket ping frames automatically.
      transport: webSocket2(url)
    });
    return this;
  }
  /** Active public client (prefers WebSocket when enabled) */
  get activeClient() {
    return this.wsClient ?? this.publicClient;
  }
  // ==========================================================================
  // Batch Builder Factory
  // ==========================================================================
  /**
   * Create a new MegaFlowBuilder linked to this client's configuration.
   * Start building calls, then call `.execute()` or `.executeSync()`.
   */
  batch() {
    const builder = new MegaFlowBuilder({
      routerAddress: this.config.routerAddress,
      rpcUrl: this.config.rpcUrl,
      chain: this.config.chain
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
  async getETHBalance(address) {
    return this.publicClient.getBalance({ address });
  }
  /**
   * Get the ERC20 token balance of an address.
   */
  async getTokenBalance(token, owner) {
    return this.publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner]
    });
  }
  /**
   * Get the current ERC20 allowance.
   */
  async getAllowance(token, owner, spender) {
    return this.publicClient.readContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [owner, spender]
    });
  }
  /**
   * Get multiple token balances in a single multicall.
   * Much faster than sequential calls on MegaETH (v2.0.14+).
   */
  async getMultipleBalances(tokens, owner) {
    const contracts = tokens.map((token) => ({
      address: token,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [owner]
    }));
    const results = await multicall(this.publicClient, { contracts });
    return tokens.map((token, i) => ({
      token,
      balance: results[i].status === "success" ? results[i].result : 0n
    }));
  }
  /**
   * Get token metadata (name, symbol, decimals) in a single multicall round-trip.
   */
  async getTokenInfo(token) {
    const [name, symbol, decimals, totalSupply] = await multicall(this.publicClient, {
      contracts: [
        { address: token, abi: ERC20_ABI, functionName: "name" },
        { address: token, abi: ERC20_ABI, functionName: "symbol" },
        { address: token, abi: ERC20_ABI, functionName: "decimals" },
        { address: token, abi: ERC20_ABI, functionName: "totalSupply" }
      ]
    });
    return {
      name: name.result ?? "",
      symbol: symbol.result ?? "",
      decimals: decimals.result ?? 18,
      totalSupply: totalSupply.result ?? 0n
    };
  }
  // ==========================================================================
  // Router Reads
  // ==========================================================================
  /** Get protocol flat fee from the deployed router */
  async getFlatFee() {
    return this.publicClient.readContract({
      address: this.config.routerAddress,
      abi: MEGA_ROUTER_ABI,
      functionName: "flatFee"
    });
  }
  /** Get fee collector address from the deployed router */
  async getFeeCollector() {
    return this.publicClient.readContract({
      address: this.config.routerAddress,
      abi: MEGA_ROUTER_ABI,
      functionName: "feeCollector"
    });
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
  async getNextNonce(address) {
    const key = address.toLowerCase();
    const networkNonce = await this.publicClient.getTransactionCount({
      address,
      blockTag: "pending"
    });
    const lastUsed = this.nonceCache.get(key) ?? -1;
    const nonce = Math.max(networkNonce, lastUsed + 1);
    this.nonceCache.set(key, nonce);
    return nonce;
  }
  /** Reset locally cached nonce for an address (call after a tx confirms or fails). */
  resetNonce(address) {
    this.nonceCache.delete(address.toLowerCase());
  }
  // ==========================================================================
  // Gas Helpers
  // ==========================================================================
  /**
   * Get the current gas price from MegaETH RPC.
   * Returns the raw value (avoids viem's 20% buffer).
   */
  async getGasPrice() {
    const price = await this.publicClient.request({
      method: "eth_gasPrice"
    });
    return BigInt(price);
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
  async bridgeETHToMegaETH(l1WalletClient, amount) {
    if (!l1WalletClient.account) {
      throw new Error("L1 wallet client has no account");
    }
    const hash = await l1WalletClient.sendTransaction({
      account: l1WalletClient.account,
      to: MEGAETH_L1_BRIDGE,
      value: amount,
      chain: l1WalletClient.chain
    });
    return hash;
  }
  // ==========================================================================
  // Connection Status
  // ==========================================================================
  get isConnected() {
    return !!this.walletClient?.account;
  }
  get account() {
    return this.walletClient?.account?.address;
  }
  get routerAddress() {
    return this.config.routerAddress;
  }
};

// src/index.ts
import { privateKeyToAccount as privateKeyToAccount2, mnemonicToAccount as mnemonicToAccount2, hdKeyToAccount } from "viem/accounts";
import { parseUnits, parseEther as parseEther2, formatUnits, formatEther, hexToBigInt, numberToHex } from "viem";
import { isAddress, getAddress, zeroAddress } from "viem";
import { encodeFunctionData as encodeFunctionData2, decodeFunctionData, encodeAbiParameters, decodeAbiParameters as decodeAbiParameters2 } from "viem";
function createMegaFlow(config) {
  return new MegaFlowBuilder(config);
}
function createMegaFlowClient(config) {
  return new MegaFlowClient(config);
}
function createMegaFlowMainnet(routerAddress) {
  return new MegaFlowBuilder({ routerAddress, chain: megaethMainnet });
}
function createMegaFlowTestnet(routerAddress) {
  return new MegaFlowBuilder({ routerAddress, chain: megaethTestnet });
}
function createMegaFlowClientMainnet(routerAddress, rpcUrl) {
  return new MegaFlowClient({ routerAddress, chain: megaethMainnet, rpcUrl });
}
function createMegaFlowClientTestnet(routerAddress, rpcUrl) {
  return new MegaFlowClient({ routerAddress, chain: megaethTestnet, rpcUrl });
}
export {
  ERC20_ABI,
  ERC721_ABI,
  KYBERSWAP_API_BASE,
  MEGAETH_BASE_FEE,
  MEGAETH_GAS_LIMITS,
  MEGAETH_L1_BRIDGE,
  MEGAETH_TOKENS,
  MEGA_ROUTER_ABI,
  MegaFlowBuilder,
  MegaFlowClient,
  MegaFlowError,
  UNISWAP_V2_ROUTER_ABI,
  WETH_ABI,
  applyMegaethGasBuffer,
  buildKyberSwap,
  buildSafeApproveCalls,
  calculateTotalValue,
  chainById,
  chunkCalls,
  createMegaFlow,
  createMegaFlowClient,
  createMegaFlowClientMainnet,
  createMegaFlowClientTestnet,
  createMegaFlowMainnet,
  createMegaFlowTestnet,
  deadlineInMinutes,
  decodeAbiParameters2 as decodeAbiParameters,
  decodeFunctionData,
  encodeAbiParameters,
  encodeFunctionData2 as encodeFunctionData,
  formatEther,
  formatUnits,
  getAddress,
  getKyberQuote,
  hdKeyToAccount,
  hexToBigInt,
  isAddress,
  isUserRejection,
  isValidAddress,
  isValidHex,
  megaethChains,
  megaethMainnet,
  megaethTestnet,
  mnemonicToAccount2 as mnemonicToAccount,
  numberToHex,
  parseBatchExecutedEvent,
  parseCallExecutedEvents,
  parseCallResults,
  parseEther2 as parseEther,
  parseUnits,
  privateKeyToAccount2 as privateKeyToAccount,
  zeroAddress
};
