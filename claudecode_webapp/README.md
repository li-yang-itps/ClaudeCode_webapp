# Claude 文件上传分析工具

一个轻量级的 Web 应用，让你可以上传文件到 Claude AI 进行智能分析。

## 功能特性

- 💬 **ChatGPT 风格的聊天界面** - 多轮对话，实时响应
- 📎 **文件上传分析** - 在聊天中上传文件进行分析
- 📜 **对话历史** - 侧边栏显示所有对话，随时切换
- 🎨 **Markdown 渲染** - 代码块带语法高亮
- 📱 **响应式设计** - 完美支持手机、平板、桌面
- ⚡ **快速启动** - 双击 start.bat 即可运行

## 支持的文件类型

- 文本文件: `.txt`, `.md`, `.json`, `.yaml`, `.yml`, `.toml`, `.xml`, `.html`, `.css`, `.scss`
- 代码文件: `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.java`, `.cpp`, `.c`, `.go`, `.rs`, `.rb`, `.php`, `.sh`, `.sql`
- 文档: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv`

最大文件大小: 100MB

## 快速开始

### 前提条件

- Node.js 14+ 和 npm
- AWS Bedrock 凭证（推荐）或 Claude API 密钥

### 最快启动方式

**双击 `start.bat` 文件即可！**

脚本会自动：
- 安装依赖（如需要）
- 启动服务器
- 打开浏览器访问 http://localhost:3000

### 手动启动步骤

```bash
# 进入项目目录
cd C:\Users\li.yang\Desktop\claude-file-uploader

# 安装依赖（首次运行）
npm install

# 启动服务器
npm start
```

然后在浏览器打开：`http://localhost:3000`

## 使用方法

### 基础操作

1. **发送消息**
   - 在输入框输入问题或命令
   - 按 Enter 或点击 ➤ 按钮发送

2. **上传文件**
   - 点击 📎 按钮选择文件
   - 输入问题后发送（文件会在上下文中分析）

3. **查看历史**
   - 左侧边栏显示所有对话
   - 点击任何对话即可切换查看

4. **新建对话**
   - 点击左上角 "+ New Chat" 创建新对话
   - 点击 🗑️ 清空当前对话

### 支持的文件类型

代码: `.py`, `.js`, `.ts`, `.java`, `.cpp`, `.go` 等 60+ 种
文档: `.txt`, `.md`, `.pdf`, `.docx` 等
配置: `.yaml`, `.json`, `.toml` 等

最大文件: 100MB

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `CLAUDE_API_KEY` | Anthropic Claude API 密钥 | ✅ |
| `PORT` | 服务器端口（默认: 3000） | ❌ |

## 项目结构

```
claude-file-uploader/
├── server.js              # Express 后端服务器
├── package.json           # 项目配置
├── .env.example          # 环境变量示例
├── .gitignore            # Git 忽略规则
├── README.md             # 项目说明（本文件）
├── public/
│   ├── index.html        # 前端 HTML
│   ├── styles.css        # 样式表
│   └── script.js         # 前端 JavaScript
└── uploads/              # 临时上传文件夹（自动创建）
```

## 技术栈

- **后端**: Express.js
- **文件上传**: Multer
- **API 调用**: Axios
- **前端**: Vanilla JavaScript
- **样式**: CSS3 + 响应式设计

## 安全特性

- ✅ 文件在分析后立即删除
- ✅ 支持文件类型白名单
- ✅ 文件大小限制 (100MB)
- ✅ CORS 支持
- ✅ 环境变量保护 API 密钥

## API 端点

### POST `/api/upload`
上传并分析文件

**请求体:**
```
Content-Type: multipart/form-data
- file: 要上传的文件
- prompt: (可选) 分析提示
```

**响应:**
```json
{
  "success": true,
  "fileName": "example.txt",
  "analysis": "Claude 的分析结果..."
}
```

### GET `/api/health`
健康检查

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 故障排除

### 问题: 无法连接到 API
- 检查 `.env` 文件中的 `CLAUDE_API_KEY` 是否正确
- 确保 API 密钥有效且未过期
- 检查网络连接

### 问题: 文件太大
- 将文件大小控制在 100MB 以内
- 考虑分割大文件

### 问题: 不支持的文件类型
- 检查文件扩展名是否在支持列表中
- 重命名文件时使用正确的扩展名

## 许可证

MIT

## 支持

如有问题或建议，请联系开发者或创建 Issue。
