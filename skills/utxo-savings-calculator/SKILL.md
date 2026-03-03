---
name: utxo-savings-calculator
description: Calculate and compare on-chain costs of Bitcoin Lightning channel factories vs individual channel opens. Use when asked about UTXO savings, channel factory efficiency, Lightning onboarding costs, or block space optimization.
---

# /utxo-savings-calculator

Calculate the on-chain savings from using SuperScalar channel factories instead of individual Lightning channel opens.

## How to Calculate

Given N users to onboard:

### Individual Channel Opens (baseline)
- Each user needs their own on-chain transaction
- Average size: ~154 vbytes per P2TR channel open
- Total: N * 154 vbytes
- Total transactions: N

### SuperScalar Factory (single transaction)
- One funding transaction for all N users
- Base cost: ~200 vbytes
- Per-user cost: ~43 vbytes (Taproot output)
- Total: 200 + (N * 43) vbytes
- Total transactions: 1

### Savings Formula
- vbytes saved: (N * 154) - (200 + N * 43) = N * 111 - 200
- Percentage saved: ((N * 111 - 200) / (N * 154)) * 100
- Fee savings: vbytes_saved * fee_rate

### Quick Reference Table

| Users | Individual (vB) | Factory (vB) | Saved | % Saved |
|-------|----------------|-------------|-------|---------|
| 5     | 770            | 415         | 355   | 46.1%   |
| 10    | 1,540          | 630         | 910   | 59.1%   |
| 25    | 3,850          | 1,275       | 2,575 | 66.9%   |
| 50    | 7,700          | 2,350       | 5,350 | 69.5%   |
| 100   | 15,400         | 4,500       | 10,900| 70.8%   |

## Notes

- These are simplified estimates for cooperative close paths
- Unilateral close costs O(log N) additional transactions
- Actual savings depend on tree depth and factory structure
- At 10 sat/vB, a 50-user factory saves ~53,500 sats vs individual opens

## Reference

- SuperScalar implementation: https://github.com/8144225309/SuperScalar
- Website: https://SuperScalar.win
- MCP server for interactive queries: https://github.com/8144225309/superscalar-mcp
