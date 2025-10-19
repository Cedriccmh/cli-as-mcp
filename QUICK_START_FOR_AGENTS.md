# Quick Start Guide for AI Agents

**Purpose:** Fast reference for AI assistants to use Claude CLI context collection system

---

## 🎯 Quick Command Reference

### Execute a Task

```bash
# Using helper script (recommended)
.claude-tasks/run-task.ps1 -TaskName <task-file-name>  # Windows
./.claude-tasks/run-task.sh <task-file-name>           # Linux/Mac

# Direct execution
claude --dangerously-skip-permissions "prompt path <absolute-path-to-task.md>"
```

### Common Task Locations

```
.claude-tasks/tasks/pending/       ← Ready to execute
.claude-tasks/tasks/templates/     ← Templates to copy
.claude-tasks/reports/latest/      ← Generated reports
llmdoc/agent/                      ← Scout detail reports
```

---

## 📋 Workflow Cheat Sheet

### 1. Quick Search

```bash
# Create simple task
echo '/tr:withScout

# Search for [TOPIC]

Find all code related to [TOPIC] and create report at:
`.claude-tasks/reports/latest/[topic]-report.md`
' > .claude-tasks/tasks/pending/search-[topic].md

# Execute
claude --dangerously-skip-permissions "prompt path .claude-tasks/tasks/pending/search-[topic].md"

# Read results
cat .claude-tasks/reports/latest/[topic]-report.md
```

### 2. Use Template

```bash
# Copy template
cp .claude-tasks/tasks/templates/search-analysis.md \
   .claude-tasks/tasks/pending/my-task.md

# Edit as needed
# [Customize the task file]

# Execute
claude --dangerously-skip-permissions "prompt path .claude-tasks/tasks/pending/my-task.md"
```

### 3. One-Liner for Simple Searches

```bash
echo '/tr:withScout
# Find authentication code
Search for authentication-related code and report to `.claude-tasks/reports/latest/auth-search.md`' | \
claude --dangerously-skip-permissions
```

---

## 📝 Minimal Task Template

**Simplest working task:**

```markdown
/tr:withScout

# [Task Name]

[Describe what to search for or analyze]

Deliverables:
- Create report at `.claude-tasks/reports/latest/[name]-report.md`
```

**Example:**

```markdown
/tr:withScout

# Find Error Handling

Search for all error handling code (try-catch, throw, error classes).

Deliverables:
- Create report at `.claude-tasks/reports/latest/error-handling-report.md`
```

---

## 🎨 Available Templates

| Template | Use Case | Command |
|----------|----------|---------|
| `search-analysis.md` | General codebase search | `cp .claude-tasks/tasks/templates/search-analysis.md ...` |
| `documentation-audit.md` | Doc review | `cp .claude-tasks/tasks/templates/documentation-audit.md ...` |
| `dependency-analysis.md` | Dependencies | `cp .claude-tasks/tasks/templates/dependency-analysis.md ...` |
| `refactoring-research.md` | Pre-refactor | `cp .claude-tasks/tasks/templates/refactoring-research.md ...` |
| `bug-investigation.md` | Debugging | `cp .claude-tasks/tasks/templates/bug-investigation.md ...` |
| `security-audit.md` | Security review | `cp .claude-tasks/tasks/templates/security-audit.md ...` |

---

## 🚀 Common Patterns for Agents

### Pattern 1: "I need context about X"

```bash
# 1. Create task
cat > .claude-tasks/tasks/pending/understand-x.md << 'EOF'
/tr:withScout
# Understand X
Search for all code related to X. Document its purpose, implementation, and usage.
Deliverables: `.claude-tasks/reports/latest/x-analysis-report.md`
EOF

# 2. Execute
claude --dangerously-skip-permissions "prompt path $(pwd)/.claude-tasks/tasks/pending/understand-x.md"

# 3. Read and use context
CONTEXT=$(cat .claude-tasks/reports/latest/x-analysis-report.md)
```

### Pattern 2: "Before I modify Y..."

```bash
# Use refactoring template
cp .claude-tasks/tasks/templates/refactoring-research.md \
   .claude-tasks/tasks/pending/research-y.md

# Customize target area in the file
# Execute and review impact before making changes
```

### Pattern 3: "Find all places where Z is used"

```bash
echo '/tr:withScout
# Find Z Usage
Search for all usage of Z (imports, calls, references).
Include file paths with line numbers.
Deliverables: `.claude-tasks/reports/latest/z-usage-report.md`' \
> .claude-tasks/tasks/pending/z-usage.md

claude --dangerously-skip-permissions "prompt path $(pwd)/.claude-tasks/tasks/pending/z-usage.md"
```

---

## ✅ Task Quality Checklist

**Minimum requirements for good results:**

- [ ] First line: `/tr:withScout`
- [ ] Clear description of what to search/analyze
- [ ] Specific output path in `.claude-tasks/reports/latest/`
- [ ] Request file paths with line numbers
- [ ] 2-3 distinct search areas for parallel scouts

**Optional but recommended:**

- [ ] Context section explaining why
- [ ] Numbered search tasks
- [ ] Constraints (what to exclude)
- [ ] Specific deliverable format

---

## 🎯 Output Locations

```
.claude-tasks/reports/latest/       ← YOUR MAIN REPORTS GO HERE
    ├── [task-name]-report.md       ← Comprehensive analysis
    └── [other-task]-report.md

llmdoc/agent/                       ← DETAILED SCOUT REPORTS
    ├── [area1]-analysis.md         ← Scout 1 details
    ├── [area2]-analysis.md         ← Scout 2 details
    └── [area3]-analysis.md         ← Scout 3 details
```

**Always check BOTH locations** for complete information!

---

## ⚡ Pro Tips for Agents

1. **Reuse Results:** Read existing reports before creating new tasks
2. **Chain Tasks:** Use results from one task to inform the next
3. **Be Specific:** More specific requests = better results
4. **Line Numbers:** Always request file paths with line numbers
5. **Archive:** Move completed tasks to keep pending/ clean
6. **Templates:** Start with templates, customize as needed
7. **Scout Reports:** Don't ignore the detailed reports in `llmdoc/agent/`

---

## 🔍 Finding Existing Information

Before creating a new task:

```bash
# Check for existing reports
ls -lt .claude-tasks/reports/latest/

# Check for existing scout reports
ls -lt llmdoc/agent/

# Search report contents
grep -r "search term" .claude-tasks/reports/latest/
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Command not found | Check `claude` CLI is installed and in PATH |
| Permission denied | Use `--dangerously-skip-permissions` flag |
| No report generated | Check task file has output path specified |
| Scouts not running | Verify `/tr:withScout` is on first line |
| Report path wrong | Use absolute or relative path from repo root |

---

## 📚 Full Documentation

For complete documentation, see:
- **Full Guide:** `llmdoc/CLAUDE_CLI_CONTEXT_COLLECTION.md`
- **Directives:** `.claude-tasks/config/directives.md`
- **Templates:** `.claude-tasks/tasks/templates/`

---

## 🎓 Learning by Example

**Example 1: Simple search**
```markdown
/tr:withScout
# Find HTTP requests
Search for all HTTP client usage (fetch, axios, request libraries).
Deliverables: `.claude-tasks/reports/latest/http-requests-report.md`
```

**Example 2: Complex analysis**
```markdown
/tr:withScout
# Database Layer Analysis
Analyze database interactions:
1. Connection management
2. Query patterns
3. Transaction handling
4. Migration system
Deliverables: `.claude-tasks/reports/latest/database-analysis-report.md`
Include file paths, patterns, and recommendations.
```

**Example 3: Pre-refactoring**
```markdown
/tr:withScout
# Impact Analysis for UserService Refactor
Target: src/services/UserService.ts

Find:
1. All usage of UserService
2. Dependencies and dependents
3. Test coverage
4. Similar patterns

Deliverables: `.claude-tasks/reports/latest/userservice-impact-report.md`
Quantify impact (# of files affected) and suggest migration approach.
```

---

**Quick Start Version:** 1.0  
**Last Updated:** 2025-10-19  
**For Full Docs:** See `llmdoc/CLAUDE_CLI_CONTEXT_COLLECTION.md`




