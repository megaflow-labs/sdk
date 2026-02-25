# Changelog

All notable changes to `@megaflow-labs/sdk` will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.1.0] – 2026-02-26

### Initial release

#### Core
- `MegaFlowBuilder` — chainable batch transaction builder
- `MegaFlowClient` — stateful high-level client with nonce management and WebSocket support
- `MegaRouter` contract integration with atomic batch execution

#### Operations
- ERC20: `approve`, `safeApprove` (reset-then-approve), `transfer`, `transferFrom`, `multiTransfer`
- WETH: `wrapETH`, `unwrapWETH`
- DEX: `swapExactTokensForTokens`, `swapExactETHForTokens`, `swapExactTokensForETH`, `approveAndSwap`
- ERC721: `transferNFT`, `approveNFT`, `setApprovalForAll`
- KyberSwap aggregator integration: `kyberSwap`
- Generic: `add`, `addCall`, `sendETH`

#### Execution
- `execute()` — standard async flow (simulate → send → waitForReceipt)
- `executeSync()` — MegaETH `eth_sendRawTransactionSync` (EIP-7966), instant receipt
- `executeRealtime()` — `realtime_sendRawTransaction` endpoint
- `simulate()` — dry-run with no gas spent, returns per-call results and gas estimate
- `ExecuteOptions` — gas limit, maxFeePerGas, nonce overrides

#### Debugging & Introspection
- `debug` mode — structured console logs on wallet connect, tx send, gas used, sync timing
- `summary()` — human-readable batch description
- `getState()` / `getOperations()` — full builder snapshot for serialization
- `pop()` — undo last queued call

#### Error Handling
- `MegaFlowError` with typed `MegaFlowErrorCode` union
- `decodeRevertError` — decodes `Error(string)`, `Panic`, and MegaRouter custom errors
- Nested `CallFailed` inner revert decoding

#### Chains & Constants
- `megaethMainnet` and `megaethTestnet` chain definitions
- `MEGAETH_TOKENS` (WETH, MEGA, USDM), `MEGAETH_L1_BRIDGE`
- Bundled ABIs: `ERC20_ABI`, `ERC721_ABI`, `WETH_ABI`, `UNISWAP_V2_ROUTER_ABI`, `MEGA_ROUTER_ABI`
