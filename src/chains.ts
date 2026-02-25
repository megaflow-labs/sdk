/**
 * MegaETH Chain Definitions
 * 
 * Source: https://docs.megaeth.com / megaeth-ai-developer-skills
 * Chain IDs verified from official wallet-operations.md docs.
 */

import { type Chain } from 'viem';

/**
 * MegaETH Mainnet
 * Chain ID: 4326
 * RPC: https://mainnet.megaeth.com/rpc
 */
export const megaethMainnet = {
    id: 4326,
    name: 'MegaETH Mainnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet.megaeth.com/rpc'],
            webSocket: ['wss://mainnet.megaeth.com/ws'],
        },
    },
    blockExplorers: {
        default: {
            name: 'MegaETH Explorer',
            url: 'https://mega.etherscan.io',
        },
    },
} as const satisfies Chain;

/**
 * MegaETH Testnet (Carrot)
 * Chain ID: 6343
 * RPC: https://carrot.megaeth.com/rpc
 */
export const megaethTestnet = {
    id: 6343,
    name: 'MegaETH Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://carrot.megaeth.com/rpc'],
            webSocket: ['wss://carrot.megaeth.com/ws'],
        },
    },
    blockExplorers: {
        default: {
            name: 'MegaETH Testnet Explorer',
            url: 'https://megaeth-testnet-v2.blockscout.com',
        },
    },
    testnet: true,
} as const satisfies Chain;

/** All supported MegaETH chains */
export const megaethChains = [megaethMainnet, megaethTestnet] as const;

/** Chain ID → Chain lookup */
export const chainById: Record<number, Chain> = {
    [megaethMainnet.id]: megaethMainnet,
    [megaethTestnet.id]: megaethTestnet,
};
