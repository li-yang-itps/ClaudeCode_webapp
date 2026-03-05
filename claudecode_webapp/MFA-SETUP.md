# Claude File Uploader - MFA 凭证更新指南

## 问题说明

你的 AWS 账户启用了 MFA（多因素认证）和 MFAEnforcedSelfManagementPolicy。这意味着需要使用临时凭证（通过 MFA 验证获得）来访问 Bedrock API。

## 解决方案

### 方案 A: 使用自动启动脚本（推荐）

#### 第一次设置

1. **编辑 `.env` 文件**
   - 打开 `C:\Users\li.yang\Desktop\claude-file-uploader\.env`
   - 确保 `AWS_PROFILE=atc_env` 已配置
   - 保存文件

2. **运行 MFA 更新脚本**

   **使用 CMD:**
   ```bash
   cd C:\Users\li.yang\.claude
   python update_aws_credentials.py
   ```

   **或使用提供的批处理文件:**
   - 双击 `start-with-mfa.bat` (适合 CMD)
   - 或运行 `start-with-mfa.ps1` (适合 PowerShell)

3. **输入 MFA 代码**
   - 系统会提示输入 6 位 MFA 代码
   - 输入你的 MFA 设备上显示的 6 位数字
   - 脚本会将临时凭证保存到 `~/.claude/settings.json`

4. **启动应用**
   ```bash
   npm start
   ```

#### 后续使用

每次使用应用前，凭证可能过期，需要重新更新：

1. **运行更新脚本:**
   ```bash
   # 使用自动启动脚本（推荐）
   start-with-mfa.bat        # CMD 用户
   # 或
   .\start-with-mfa.ps1      # PowerShell 用户
   ```

2. **或手动更新:**
   ```bash
   cd C:\Users\li.yang\.claude
   python update_aws_credentials.py
   # 输入 MFA 代码
   npm start    # 返回项目目录后启动
   ```

### 方案 B: 手动管理凭证

如果你更喜欢手动管理凭证：

1. 运行 `python update_aws_credentials.py` 获取临时凭证
2. 将凭证复制到 `.env` 文件
3. 启动应用

## 凭证有效期

- 临时凭证有效期：**12 小时**（从 `update_aws_credentials.py` 中的 `duration_seconds` 配置）
- 超过 12 小时后需要重新运行更新脚本

## 快速参考

| 动作 | 命令 |
|------|------|
| 更新凭证 | `python C:\Users\li.yang\.claude\update_aws_credentials.py` |
| 启动应用（自动更新） | `C:\Users\li.yang\Desktop\claude-file-uploader\start-with-mfa.bat` |
| 启动应用（PowerShell） | `C:\Users\li.yang\Desktop\claude-file-uploader\start-with-mfa.ps1` |
| 直接启动应用 | `npm start` |

## 故障排除

### 问题：MFA 代码错误
- 确保输入的是 6 位数字
- 确保代码还未过期（通常 30 秒有效期）
- 重新运行脚本并输入新代码

### 问题：仍然收到授权错误
- 检查凭证是否已正确更新
- 查看 `~/.claude/settings.json` 中的 `AWS_SESSION_TOKEN` 是否最近更新
- 确保凭证未过期（12 小时）

### 问题：脚本无法找到 Python
- 确保 Python 已安装并添加到 PATH
- 使用完整路径运行：`python.exe C:\path\to\script.py`

## 环境变量说明

### `.env` 文件中的关键变量

```
# 使用 AWS 配置文件（推荐，自动管理凭证）
AWS_PROFILE=atc_env

# 或直接配置凭证（需要手动更新）
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
```

## 更多信息

- AWS 凭证配置文件位置：`~/.aws/config` 和 `~/.aws/credentials`
- 更新脚本配置：`~/.claude/update_settings.json`
- 凭证更新脚本：`~/.claude/update_aws_credentials.py`
