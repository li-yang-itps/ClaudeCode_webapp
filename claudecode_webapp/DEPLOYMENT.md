# 🚀 Claude AI Chat - 展開ガイド

## 📋 目次

- [クイックスタート](#クイックスタート)
- [前提条件](#前提条件)
- [詳細な展開手順](#詳細な展開手順)
- [Makefile コマンド](#makefile-コマンド)
- [トラブルシューティング](#トラブルシューティング)
- [環境変数の設定](#環境変数の設定)

---

## 🚀 クイックスタート

### Windows ユーザー

```bash
# 1. プロジェクトをクローン
git clone https://github.com/li-yang-itps/ClaudeCode_webapp.git
cd ClaudeCode_webapp

# 2. セットアップして起動（Makefile が利用可能な場合）
make setup
make start

# または、npm を直接使用
npm install
npm start
```

### Mac / Linux ユーザー

```bash
# 1. プロジェクトをクローン
git clone https://github.com/li-yang-itps/ClaudeCode_webapp.git
cd ClaudeCode_webapp

# 2. Makefile を使用したセットアップ
make setup
make start
```

---

## 📋 前提条件

### 必須

- **Node.js 14.0 以上** ([https://nodejs.org/](https://nodejs.org/))
- **npm 6.0 以上** (Node.js と一緒にインストール)
- **Git** (GitHub からクローンするため)

### 推奨

- **make** コマンド (Windows は WSL または Git Bash で利用可能)
  - Windows: [GitBash](https://git-scm.com/download/win) または [WSL](https://learn.microsoft.com/ja-jp/windows/wsl/install)
  - Mac: デフォルトでインストール済み
  - Linux: `sudo apt-get install build-essential`

### API 認証情報（いずれか一つ必須）

1. **Claude API キー** (推奨)
   - https://console.anthropic.com から取得

2. **AWS Bedrock 認証情報**
   - AWS Access Key ID
   - AWS Secret Access Key
   - AWS リージョン: `ap-northeast-1`

---

## 📝 詳細な展開手順

### ステップ 1: プロジェクトをクローン

```bash
git clone https://github.com/li-yang-itps/ClaudeCode_webapp.git
cd ClaudeCode_webapp
```

### ステップ 2: 環境をチェック

```bash
# Node.js と npm がインストール済みか確認
make check

# または
node --version
npm --version
```

**期待される出力:**
```
✓ Node.js がインストール済み: v18.0.0
✓ npm がインストール済み: 9.0.0
```

### ステップ 3: 依存関係をインストール

```bash
# オプション A: Makefile を使用
make install

# オプション B: npm を直接使用
npm install
```

**このステップで何が起こるのか:**
- `package.json` のすべての依存パッケージをダウンロード
- `node_modules/` ディレクトリが作成される
- インストール完了: 約 30～60 秒

### ステップ 4: 環境変数を設定

```bash
# .env ファイルを開く
# Windows (PowerShell)
notepad .env

# Mac / Linux
nano .env
# または
vim .env
```

**設定が必要な内容:**

#### オプション A: Claude API キー

```bash
CLAUDE_API_KEY=sk-xxx...xxx
```

#### オプション B: AWS Bedrock

```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=ap-northeast-1
```

#### オプション設定

```bash
# ポート番号（デフォルト: 3002）
PORT=3002

# API タイプ（bedrock または claude）
API_TYPE=bedrock
```

### ステップ 5: セットアップの完全性を確認

```bash
make doctor
```

**期待される出力:**
```
【ファイル構造】
✓ server.js
✓ package.json
✓ .gitignore
✓ public/
✓ public/index.html
✓ public/script.js
✓ public/styles.css

【環境変数】
✓ .env ファイルが存在
✓ CLAUDE_API_KEY が設定

【npm パッケージ】
✓ node_modules が存在（200+ パッケージ）
```

### ステップ 6: サーバーを起動

```bash
# Makefile を使用
make start

# または
npm start
```

**期待される出力:**
```
Claude File Uploader running on http://localhost:3002
API Type: bedrock
AWS Region: ap-northeast-1
Bedrock client initialized: true
```

### ステップ 7: ブラウザでアクセス

```
http://localhost:3002
```

---

## 📖 Makefile コマンド

| コマンド | 説明 | 実行内容 |
|---------|------|---------|
| `make help` | ヘルプを表示 | 利用可能なコマンド一覧 |
| `make check` | 環境チェック | Node.js と npm を確認 |
| `make install` | インストール | npm install を実行 |
| `make setup` | 完全なセットアップ | check + install + doctor |
| `make start` | サーバー起動 | http://localhost:3002 で実行 |
| `make dev` | 開発モード | Node.js でサーバーを起動 |
| `make doctor` | 詳細診断 | ファイル、環境、パッケージをチェック |
| `make clean` | クリーン | node_modules と一時ファイルを削除 |
| `make reinstall` | 再インストール | clean + install |
| `make status` | ステータス確認 | 現在の環境状態を表示 |

### 実行例

```bash
# 初回セットアップ（推奨）
make setup

# サーバーを起動
make start

# トラブル時の再インストール
make clean
make install
make start

# 詳細な環境診断
make doctor

# コマンド一覧を確認
make help
```

---

## 🔧 トラブルシューティング

### 問題 1: "make: コマンドが見つかりません"

**原因:** make がインストールされていない

**解決方法:**

#### Windows
```bash
# Git Bash を使用（https://git-scm.com/download/win）
# または WSL をインストール
```

#### Mac
```bash
# Xcode Command Line Tools をインストール
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install build-essential
```

**代替案: npm を直接使用**
```bash
npm install
npm start
```

---

### 問題 2: "Node.js がインストールされていません"

**解決方法:**

1. https://nodejs.org/ にアクセス
2. LTS (推奨) バージョンをダウンロード
3. インストール後、ターミナルを再起動
4. 確認: `node --version`

---

### 問題 3: "CLAUDE_API_KEY が見つかりません" エラー

**原因:** .env ファイルが設定されていない

**解決方法:**

```bash
# .env ファイルをコピー
cp .env.example .env

# エディタで開いて API キーを設定
# Linux/Mac:
nano .env

# Windows (PowerShell):
notepad .env
```

---

### 問題 4: "npm install が遅い"

**原因:** ネットワークの問題またはパッケージ数が多い

**解決方法:**

```bash
# npm キャッシュをクリア
npm cache clean --force

# 再度インストール
npm install

# または、別のレジストリを使用
npm install --registry https://registry.npm.taobao.org
```

---

### 問題 5: "ポート 3002 が既に使用されている"

**解決方法:**

```bash
# 別のポートで起動
PORT=3003 npm start

# または Makefile で設定
PORT=3003 make start
```

**現在のポート使用状況を確認:**
```bash
# Mac/Linux
lsof -i :3002

# Windows (PowerShell)
netstat -ano | findstr :3002
```

---

### 問題 6: "エラー: uploads ディレクトリが見つかりません"

**原因:** uploads ディレクトリが存在しない

**解決方法:**

```bash
# ディレクトリを手動作成
mkdir uploads

# または、クリーン後に再起動
make clean
make start
```

---

## 🔐 環境変数の設定

### .env ファイルのテンプレート

```bash
# ========================
# Claude AI Chat - 環境変数設定
# ========================

# API 認証情報（以下のいずれか一つを設定）

# 【オプション A】Anthropic Claude API
CLAUDE_API_KEY=sk-your-api-key-here

# 【オプション B】AWS Bedrock
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_SESSION_TOKEN=xxx...（オプション）

# サーバー設定
PORT=3002
API_TYPE=bedrock

# AWS VPC エンドポイント（オプション）
AWS_ENDPOINT_URL=https://bedrock-runtime.ap-northeast-1.vpce.amazonaws.com
```

### 設定の優先順位

1. **環境変数** (最優先)
2. **.env ファイル**
3. **~/.claude/settings.json** (Claude CLI 設定)
4. **AWS プロファイル**

---

## ✅ 実行確認

### 正常に起動している場合

```bash
✓ ブラウザで http://localhost:3002 が表示される
✓ コンソールに "Claude File Uploader running on http://localhost:3002" が表示
✓ チャット入力フィールドが操作可能
✓ ファイルアップロードが機能
```

### トラブル時のログ確認

```bash
# コンソール出力をファイルに保存
npm start > server.log 2>&1

# ログを確認
tail -f server.log
```

---

## 📞 サポート

問題が解決しない場合：

1. **GitHub Issues**: https://github.com/li-yang-itps/ClaudeCode_webapp/issues
2. **API ドキュメント**:
   - Anthropic: https://docs.anthropic.com
   - AWS Bedrock: https://docs.aws.amazon.com/bedrock/
3. **エラーメッセージをコピーして検索**

---

## 📚 関連ドキュメント

- [README.md](./README.md) - プロジェクト概要
- [API エンドポイント](./README.md#api-エンドポイント) - API 仕様
- [セキュリティ機能](./README.md#セキュリティ機能) - セキュリティ設定

---

**最終更新:** 2026-03-06
**バージョン:** 1.0.0
