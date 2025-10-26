# 测试指南

## 测试概述

本项目包含完整的测试套件，用于验证 MCP 服务器和 CCR 集成功能。

## 测试状态

**最后测试日期**: 2025-10-25  
**版本**: 0.1.0  
**状态**: ✅ 所有测试通过

### 测试覆盖

- ✅ 项目构建和依赖安装
- ✅ MCP 协议实现
- ✅ scouts_search 工具功能
- ✅ 文件路径解析
- ✅ 结果文件生成
- ✅ 日志记录功能
- ✅ Windows 平台兼容性
- ✅ 错误处理

## 测试工具

### 1. Dummy CCR 脚本

用于快速测试，无需真实的 ccr 安装。

**JavaScript 版本**:
```bash
node scripts/ccr-dummy.js code --dangerously-skip-permissions "task file <path>"
```

**PowerShell 版本**:
```powershell
.\scripts\ccr-dummy.ps1 code --dangerously-skip-permissions "task file <path>"
```

特点：
- 模拟 ccr 的进度输出
- 自动创建结果文件
- 执行时间 ~2.5 秒

### 2. MCP 服务器测试

完整的 MCP 协议测试套件。

```bash
npm run build
node scripts/test-mcp-server.js
```

测试内容：
- 服务器初始化
- 工具列表请求
- 工具调用
- 结果文件验证
- 日志文件验证

### 3. 直接运行测试

不通过 MCP 层直接测试 CCR 调用。

```bash
node scripts/run-direct.cjs --task <task-path>
```

用途：
- 调试 CCR 集成问题
- 验证路径解析
- 测试日志记录

## 测试配置

### 使用 Dummy 脚本

**MCP 配置** (`mcp-config-test.json`):
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

### 使用真实 CCR

**MCP 配置** (`mcp-config-example.json`):
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

## 测试场景

### 场景 1: 基本功能测试

1. 创建测试任务文件
2. 调用 scouts_search
3. 验证结果文件创建
4. 检查日志内容

**预期结果**:
- 结果文件位于 `.kilocode/sub-memory-bank/result/`
- 日志文件位于 `.kilocode/sub-memory-bank/logs/`
- 所有路径正确转换 (tasks → result/logs)

### 场景 2: 路径解析测试

测试各种路径格式：
- 绝对路径
- 相对路径
- 带 `@` 前缀的路径
- 短名称（自动添加 .md）

### 场景 3: 错误处理测试

测试错误场景：
- 任务文件不存在
- 任务文件不在 tasks 目录下
- ccr 命令找不到
- ccr 执行超时

### 场景 4: Windows 兼容性测试

测试 Windows 特定功能：
- .cmd 文件执行
- .ps1 文件执行
- 路径包含空格
- 反斜杠路径分隔符

## 测试结果

### Dummy 脚本测试

- **状态**: ✅ 通过
- **执行时间**: ~2.5 秒
- **验证项**:
  - ✅ 服务器初始化
  - ✅ 工具注册
  - ✅ 工具执行
  - ✅ 结果文件创建
  - ✅ 日志记录完整

### 真实 CCR 测试

- **状态**: ✅ 通过
- **执行时间**: ~1 分钟 35 秒
- **验证项**:
  - ✅ CCR 命令执行成功
  - ✅ 生成完整的分析报告
  - ✅ 正常退出（exit code 0）
  - ✅ 无需强制终止

## 性能指标

| 操作 | 时间 |
|------|------|
| 服务器启动 | < 1 秒 |
| 工具列表响应 | < 100ms |
| Dummy 执行 | ~2.5 秒 |
| 真实 CCR 执行 | ~1-2 分钟 |
| 日志写入 | 实时，无延迟 |

## 故障排除

### 测试挂起

**症状**: 测试长时间无响应

**解决方案**:
1. 检查 `CCR_PATH` 是否正确
2. 降低 `CCR_TIMEOUT_MS` 以更快失败
3. 使用 dummy 脚本排除 CCR 问题
4. 查看日志文件了解详情

### 结果文件未创建

**症状**: 工具执行完成但没有结果文件

**解决方案**:
1. 检查任务文件路径是否在 `tasks` 目录下
2. 验证文件权限
3. 查看日志中的错误信息

### Windows 路径问题

**症状**: 路径解析错误或找不到文件

**解决方案**:
1. 使用绝对路径测试
2. 确保路径使用双反斜杠 `\\` 或正斜杠 `/`
3. 检查路径中是否有特殊字符

## 持续测试

### 在开发中

每次修改代码后运行：
```bash
npm run build
node scripts/test-mcp-server.js
```

### 在提交前

完整测试流程：
```bash
# 1. 构建
npm run build

# 2. Dummy 测试
node scripts/test-mcp-server.js

# 3. 真实 CCR 测试（如果已安装）
node scripts/run-direct.cjs --task .kilocode/sub-memory-bank/tasks/real-ccr-test.md
```

## 测试文件结构

```
scripts/
├── ccr-dummy.js           # Node.js dummy 脚本
├── ccr-dummy.ps1          # PowerShell dummy 脚本
├── test-mcp-server.js     # MCP 服务器测试
├── test-mcp-server-real.js # 真实 CCR 测试
└── run-direct.cjs         # 直接调用测试

.kilocode/sub-memory-bank/
├── tasks/
│   ├── test-task.md       # 测试任务
│   └── real-ccr-test.md   # 真实 CCR 测试任务
├── result/                # 生成的结果
└── logs/                  # 执行日志
```

## 未来改进

1. **单元测试**: 添加针对各个函数的单元测试
2. **集成测试**: 更多的集成测试场景
3. **性能测试**: 测量各种负载下的性能
4. **自动化**: CI/CD 集成

