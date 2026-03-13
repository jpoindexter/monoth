# Claude Skills — Complete Reference

Extracted from "The Complete Guide to Building Skills for Claude" (Anthropic, 2025).

## Skill Structure
```
my-skill/
  SKILL.md          # Required. YAML frontmatter + instructions
  scripts/           # Optional. Validation scripts, helpers
  references/        # Optional. Detailed docs loaded on demand
  assets/            # Optional. Templates, configs
```

## YAML Frontmatter (Required)
```yaml
---
name: my-skill-name          # kebab-case, required, no spaces/capitals, no "claude"/"anthropic"
description: |                # Required, <1024 chars
  [What it does] + [When to use it] + [Key capabilities]
license: MIT                  # Optional
compatibility: "1-500 chars"  # Optional
metadata:                     # Optional
  key: value
---
```

## Two Skill Approaches
1. **Problem-first**: "I need to set up a workspace" — skill orchestrates MCP calls in right sequence. Users describe outcomes.
2. **Tool-first**: "I have Notion MCP connected" — skill teaches Claude optimal workflows/best practices. Users have access.

## 5 Design Patterns

### Pattern 1: Sequential Workflow Orchestration
Use when: multi-step processes in specific order.
Key: explicit step ordering, dependencies between steps, validation at each stage, rollback for failures.

### Pattern 2: Multi-MCP Coordination
Use when: workflows span multiple services (Figma → Drive → Linear → Slack).
Key: clear phase separation, data passing between MCPs, validation before next phase, centralized error handling.

### Pattern 3: Iterative Refinement
Use when: output quality improves with iteration (report generation).
Key: explicit quality criteria, validation scripts, refinement loop, know when to stop.

### Pattern 4: Context-Aware Tool Selection
Use when: same outcome, different tools depending on context (file storage routing).
Key: clear decision criteria, fallback options, transparency about choices.

### Pattern 5: Domain-Specific Intelligence
Use when: skill adds specialized knowledge beyond tool access (financial compliance).
Key: domain expertise embedded in logic, compliance before action, comprehensive documentation, clear governance.

## Description Field — Critical for Triggering
- Too generic ("Helps with projects") = never triggers
- Must include trigger phrases users would actually say
- Include relevant file types if applicable
- Add negative triggers to prevent false matches: "Do NOT use for [X]"
- Debug: ask Claude "When would you use [skill name] skill?" — it quotes the description back

## Troubleshooting

### Skill won't upload
- File must be named exactly `SKILL.md` (case-sensitive)
- YAML must use `---` delimiters, proper quoting

### Skill doesn't trigger
- Description too generic or missing trigger phrases
- Fix: revise description with specific use cases

### Skill triggers too often
- Add negative triggers in description
- Be more specific about scope

### Instructions not followed
- Instructions too verbose → use bullet points, numbered lists
- Instructions buried → put critical ones at top with ## headers
- Ambiguous language → be explicit ("CRITICAL: Before calling X, verify: [list]")
- Model laziness → add "## Performance Notes: Take your time, quality > speed"
- For critical validations: bundle a script instead of language instructions

### MCP connection issues
- Verify MCP server connected (Settings > Extensions)
- Check auth (API keys, OAuth tokens, permissions)
- Test MCP independently without skill
- Verify tool names are case-sensitive match

### Large context issues
- Keep SKILL.md under 5,000 words
- Move detailed docs to references/ (loaded on demand)
- Don't enable more than 20-50 skills simultaneously
- Consider skill "packs" for related capabilities

## Distribution
- **Claude.ai**: Settings > Capabilities > Skills > Upload folder
- **Claude Code**: Skills in project directory
- **API**: `/v1/skills` endpoint, `container.skills` parameter in Messages API
- **Org-level**: Admin-deployed workspace-wide (shipped Dec 2025)

## All Optional YAML Fields
```yaml
name: skill-name
description: [required]
license: MIT
allowed-tools: "Bash(python:*) Bash(npm:*) WebFetch"  # Restrict tool access
metadata:
  author: Company Name
  version: 1.0.0
  mcp-server: server-name
  category: productivity
  tags: [project-management, automation]
  documentation: https://example.com/docs
  support: support@example.com
```

## Quick Checklist

### Before you start
- [ ] 2-3 concrete use cases identified
- [ ] Tools identified (built-in or MCP)
- [ ] Reviewed guide and example skills
- [ ] Planned folder structure

### During development
- [ ] Folder named in kebab-case
- [ ] SKILL.md file exists (exact spelling)
- [ ] YAML frontmatter has --- delimiters
- [ ] name: kebab-case, no spaces, no capitals
- [ ] description includes WHAT and WHEN
- [ ] No XML tags (< >) anywhere
- [ ] Instructions clear and actionable
- [ ] Error handling included
- [ ] Examples provided
- [ ] References clearly linked

### Before upload
- [ ] Tested triggering on obvious tasks
- [ ] Tested triggering on paraphrased requests
- [ ] Verified doesn't trigger on unrelated topics
- [ ] Functional tests pass
- [ ] Tool integration works
- [ ] Compressed as .zip file

### After upload
- [ ] Test in real conversations
- [ ] Monitor for under/over-triggering
- [ ] Collect user feedback
- [ ] Iterate on description and instructions
- [ ] Update version in metadata

## Resources
- Public skills repo: anthropic/skills (GitHub)
- Partner Skills Directory: Asana, Atlassian, Canva, Figma, Sentry, Zapier
- Document Skills: PDF, DOCX, PPTX, XLSX creation
- skill-creator skill: built into Claude.ai + Claude Code — generates skills from descriptions
- Validation: ask "Review this skill and suggest improvements"
- Bug reports: GitHub Issues at anthropic/skills/issues
- Community: Claude Developers Discord

## Testing Methodology
1. **Trigger tests**: should-trigger scenarios + should-NOT-trigger scenarios (target: 90% accuracy)
2. **Functional tests**: Given/When/Then format for each capability
3. **Performance comparison**: with-skill vs without-skill on same tasks

## Progressive Disclosure
- YAML frontmatter: always loaded (used for trigger matching)
- SKILL.md body: loaded when skill is triggered
- references/ files: loaded on demand when skill needs them
- This layering prevents context bloat
