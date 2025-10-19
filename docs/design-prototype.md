###  Parallel Hybrid(Semantic and Symbolic) Search System

```bash
# Create task
write_to_file '/tr:withScout

# Search for [TOPIC]

Find all code related to [TOPIC] and create report at:
`.scouts/reports/[topic]-report.md`
' > .scouts/tasks/[topic].md

# Execute in terminal
claude --dangerously-skip-permissions "prompt path .scouts/tasks/yy-mm-dd-hh-[topic].md

# Read results
read_file .scouts/tasks/yy-mm-dd-hh-[topic].md
```
    
## 📝 Minimal Task Template

**Simplest working task:**

```markdown
/tr:withScout

# [Task Name]

[Describe what to search for or analyze]

Deliverables:
- Create report at `.scouts/reports/latest/[name]-report.md`
```

**Example:**

```markdown
/tr:withScout

# Find Error Handling

Search for all error handling code (try-catch, throw, error classes).

Deliverables:
- Create report at `.scouts/reports/latest/error-handling-report.md`
```

---
## 🚀 Common Patterns for Agents "I need context about X"

---

## ✅ Task Quality Checklist

**Minimum requirements for good results:**

~~- [ ] First line: `/tr:withScout`~~ auto implement in mcp

- [ ] Clear description of what to search/analyze
- [ ] 2-3 distinct search intent for parallel scouts

~~- [ ] Specific output path in `.scouts/reports/latest/`~~ auto implement in mcp
~~- [ ] Request file paths with line numbers~~ auto implement in mcp


**Optional but recommended:**

- [ ] Context section explaining why
- [ ] Numbered search tasks
- [ ] Constraints (what to exclude)
- [ ] Specific deliverable format

---




