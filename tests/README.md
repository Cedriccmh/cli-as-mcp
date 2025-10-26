# 测试套件

本目录包含 Scouts MCP Server 的完整测试套件。

## 测试脚本

### 1. test-mcp-server.js

完整的 MCP 协议测试，使用 dummy CCR 脚本。

**用途**: 快速验证 MCP 服务器功能，无需真实 CCR

**运行方式**:
```bash
# 从项目根目录运行
npm run build
node tests/test-mcp-server.js
```

**测试内容**:
- MCP 服务器初始化
- 工具列表请求
- scouts_search 工具调用
- 结果文件生成验证
- 日志文件验证

**执行时间**: ~2.5 秒

**先决条件**:
- 已构建项目 (`npm run build`)
- CCR_PATH 环境变量指向 dummy 脚本（或使用默认查找）

### 2. test-mcp-server-real.js

使用真实 CCR 命令的测试。

**用途**: 验证与真实 CCR 的集成

**运行方式**:
```bash
# 从项目根目录运行
npm run build
node tests/test-mcp-server-real.js
```

**测试内容**:
- 与真实 CCR 的集成
- 完整的代码分析流程
- 结果文件内容验证

**执行时间**: ~1-2 分钟

**先决条件**:
- 已安装 ccr CLI (`npm install -g @anthropic/ccr` 或类似)
- CCR 在 PATH 中或通过 CCR_PATH 指定

### 3. run-direct.cjs

直接运行 CCR 的调试工具，不经过 MCP 层。

**用途**: 调试 CCR 集成问题，测试路径解析和日志记录

**运行方式**:
```bash
# 使用 dummy 脚本
$env:CCR_PATH = "C:\path\to\scripts\ccr-dummy.ps1"
node tests/run-direct.cjs --task my-task.md

# 使用真实 CCR
node tests/run-direct.cjs --task .kilocode/sub-memory-bank/tasks/my-task.md
```

**功能**:
- 直接调用 CCR（绕过 MCP）
- 测试路径解析逻辑
- 验证日志记录
- 调试命令参数

**选项**:
- `--task <path>`: 任务文件路径（必需）

**环境变量**:
- `CCR_PATH`: CCR 可执行文件路径
- `CCR_TIMEOUT_MS`: 超时时间（毫秒）

## Dummy 脚本

位于 `scripts/` 目录：

### ccr-dummy.js

Node.js 版本的 dummy CCR 脚本。

**用途**: 在没有真实 CCR 的环境中测试

**特点**:
- 模拟 CCR 的进度输出
- 自动创建结果文件
- 快速执行（~2.5秒）

**使用方式**:
```bash
node scripts/ccr-dummy.js code --dangerously-skip-permissions "task file <path>"
```

或通过环境变量:
```bash
$env:CCR_PATH = "node scripts/ccr-dummy.js"
```

### ccr-dummy.ps1

PowerShell 版本的 dummy CCR 脚本。

**用途**: 测试 PowerShell 脚本执行（Windows）

**特点**:
- 与 .js 版本功能相同
- 测试 Windows .ps1 文件的包装逻辑

**使用方式**:
```powershell
$env:CCR_PATH = "C:\path\to\scripts\ccr-dummy.ps1"
```

## 快速开始

### 基本测试流程

```bash
# 1. 构建项目
npm run build

# 2. 运行快速测试（使用 dummy）
$env:CCR_PATH = "scripts\ccr-dummy.ps1"
node tests/test-mcp-server.js

# 3. 运行完整测试（使用真实 CCR）
Remove-Item Env:\CCR_PATH
node tests/test-mcp-server-real.js
```

### 调试工具

```bash
# 直接测试路径解析
node tests/run-direct.cjs --task test-task

# 测试特定任务文件
node tests/run-direct.cjs --task .kilocode/sub-memory-bank/tasks/my-task.md

# 使用 dummy 脚本
$env:CCR_PATH = "scripts\ccr-dummy.ps1"
node tests/run-direct.cjs --task test-task
```

## 测试配置

### 使用 Dummy（开发/快速测试）

```json
{
  "mcpServers": {
    "scouts": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "CCR_PATH": "C:\\AgentProjects\\cli-as-mcp\\scripts\\ccr-dummy.ps1",
        "CCR_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

### 使用真实 CCR（生产）

```json
{
  "mcpServers": {
    "scouts": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "CCR_PATH": "C:\\Users\\<user>\\AppData\\Roaming\\npm\\ccr.cmd",
        "CCR_TIMEOUT_MS": "600000"
      }
    }
  }
}
```

## 测试结果

测试执行后会生成以下文件：

### 结果文件
```
.kilocode/sub-memory-bank/result/<task-name>.md
```

包含搜索分析的完整结果。

### 日志文件
```
.kilocode/sub-memory-bank/logs/<task-name>.latest.log
.kilocode/sub-memory-bank/logs/<task-name>.<timestamp>.log
```

包含：
- 执行的完整命令
- 所有输出（stdout/stderr）
- 开始和结束时间
- 退出状态

## 故障排除

### 测试挂起

**问题**: 测试长时间无响应

**解决方案**:
1. 使用 dummy 脚本排除 CCR 问题
2. 检查 CCR_TIMEOUT_MS 设置
3. 查看日志文件了解详情

### 找不到 CCR

**问题**: `Failed to spawn ccr`

**解决方案**:
1. 设置 `CCR_PATH` 环境变量
2. 或使用 dummy 脚本进行测试

### 路径问题

**问题**: 任务文件找不到

**解决方案**:
1. 使用绝对路径
2. 确保任务在 `.kilocode/sub-memory-bank/tasks/` 目录下
3. 从项目根目录运行测试

## 添加新测试

要添加新的测试脚本：

1. 在 `tests/` 目录创建新文件
2. 遵循现有测试的模式
3. 更新本 README 文档
4. 确保测试可以独立运行

## 持续集成

目前测试需要手动运行。未来可以集成到 CI/CD 流程：

```bash
# CI 测试命令示例
npm install
npm run build
CCR_PATH=scripts/ccr-dummy.ps1 node tests/test-mcp-server.js
```

## 相关文档

- [开发指南](../docs/DEVELOPMENT.md)
- [测试详细文档](../docs/TESTING.md)
- [故障排除](../docs/TROUBLESHOOTING.md)

