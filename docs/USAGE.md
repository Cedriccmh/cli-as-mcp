# 使用指南

## 快速开始

### 1. 安装依赖

```bash
npm install
npm run build
```

### 2. 配置 MCP 客户端

在你的 MCP 客户端配置文件中添加（例如 Claude Desktop 的配置）：

```json
{
  "mcpServers": {
    "scouts": {
      "command": "node",
      "args": ["/absolute/path/to/cli-as-mcp/dist/server.js"],
      "env": {
        "CCR_PATH": "ccr",
        "CCR_TIMEOUT_MS": "600000"
      }
    }
  }
}
```

### 3. 创建搜索任务

在项目根目录下创建任务文件：

```bash
.kilocode/sub-memory-bank/tasks/my-search.md
```

任务文件格式：

```markdown
/scouts:withScout

# 搜索任务名称

**task_description**: 描述你要搜索或分析的内容

**task_type**: feature | bug | refactor

**intents**: 
1. 第一个搜索目标
2. 第二个搜索目标
3. 第三个搜索目标

**domains**: codebase | doc | commit_history

**file_types**: .ts,.js,.py

**context**: 背景信息，帮助理解上下文
```

### 4. 执行搜索

在 MCP 客户端中调用 `scouts_search` 工具：

```
taskPath: .kilocode/sub-memory-bank/tasks/my-search.md
```

或使用相对路径：
```
taskPath: my-search.md
```

### 5. 查看结果

结果文件会生成在：
```
.kilocode/sub-memory-bank/result/my-search.md
```

日志文件位于：
```
.kilocode/sub-memory-bank/logs/my-search.latest.log
.kilocode/sub-memory-bank/logs/my-search.<timestamp>.log
```

## 任务类型说明

### Feature（特性设计）

用于理解现有架构以便更好地集成新功能。

**推荐搜索域**：
- codebase（代码模块接口）
- doc（文档）

**示例**：
```markdown
/scouts:withScout

# 添加用户认证功能

**task_description**: 了解现有的认证和会话管理机制

**task_type**: feature

**intents**:
1. 查找现有的用户认证相关代码
2. 查找会话管理的实现
3. 查找权限控制的实现

**domains**: codebase, doc

**file_types**: .ts,.js

**context**: 需要添加新的 OAuth 认证方式
```

### Bug（问题调试）

用于理解代码执行流程以定位问题。

**推荐搜索域**：
- commit_history（最近的提交历史）
- codebase（代码调用链）

**示例**：
```markdown
/scouts:withScout

# 修复内存泄漏问题

**task_description**: 定位内存泄漏的原因

**task_type**: bug

**intents**:
1. 查找事件监听器的注册和清理
2. 查找定时器的使用
3. 查找最近修改的相关代码

**domains**: codebase, commit_history

**file_types**: .ts,.js

**context**: 生产环境中观察到内存持续增长
```

### Refactor（重构）

用于理解运行时逻辑以设计修改策略。

**推荐搜索域**：
- codebase（代码调用链、架构）

**示例**：
```markdown
/scouts:withScout

# 重构数据库访问层

**task_description**: 理解当前数据库访问模式

**task_type**: refactor

**intents**:
1. 查找所有数据库查询代码
2. 查找数据模型定义
3. 查找事务处理逻辑

**domains**: codebase

**file_types**: .ts,.js

**context**: 计划从直接 SQL 迁移到 ORM
```

## 环境变量

### CCR_PATH

指定 ccr 可执行文件的路径。

**默认值**：`ccr`（从 PATH 中查找）

**示例**：
- Windows: `C:\Users\<user>\AppData\Roaming\npm\ccr.cmd`
- Linux/Mac: `/usr/local/bin/ccr`

**测试用法**：指向 dummy 脚本进行快速测试
```json
"CCR_PATH": "C:\\path\\to\\scripts\\ccr-dummy.ps1"
```

### CCR_TIMEOUT_MS

CCR 执行的超时时间（毫秒）。

**默认值**：`600000`（10 分钟）

**建议值**：
- 生产环境：`600000`（10 分钟）
- 开发测试：`30000`（30 秒）

## 路径解析

`scouts_search` 工具支持多种路径格式：

### 绝对路径
```
C:\Projects\my-project\.kilocode\sub-memory-bank\tasks\my-task.md
```

### 相对路径（相对于当前工作目录）
```
.kilocode/sub-memory-bank/tasks/my-task.md
```

### 短名称（自动在 tasks 目录下查找）
```
my-task.md
my-task  (自动添加 .md)
```

### 带 @ 前缀（@会被移除）
```
@my-task.md
```

## 错误处理

### 任务文件不存在

**错误信息**：`taskPath not found. Given: <path>`

**解决方案**：
- 检查路径是否正确
- 确保文件存在
- 使用绝对路径重试

### 任务文件不在 tasks 目录下

**错误信息**：`taskPath must be under a 'tasks' directory`

**解决方案**：
- 确保任务文件在 `.kilocode/sub-memory-bank/tasks/` 目录下
- 这是规范要求，result 和 logs 路径基于 tasks 路径计算

### CCR 命令不存在

**错误信息**：`Failed to spawn ccr`

**解决方案**：
- 安装 ccr：`npm install -g @anthropic/ccr`
- 或设置 `CCR_PATH` 环境变量指向正确路径
- 测试时可以使用 dummy 脚本

### 执行超时

**错误信息**：`ccr timed out after <ms>ms`

**解决方案**：
- 增加 `CCR_TIMEOUT_MS` 值
- 简化搜索任务（减少 intents）
- 限制搜索范围（file_types、domains）

## 最佳实践

### 1. 任务设计

- **专注性**：每个任务关注一个具体目标
- **并行性**：定义 2-3 个可并行执行的 intents
- **相关性**：确保 intents 之间有相关性但不重复

### 2. 搜索域选择

- **codebase**：最常用，搜索源代码
- **doc**：当需要理解设计意图时
- **commit_history**：调试最近引入的问题时

### 3. 文件类型限制

指定相关的文件类型可以提高搜索效率：
```
.ts,.tsx          # TypeScript/React
.js,.jsx          # JavaScript/React
.py               # Python
.java             # Java
.cpp,.h           # C++
```

### 4. 上下文提供

提供充分的上下文信息帮助 Scout 理解：
- 问题背景
- 已知信息
- 预期目标
- 约束条件

## 日志调试

查看详细的执行日志：

```bash
# 最新日志（每次执行覆盖）
cat .kilocode/sub-memory-bank/logs/<task-name>.latest.log

# 历史日志（带时间戳）
ls .kilocode/sub-memory-bank/logs/<task-name>.*.log
```

日志内容包括：
- 执行的完整命令
- 工作目录
- 所有输出（stdout/stderr）
- 开始和结束时间
- 退出状态

## 示例项目结构

```
my-project/
├── .kilocode/
│   └── sub-memory-bank/
│       ├── tasks/              # 搜索任务文件
│       │   ├── auth-analysis.md
│       │   ├── bug-memory-leak.md
│       │   └── refactor-db.md
│       ├── result/             # 搜索结果（自动生成）
│       │   ├── auth-analysis.md
│       │   ├── bug-memory-leak.md
│       │   └── refactor-db.md
│       └── logs/               # 执行日志（自动生成）
│           ├── auth-analysis.latest.log
│           ├── auth-analysis.2025-10-25T10-30-00-000Z.log
│           └── ...
├── src/                        # 你的源代码
└── ...
```

