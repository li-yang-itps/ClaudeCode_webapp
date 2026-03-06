# ⚡ クイックスタート

## 最速セットアップ（3 ステップ）

### ステップ 1: クローン
```bash
git clone https://github.com/li-yang-itps/ClaudeCode_webapp.git
cd ClaudeCode_webapp
```

### ステップ 2: セットアップ
```bash
make setup
```

### ステップ 3: 起動
```bash
make start
```

**完了！** → http://localhost:3002 をブラウザで開く

---

## 前提条件チェック

```bash
# Node.js と npm がインストール済みか確認
node --version    # v14.0.0 以上
npm --version     # 6.0.0 以上

# make コマンドが使用可能か確認
make --version
```

**make コマンドが見つからない場合:**
- Windows: [Git Bash](https://git-scm.com/download/win) をインストール
- Mac: `xcode-select --install`
- Linux: `sudo apt-get install build-essential`

---

## トラブル時のコマンド

```bash
# 環境を詳細診断
make doctor

# npm を直接使用（make が使えない場合）
npm install
npm start

# すべてをリセット
make clean
make setup
make start
```

---

## API キーの設定

### 1. `.env` ファイルを編集
```bash
nano .env          # Mac/Linux
# または
notepad .env       # Windows
```

### 2. 次のいずれかを追加

#### オプション A: Anthropic Claude API（推奨）
```bash
CLAUDE_API_KEY=sk-your-key-here
```

#### オプション B: AWS Bedrock
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=ap-northeast-1
```

### 3. 保存して `make start`

---

## よくある問題

| 問題 | 解決方法 |
|------|--------|
| Node.js がない | https://nodejs.org から LTS をインストール |
| `make` コマンドがない | Git Bash または WSL をインストール |
| ポート 3002 が使用中 | `PORT=3003 make start` で別ポートを指定 |
| API エラー | `.env` ファイルに API キーが正しく設定されているか確認 |
| 依存パッケージエラー | `make reinstall` を実行 |

---

## 詳細ドキュメント

- 📖 **[README.md](./README.md)** - プロジェクト概要
- 📋 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 詳細な展開ガイド
- ⚙️ **[Makefile](./Makefile)** - すべてのコマンド

---

## Makefile コマンド一覧

```bash
make help       # ヘルプを表示
make setup      # 初期セットアップ
make start      # サーバーを起動
make install    # npm 依存関係をインストール
make doctor     # 環境診断
make clean      # クリーンアップ
make status     # ステータス確認
```

---

**その他の問題?** → [DEPLOYMENT.md](./DEPLOYMENT.md#トラブルシューティング) を参照してください
