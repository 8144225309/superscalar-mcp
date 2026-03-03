#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const REPO_URL = "https://github.com/8144225309/SuperScalar";
const WEBSITE_URL = "https://SuperScalar.win";

const server = new McpServer({
  name: "superscalar-mcp",
  version: "0.1.0",
});

// Tool: Protocol overview
server.tool(
  "superscalar_overview",
  "Get an overview of the SuperScalar protocol — Bitcoin Lightning channel factories that onboard N users in one shared UTXO with no soft fork required.",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: `# SuperScalar — Lightning Channel Factories

SuperScalar is an implementation of Bitcoin Lightning channel factories that
onboard N users into a single shared UTXO. No consensus changes or soft forks
are required.

## Architecture

SuperScalar combines three key mechanisms:

1. **Decker-Wattenhofer invalidation trees** — Alternating kickoff and state
   layers provide the invalidation mechanism for updating shared state.

2. **Timeout-signature trees** — N-of-N MuSig2 key-path spend with CLTV
   fallback. Provides efficient cooperative closing with timeout-based
   unilateral exit.

3. **Poon-Dryja channels** — Standard payment channels at tree leaf outputs
   with full HTLC and PTLC support.

## Key Properties

- **No soft fork needed** — Uses existing Bitcoin script capabilities
  (Taproot, MuSig2)
- **LSP + N clients** — One Liquidity Service Provider coordinates N clients
  in a single factory
- **Scalable onboarding** — Multiple users share one on-chain UTXO, reducing
  chain footprint
- **Full Lightning compatibility** — HTLC forwarding, watchtower support,
  standard channel operations

## Implementation

Written in C with 400+ tests (unit + integration), SQLite persistence,
encrypted Noise NK transport, and support for regtest/signet/testnet/mainnet.

## Links

- Source code: ${REPO_URL}
- Website: ${WEBSITE_URL}
`,
      },
    ],
  })
);

// Tool: Estimate UTXO savings
server.tool(
  "superscalar_estimate_savings",
  "Estimate on-chain UTXO savings from using SuperScalar channel factories vs individual Lightning channel opens. Compares the number of on-chain transactions needed.",
  {
    num_users: z
      .number()
      .int()
      .min(2)
      .max(1000)
      .describe("Number of users to onboard into Lightning channels"),
    avg_tx_vbytes: z
      .number()
      .optional()
      .default(154)
      .describe(
        "Average vbytes per individual channel open transaction (default: 154 for P2TR)"
      ),
    factory_base_vbytes: z
      .number()
      .optional()
      .default(200)
      .describe("Base vbytes for the factory funding transaction (default: 200)"),
    factory_per_user_vbytes: z
      .number()
      .optional()
      .default(43)
      .describe(
        "Additional vbytes per user in the factory transaction (default: 43 for Taproot outputs)"
      ),
    fee_rate: z
      .number()
      .optional()
      .default(10)
      .describe("Fee rate in sat/vbyte (default: 10)"),
  },
  async ({ num_users, avg_tx_vbytes, factory_base_vbytes, factory_per_user_vbytes, fee_rate }) => {
    const individual_vbytes = num_users * avg_tx_vbytes;
    const factory_vbytes = factory_base_vbytes + num_users * factory_per_user_vbytes;

    const individual_fees = individual_vbytes * fee_rate;
    const factory_fees = factory_vbytes * fee_rate;

    const savings_vbytes = individual_vbytes - factory_vbytes;
    const savings_fees = individual_fees - factory_fees;
    const savings_pct = ((savings_vbytes / individual_vbytes) * 100).toFixed(1);

    return {
      content: [
        {
          type: "text",
          text: `# SuperScalar Factory Savings Estimate

## Parameters
- Users: ${num_users}
- Fee rate: ${fee_rate} sat/vB

## Individual Channel Opens (baseline)
- Total vbytes: ${individual_vbytes.toLocaleString()} vB
- Total fees: ${individual_fees.toLocaleString()} sats (${(individual_fees / 1e8).toFixed(8)} BTC)
- On-chain transactions: ${num_users}

## SuperScalar Factory (1 transaction)
- Total vbytes: ${factory_vbytes.toLocaleString()} vB
- Total fees: ${factory_fees.toLocaleString()} sats (${(factory_fees / 1e8).toFixed(8)} BTC)
- On-chain transactions: 1

## Savings
- Block space saved: ${savings_vbytes.toLocaleString()} vB (${savings_pct}%)
- Fee savings: ${savings_fees.toLocaleString()} sats (${(savings_fees / 1e8).toFixed(8)} BTC)

Note: These are simplified estimates. Actual savings depend on tree depth,
cooperative vs unilateral close paths, and factory structure.

Learn more: ${REPO_URL}
`,
        },
      ],
    };
  }
);

// Tool: Architecture deep dive
server.tool(
  "superscalar_architecture",
  "Detailed explanation of a specific SuperScalar component: the invalidation tree, timeout-signature tree, channel layer, MuSig2 signing, watchtower, or transport protocol.",
  {
    component: z.enum([
      "invalidation-tree",
      "timeout-tree",
      "channels",
      "musig2",
      "watchtower",
      "transport",
    ]).describe("The architectural component to explain"),
  },
  async ({ component }) => {
    const descriptions: Record<string, string> = {
      "invalidation-tree": `# Decker-Wattenhofer Invalidation Tree

The invalidation mechanism uses alternating kickoff and state layers in a
tree structure. Each update increments the state number, and older states
can be invalidated by broadcasting a newer state on-chain.

Key properties:
- Alternating kickoff/state transaction layers
- Each layer uses decreasing timelocks so newer states confirm faster
- No penalty mechanism needed (unlike Poon-Dryja revocation)
- Supports N-party updates with a single coordinator (LSP)

The tree structure allows O(log N) on-chain transactions for unilateral
exit, rather than O(N) for flat constructions.`,

      "timeout-tree": `# Timeout-Signature Tree

Timeout-signature trees combine two spend paths in each Taproot output:

1. **Key path**: N-of-N MuSig2 aggregate key — used for cooperative
   operations (instant, cheapest)
2. **Script path**: CLTV timelock fallback — used when cooperation fails

This gives the factory a natural "heartbeat": if the LSP and clients can
cooperate, everything happens off-chain via key-path spends. If the LSP
disappears or refuses to sign, clients can unilaterally exit after the
timeout expires.

The timeout also creates a natural factory refresh cycle, where users
re-enter new factories before expiry.`,

      "channels": `# Poon-Dryja Payment Channels

At the leaves of the SuperScalar tree sit standard Poon-Dryja channels:

- Each leaf output funds a 2-of-2 channel between the LSP and one client
- Full HTLC support for Lightning payment forwarding
- PTLC support via Schnorr adaptor signatures
- Standard commitment transaction structure with to_local/to_remote outputs
- Revocation-based invalidation (separate from the tree invalidation)

These channels are fully compatible with the existing Lightning Network.
Payments can be routed through them just like any other Lightning channel.`,

      "musig2": `# MuSig2 Signing

SuperScalar uses MuSig2 (BIP-327) for N-of-N key aggregation:

- All participants contribute public nonces and partial signatures
- Produces a single valid Schnorr signature indistinguishable from a
  single-signer signature
- Two-round signing protocol (nonce exchange + partial signature exchange)
- Used in both the key-path spends of timeout-signature tree nodes and
  for cooperative factory operations

The implementation also supports Schnorr adaptor signatures for PTLCs,
enabling payment forwarding without hash preimage revelation.`,

      "watchtower": `# Watchtower Support

SuperScalar includes watchtower functionality for breach detection:

- Monitors the blockchain for revoked state broadcasts
- Detects old invalidation tree states published on-chain
- Constructs and broadcasts penalty/justice transactions
- Protects offline clients from LSP misbehavior

The watchtower stores compact breach hints rather than full transaction
data, minimizing storage requirements while maintaining security.`,

      "transport": `# Noise NK Transport Protocol

SuperScalar uses the Noise NK handshake pattern for encrypted communication:

- Client knows the server's (LSP's) static public key in advance
- Forward secrecy for client messages from the first message
- 54 defined message types for factory lifecycle management
- Encrypted and authenticated after handshake completion

The protocol handles factory creation, state updates, channel operations,
HTLC forwarding, and cooperative/unilateral close flows.`,
    };

    return {
      content: [
        {
          type: "text",
          text: `${descriptions[component]}

Source code and full documentation: ${REPO_URL}
`,
        },
      ],
    };
  }
);

// Tool: List resources
server.tool(
  "superscalar_resources",
  "Get links to SuperScalar resources: source code, website, related reading on Lightning channel factories, and the original ZmnSCPxj proposal.",
  {},
  async () => ({
    content: [
      {
        type: "text",
        text: `# SuperScalar Resources

## Primary
- Source code: ${REPO_URL}
- Website: ${WEBSITE_URL}

## Background Reading
- ZmnSCPxj's SuperScalar proposal: https://delvingbitcoin.org/t/superscalar-laddered-timeout-tree-structured-decker-wattenhofer-factories/1143
- Decker-Wattenhofer channels: https://tik-old.ee.ethz.ch/file/716b955c130e6c703fac336ea17b1670/duplex-micropayment-channels.pdf
- Timeout trees (John Law): https://github.com/JohnLaw2/ln-scaling-covenants
- MuSig2 (BIP-327): https://github.com/bitcoin/bips/blob/master/bip-0327.mediawiki

## Related Projects
- Lightning Dev Kit (LDK): https://lightningdevkit.org/
- Core Lightning: https://github.com/ElementsProject/lightning
- LND: https://github.com/lightningnetwork/lnd
`,
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
