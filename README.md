# @megaflow-labs/sdk

**Batch transaction SDK for MegaETH** — compose, simulate and execute multiple on-chain operations in a single atomic transaction.

[![npm](https://img.shields.io/npm/v/@megaflow-labs/sdk)](https://www.npmjs.com/package/@megaflow-labs/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

---

## Why MegaFlow?

On standard EVM chains, sending multiple transactions requires multiple wallet confirmations and multiple block waits. MegaFlow solves this:

| | Without MegaFlow | With MegaFlow |
|---|---|---|
| Approve + Swap | 2 wallet popups, 2 blocks | **1 wallet popup, 1 block** |
| Failure safety | First tx may succeed, second may fail | **All-or-nothing (atomic)** |
| Code complexity | ABI encoding, fee math, polling | **Chainable one-liners** |

---

## Installation

```bash
npm install @megaflow-labs/sdk
```

> Requires `viem ^2.0.0` (peer dependency) and Node.js ≥ 18.

---

## Quick Start

```typescript
import { MegaFlowClient, MEGAETH_TOKENS } from '@megaflow-labs/sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { parseUnits, parseEther } from 'viem';

const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');

// Zero-config: connects to MegaETH Mainnet automatically
const client = new MegaFlowClient().connectWithAccount(account);

// Read on-chain state
const balance = await client.getTokenBalance(MEGAETH_TOKENS.WETH, account.address);
const allowance = await client.getAllowance(USDC, account.address, DEX_ROUTER);

// Build, simulate, and execute — all in one chain
const result = await client
  .batch()
  .safeApprove(USDC, DEX_ROUTER, parseUnits('100', 6), allowance)
  .swapExactTokensForTokens({
    router: DEX_ROUTER,
    amountIn: parseUnits('100', 6),
    amountOutMin: parseEther('0.03'),
    path: [USDC, MEGAETH_TOKENS.WETH],
    to: account.address,
  })
  .executeSync(); // instant receipt on MegaETH (~10ms)

console.log(`Tx hash: ${result.receipt.transactionHash}`);
console.log(`Gas used: ${result.gasUsed}`);
```

---

## Core Concepts

### MegaFlowBuilder

Low-level builder for composing batches. All methods are chainable.

```typescript
import { MegaFlowBuilder } from '@megaflow-labs/sdk';

const builder = new MegaFlowBuilder();

// Chain as many operations as you need
builder
  .connect(walletClient)
  .wrapETH(MEGAETH_TOKENS.WETH, parseEther('0.1'))   // wrap ETH → WETH
  .transfer(MEGAETH_TOKENS.WETH, recipient, parseEther('0.1')); // send WETH

// Dry-run before broadcasting (no gas spent)
const sim = await builder.simulate();
if (!sim.success) throw new Error(sim.error);

// Execute — standard async flow
const result = await builder.execute();
```

### MegaFlowClient

Stateful high-level client. Extends MegaFlowBuilder with token reads, nonce management, and WebSocket support.

```typescript
import { MegaFlowClient } from '@megaflow-labs/sdk';

const client = new MegaFlowClient({ debug: true });
client.connectWithAccount(account);

// Read token state
const bal = await client.getTokenBalance(token, address);
const allowance = await client.getAllowance(token, address, spender);

// Batch transfers to multiple recipients in one tx
const result = await client
  .batch()
  .multiTransfer(USDC, [
    { to: '0xAlice...', amount: parseUnits('50', 6) },
    { to: '0xBob...', amount: parseUnits('50', 6) },
  ])
  .execute();
```

---

## API Reference

### Execution Methods

| Method | Description |
|--------|-------------|
| `execute(options?)` | Standard async flow: simulate → send → wait for receipt |
| `executeSync(options?)` | MegaETH sync flow: instant receipt in one RPC roundtrip |
| `executeRealtime(options?)` | Alternative realtime RPC endpoint |
| `simulate()` | Dry-run with no gas spent. Returns success/error/gasEstimate |

### ERC20 Helpers

| Method | Description |
|--------|-------------|
| `.approve(token, spender, amount)` | Single ERC20 approve |
| `.safeApprove(token, spender, amount, currentAllowance)` | Reset-then-approve (USDT-safe) |
| `.transfer(token, to, amount)` | ERC20 transfer |
| `.transferFrom(token, from, to, amount)` | ERC20 transferFrom |
| `.multiTransfer(token, [{to, amount}])` | Batch transfer to multiple recipients |

### DEX Helpers

| Method | Description |
|--------|-------------|
| `.swapExactTokensForTokens(params)` | Uniswap V2-compatible token→token swap |
| `.swapExactETHForTokens(params)` | ETH→token swap |
| `.swapExactTokensForETH(params)` | token→ETH swap |
| `.approveAndSwap(params)` | Approve + swap in one call |
| `.kyberSwap(params, sender)` | KyberSwap aggregator (async) |

### WETH Helpers

| Method | Description |
|--------|-------------|
| `.wrapETH(wethAddress, amount)` | Deposit ETH → WETH |
| `.unwrapWETH(wethAddress, amount)` | Withdraw WETH → ETH |

### ERC721 Helpers

| Method | Description |
|--------|-------------|
| `.transferNFT(nft, from, to, tokenId)` | safeTransferFrom |
| `.approveNFT(nft, to, tokenId)` | Approve single token |
| `.setApprovalForAll(nft, operator, approved)` | Operator approval |

### Utility Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getCalls()` | `MegaCall[]` | Current queued calls |
| `getTotalValue()` | `bigint` | Sum of ETH values |
| `getState()` | `BuilderState` | Full state snapshot |
| `summary()` | `string` | Human-readable batch description |
| `clear()` | `this` | Reset all calls |
| `pop()` | `MegaCall` | Remove last call |

### `ExecuteOptions`

```typescript
const result = await builder.execute({
  gasLimit: 300_000n,
  maxFeePerGas: parseGwei('0.001'),
  nonce: 42,
});
```

---

## Error Handling

```typescript
import { MegaFlowError } from '@megaflow-labs/sdk';

try {
  await builder.execute();
} catch (err) {
  if (err instanceof MegaFlowError) {
    switch (err.code) {
      case 'EMPTY_BATCH':       // No calls added
      case 'WALLET_NOT_CONNECTED': // connect() not called
      case 'SIMULATION_FAILED': // Dry-run failed
      case 'EXECUTION_FAILED':  // On-chain revert
      case 'USER_REJECTED':     // MetaMask rejected
    }
  }
}
```

---

## Debug Mode

```typescript
const builder = new MegaFlowBuilder({ debug: true });
// Logs to console: wallet connection, tx hash, gas used, sync timing
```

Print a readable summary before executing:

```typescript
builder
  .approve(USDC, DEX, amount)
  .swapExactTokensForTokens({ ... });

console.log(builder.summary());
// MegaFlow Batch (2 calls)
// Chain: MegaETH Mainnet (4326)
// Router: 0x9c1528e...
// Operations:
//   1. approve → 0x4200000...
//   2. swap    → 0xDEX_ADD...
```

---

## Network Configuration

```typescript
import { megaethMainnet, megaethTestnet } from '@megaflow-labs/sdk';

// Testnet (Carrot)
const client = new MegaFlowClient({ chain: megaethTestnet });

// Custom RPC
const client = new MegaFlowClient({ rpcUrl: 'https://your-rpc.example.com' });
```

---

## Links

- **Website:** [megaflow.space](https://megaflow.space)
- **GitHub:** [github.com/megaflow-labs](https://github.com/megaflow-labs)
- **NPM:** [@megaflow-labs/sdk](https://www.npmjs.com/package/@megaflow-labs/sdk)

---

## License

MIT © [MegaFlow Labs](https://megaflow.space)
