# Scouts Search System

## Overview

Scouts is a parallel hybrid search engine optimized for large codebase understanding and analysis.

**Architecture:**

- Scouts operates with multiple "Intent Workers", each handling an independent search objective
- Each intent can search across different domains (codebase, documentation, commit history) in parallel
- Results are consolidated into a single markdown file at `.kilocode/sub-memory-bank/report/yy-mm-dd-[topic].md`

## When to Use Scouts

| Scenario | Use Case | Recommended Domains |
| --- | --- | --- |
| **Feature Design** | Understand current architecture and interfaces for better integration | Code module interfaces, documentation |
| **Debugging** | Understand code execution flow to pinpoint issues | Recent commit history, code call chains |
| **Refactoring** | Understand runtime logic to design modification strategy | Code call chains, architecture |

## Workflow

### 1. Create Search Task

Create a task file at `.kilocode/sub-memory-bank/tasks/yy-mm-dd-[topic].md` with the following structure:

```markdown
/scouts:withScout

# [Task Name]

- **task_description**: Describe what to search for or analyze
- **task_type**: Determines search strategy (feature / bug / refactor)
- **intents**: 2-3 specific search objectives for parallel execution
- **domains**: Specify search scope (codebase / doc / commit_history)
- **file_types**: Limit file types (e.g., .py, .h, .cpp, .js)
- **context**: Background information to help Scout infer context
```

### 2. Execute Search

Run the following command in your terminal:

```bash
ccr code --dangerously-skip-permissions 'task file `.kilocode/sub-memory-bank/tasks/yy-mm-dd-[topic].md`'
```

This command triggers parallel Scout tasks and consolidates the output into a summary document.

### 3. Read Results

Access the consolidated results at: `.kilocode/sub-memory-bank/result/yy-mm-dd-[topic].md`

## Best Practices

- Define 2-3 focused intents for optimal parallel performance
- Specify relevant domains to narrow search scope
- Provide context to improve search accuracy and relevance
- Use descriptive task names for easy result identification

<aside>
💡

Tip: Use Scouts before any major design, debug, or refactor to quickly gain a structured understanding of your system.

</aside>