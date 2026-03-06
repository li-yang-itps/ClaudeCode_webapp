# Claude ファイルアップロード分析ツール

軽量な Web アプリケーション。ファイルを Claude AI にアップロードして、智能分析を実行できます。

## 機能特性

- 💬 **ChatGPT スタイルのチャットインターフェース** - 複数ターンの会話、リアルタイム応答
- 📎 **ファイルアップロード分析** - チャットでファイルをアップロードして分析
- 📜 **会話履歴** - サイドバーにすべての会話を表示、いつでも切り替え可能
- 🎨 **Markdown レンダリング** - コードブロックに構文ハイライト
- 📱 **レスポンシブデザイン** - スマートフォン、タブレット、デスクトップに完全対応
- ⚡ **高速起動** - npm で簡単に実行

## サポートされるファイルタイプ

- テキストファイル: `.txt`, `.md`, `.json`, `.yaml`, `.yml`, `.toml`, `.xml`, `.html`, `.css`, `.scss`
- コードファイル: `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.java`, `.cpp`, `.c`, `.go`, `.rs`, `.rb`, `.php`, `.sh`, `.sql`
- ドキュメント: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv`

最大ファイルサイズ: 100MB

## 前提条件

- Node.js 14+ と npm
- AWS Bedrock 認証情報（推奨）または Claude API キー

## 🚀 インストール手順

### クイックスタート（推奨）

Makefile を使用した最速セットアップ:

```bash
# プロジェクトをクローン
git clone https://github.com/li-yang-itps/ClaudeCode_webapp.git
cd ClaudeCode_webapp

# ワンコマンドセットアップ
make setup

# サーバーを起動
make start
```

ブラウザで `http://localhost:3002` を開きます。

### 手動インストール

```bash
# プロジェクトディレクトリに入る
cd ClaudeCode_webapp

# 依存関係をインストール（初回実行時）
npm install

# サーバーを起動
npm start
```

その後、ブラウザで `http://localhost:3002` を開きます。

### Makefile コマンド

```bash
make setup      # 初期セットアップ（推奨）
make start      # サーバーを起動
make install    # npm 依存関係をインストール
make dev        # 開発モードで起動
make doctor     # 環境を診断
make clean      # クリーンアップ
make help       # コマンド一覧を表示
```

## 使用方法

### 基本操作

1. **メッセージ送信**
   - 入力フィールドに質問またはコマンドを入力
   - Enter キーを押すか、➤ ボタンをクリックして送信

2. **ファイルアップロード**
   - 📎 ボタンをクリックしてファイルを選択
   - 質問を入力して送信（ファイルは文脈に含まれて分析されます）

3. **履歴の表示**
   - 左側のサイドバーにすべての会話を表示
   - いずれかの会話をクリックして切り替え

4. **新しい会話を作成**
   - 左上の "+ New Chat" をクリックして新しい会話を作成
   - 🗑️ をクリックして現在の会話をクリア

### サポートされるファイルタイプ

コード: `.py`, `.js`, `.ts`, `.java`, `.cpp`, `.go` など 60+ 言語
ドキュメント: `.txt`, `.md`, `.pdf`, `.docx` など
設定: `.yaml`, `.json`, `.toml` など

最大ファイル: 100MB

## 環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `CLAUDE_API_KEY` | Anthropic Claude API キー | ✅ |
| `AWS_REGION` | AWS リージョン（デフォルト: ap-northeast-1） | ❌ |
| `PORT` | サーバーポート（デフォルト: 3002） | ❌ |

詳細は [.env.example](./.env.example) を参照してください。

## プロジェクト構造

```
ClaudeCode_webapp/
├── server.js              # Express バックエンドサーバー
├── package.json           # プロジェクト設定
├── Makefile              # ワンコマンドセットアップスクリプト
├── .env.example          # 環境変数テンプレート
├── .gitignore            # Git 無視ルール
├── README.md             # プロジェクト説明（このファイル）
├── public/
│   ├── index.html        # フロントエンド HTML
│   ├── styles.css        # スタイルシート
│   ├── script.js         # フロントエンド JavaScript
│   └── technopro-logo.png # ロゴ
└── node_modules/         # 依存パッケージ（自動生成）
```

## 技術スタック

- **バックエンド**: Express.js + AWS Bedrock Runtime
- **ファイルアップロード**: Multer
- **API 呼び出し**: HTTPS（ネイティブ Node.js モジュール）
- **フロントエンド**: Vanilla JavaScript
- **スタイル**: CSS3 + レスポンシブデザイン
- **マークダウンレンダリング**: markdown-it
- **構文ハイライト**: highlight.js

## セキュリティ機能

- ✅ ファイルは分析後直ちに削除
- ✅ ホワイトリストベースのファイルタイプチェック
- ✅ ファイルサイズ制限（100MB）
- ✅ CORS サポート
- ✅ 環境変数による API キー保護

## API エンドポイント

### POST `/api/chat`
ファイルサポート付きマルチターン会話

**リクエスト体:**
```
Content-Type: multipart/form-data
- sessionId: セッション ID（必須）
- conversationId: 会話 ID（オプション、存在しない場合は新規作成）
- message: テキストメッセージ（必須）
- files: アップロードファイル（オプション、最大 10 個）
- language: UI 言語（オプション）
```

**レスポンス:**
```json
{
  "success": true,
  "conversationId": "uuid",
  "sessionId": "uuid",
  "message": { "id": "uuid", "role": "assistant", "content": "...", "timestamp": "..." },
  "history": [...]
}
```

### GET `/api/session/:sessionId/conversations`
セッションの会話一覧を取得

### GET `/api/conversation/:conversationId`
会話履歴を取得

### DELETE `/api/conversation/:conversationId`
会話を削除

### POST `/api/conversation/:conversationId/star`
会話にスターを付ける/外す

### GET `/api/health`
健康チェック

**レスポンス:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "apiType": "bedrock",
  "bedrockConfigured": true,
  "region": "ap-northeast-1"
}
```

## トラブルシューティング

### 問題: API に接続できない
- `.env` ファイルの `CLAUDE_API_KEY` または AWS 認証情報を確認
- API キーが有効で期限切れでないか確認
- ネットワーク接続を確認


### 問題: ファイルが大きすぎる
- ファイルサイズを 100MB 以内に保つ
- 大きなファイルを分割することを検討

### 問題: サポートされていないファイルタイプ
- ファイル拡張子がサポートリストに含まれているか確認
- ファイルを正しい拡張子にリネーム

## ライセンス

MIT

## サポート

問題または提案がある場合は、GitHub Issues を作成してください。
https://github.com/li-yang-itps/ClaudeCode_webapp/issues
