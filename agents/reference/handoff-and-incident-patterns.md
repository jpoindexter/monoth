# Agent Handoff & Incident Response Patterns

Extracted from msitarzewski/agency-agents (12.4K stars).

## Bounded Retry Loop (3-attempt max)
- QA FAIL includes: exact issue description, expected vs actual, fix instructions, specific files
- Each retry is scoped: "Fix ONLY the issues listed, do NOT introduce new features"
- After 3 failures: escalation report with root cause analysis across all 3 attempts
- Escalation options: reassign, decompose, revise approach, accept with limitations, defer

## Structured Handoff Template (agent-to-agent)
Key fields that prevent context loss:
- Current state (what's been completed)
- Relevant files with descriptions
- Dependencies and constraints
- Acceptance criteria (measurable)
- Evidence required (proof of completion)
- Who receives output next and what format they need

## Incident Severity Classification
| Level | Definition | Response Time |
|-------|-----------|---------------|
| P0 | Service down, data loss, security breach | Immediate |
| P1 | Major feature broken, 50%+ error rate | < 1 hour |
| P2 | Minor feature broken, workaround exists | < 4 hours |
| P3 | Cosmetic, minor inconvenience | Next sprint |

## Incident Response Sequence
1. Detection & Triage (0-5 min): classify severity, activate response team
2. Investigation (5-30 min): parallel investigation across infra/backend/devops
3. Mitigation (15-60 min): decision tree based on cause type
4. Resolution Verification: evidence of fix, 30-min monitoring post-fix
5. Post-Mortem (within 48h): timeline, 5 Whys, prevention measures, action items

## Escalation Triggers
- P0 unresolved in 30 min → additional resources
- Data breach suspected → legal/compliance notification
- User data affected → GDPR/CCPA notification assessment
- Revenue impact above threshold → business impact assessment

## Reality Checker QA Pattern
- Default to "NEEDS WORK" — require overwhelming evidence for production approval
- Automatic fail triggers: "zero issues found", perfect scores without evidence, premium claims for basic implementations
- First implementations typically need 2-3 revision cycles
- C+/B- ratings are normal and acceptable
- Evidence-based: every claim needs visual proof, cross-reference with actual implementation
