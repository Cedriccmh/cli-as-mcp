# 开发指南

## 项目概述

Scouts MCP Server 是一个 Model Context Protocol (MCP) 服务器，它将 `ccr code` CLI 工具封装为 MCP 工具，用于大型代码库的并行混合搜索。

## 架构设计

### 核心组件

1. **MCP 服务器** (`src/server.ts`)
   - 使用 `@modelcontextprotocol/sdk` 实现 MCP 协议
   - 通过 stdio 传输层与客户端通信
   - 提供 `scouts_search` 工具

2. **CCR 集成**
   - 通过 `child_process.spawn` 调用 ccr 命令
   - 支持 Windows 的 .cmd/.bat/.ps1 脚本
   - 自动检测和包装不同类型的可执行文件

3. **路径解析**
   - 支持绝对路径和相对路径
   - 自动查找 `.kilocode/sub-memory-bank/tasks/` 目录
   - 计算对应的 result 和 logs 路径

### 工作流程

```
客户端 → MCP Server → CCR CLI → 结果文件
   ↑                              ↓
   └──────── 返回结果路径 ←────────┘
```

## CCR 命令处理

### Windows 平台特殊处理

由于 Node.js 在 `shell: false` 模式下无法直接 spawn .cmd/.bat 文件，服务器实现了以下包装：

- **.cmd/.bat**: 使用 `cmd.exe /c` 包装
- **.ps1**: 使用 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File` 包装
- **.exe**: 直接执行

### 交互式工具处理

CCR 是基于 Ink/React 的交互式 CLI 工具，可能不会自动退出。服务器实现了：

1. **stdin 处理**: 立即关闭 stdin 防止等待输入
2. **结果文件轮询**: 每 2 秒检查结果文件是否创建
3. **优雅终止**: 检测到结果文件后等待 3 秒，然后发送 SIGTERM
4. **强制终止**: SIGTERM 后 2 秒如仍在运行则发送 SIGKILL

### 超时机制

- 默认超时: 10 分钟（600000ms）
- 可通过 `CCR_TIMEOUT_MS` 环境变量配置
- 超时后自动终止进程并返回错误

## 测试

### 测试脚本

项目包含多个测试工具：

1. **ccr-dummy.js/ps1**: 模拟 ccr 的行为，用于快速测试
2. **test-mcp-server.js**: 完整的 MCP 协议测试
3. **run-direct.cjs**: 直接测试 CCR 调用，无需 MCP 层

### 运行测试

```bash
# 使用 dummy 脚本测试
npm run build
node scripts/test-mcp-server.js

# 直接测试 CCR 调用
node scripts/run-direct.cjs --task .kilocode/sub-memory-bank/tasks/test-task.md
```

### 使用 Dummy 进行开发

在 MCP 配置中设置：

```json
{
  "mcpServers": {
    "scouts": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "CCR_PATH": "C:\\path\\to\\scripts\\ccr-dummy.ps1",
        "CCR_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

## 日志系统

服务器为每次执行生成两个日志文件：

- **latest log**: `<task-name>.latest.log` - 始终指向最新执行
- **timestamped log**: `<task-name>.<timestamp>.log` - 保留历史记录

日志内容包括：
- 完整的命令和参数
- 工作目录
- 所有 stdout/stderr 输出
- 开始和结束时间
- 退出码或错误原因

## 已知问题和解决方案

### Windows .cmd 文件无法直接 spawn

**问题**: `spawn EINVAL` 错误  
**解决方案**: 使用 `cmd.exe /c` 包装

### CCR 不自动退出

**问题**: 交互式工具可能等待输入  
**解决方案**: 
1. 关闭 stdin
2. 轮询结果文件
3. 检测到完成后优雅终止

### 长时间执行反馈不足

**问题**: 10 分钟超时太长  
**解决方案**: 使用 `CCR_TIMEOUT_MS` 设置更短的超时

## 扩展建议

1. **多工具支持**: 当前只有 `scouts_search`，可以添加更多工具
2. **进度报告**: 对于长时间运行的任务，可以实现进度回调
3. **结果流式返回**: 而不是等待全部完成
4. **缓存机制**: 对于重复的搜索可以使用缓存

## 性能指标

- **服务器启动**: < 1 秒
- **工具列表响应**: < 100ms  
- **Dummy 脚本执行**: ~2.5 秒
- **真实 CCR 执行**: ~1-2 分钟（取决于任务复杂度）

## 参考资料

- [MCP 规范](https://spec.modelcontextprotocol.io/)
- [MCP SDK 文档](https://github.com/modelcontextprotocol/sdk)
- Node.js child_process 文档

