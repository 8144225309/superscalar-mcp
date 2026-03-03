# superscalar-mcp

MCP server for [SuperScalar](https://github.com/8144225309/SuperScalar) — Bitcoin Lightning channel factories that onboard N users in one shared UTXO. No soft fork required.

## Tools

| Tool | Description |
|------|-------------|
| `superscalar_overview` | Protocol overview — what SuperScalar is, how it works, key properties |
| `superscalar_estimate_savings` | Estimate on-chain UTXO and fee savings vs individual channel opens |
| `superscalar_architecture` | Deep dive into a specific component (invalidation tree, timeout tree, channels, MuSig2, watchtower, transport) |
| `superscalar_resources` | Links to source code, website, papers, and related projects |

## Install

```bash
npm install -g superscalar-mcp
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "superscalar": {
      "command": "npx",
      "args": ["superscalar-mcp"]
    }
  }
}
```

## Usage with Claude Code

```bash
claude mcp add superscalar -- npx superscalar-mcp
```

## Example Queries

Once connected, you can ask Claude things like:

- "What is SuperScalar and how does it scale Lightning?"
- "Estimate the savings if 50 users share a channel factory instead of opening individual channels"
- "Explain how the invalidation tree works in SuperScalar"
- "What resources exist for learning about channel factories?"

## About SuperScalar

SuperScalar combines Decker-Wattenhofer invalidation trees, timeout-signature trees, and Poon-Dryja channels to create Lightning channel factories that work today — no consensus changes needed.

- **Source**: https://github.com/8144225309/SuperScalar
- **Website**: https://SuperScalar.win
- **Implementation**: C, 400+ tests, MuSig2, Taproot, watchtower support

## License

MIT
