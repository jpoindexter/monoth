# Agentic Identity & Trust Patterns

Extracted from msitarzewski/agency-agents (12.4K stars). Relevant to AgentSmith, Agent Permissions Management, and CALIBRATE products.

## Zero-Trust Agent Principles
1. Never trust self-reported identity — require cryptographic proof
2. Never trust self-reported authorization — require verifiable delegation chain
3. Never trust mutable logs — append-only or worthless for audit
4. Assume compromise — design assuming at least one agent is compromised

## Penalty-Based Trust Scoring Model
- Start at 1.0, only verifiable problems reduce score
- Evidence chain integrity breach: -0.5 (heaviest)
- Outcome verification failures: -(failure_rate * 0.4)
- Credential staleness (>90 days): -0.1
- Trust levels: HIGH (0.9+), MODERATE (0.5-0.89), LOW (0.01-0.49), NONE (0)
- No self-reported signals affect score

## Delegation Chain Verification
- Each link signed by delegator, scoped to specific actions
- Scope must be equal or narrower than parent (no escalation)
- Temporal validity check (expired = invalid)
- Broken link = entire chain invalid (fail-closed)

## Evidence Records (Tamper-Evident)
- Append-only, each record links to previous via SHA-256 hash
- Fields: agent_id, action_type, intent, decision, outcome, timestamp, prev_record_hash
- Canonical JSON serialization for deterministic hashing
- Agent signs each record with its key

## Peer Verification Protocol (5 checks, ALL must pass)
1. Cryptographic identity verification
2. Credential expiry check
3. Scope covers requested action
4. Trust score >= 0.5
5. Delegation chain valid (if delegated)

## Threat Model Questions (ask before designing)
1. How many agents interact? (2 vs 200 changes everything)
2. Do agents delegate to each other?
3. Blast radius of forged identity? (money? code? physical?)
4. Who is the relying party?
5. Key compromise recovery path?
6. Compliance regime?

## Crypto Hygiene
- Established standards only, no custom crypto
- Separate signing/encryption/identity keys
- Plan for post-quantum migration (algorithm agility)
- Key material never in logs, evidence, or API responses
