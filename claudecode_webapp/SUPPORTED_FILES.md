# 📁 サポートされるファイルタイプ一覧

**最新アップデート**: 中文、日本語ファイル名を含むほぼすべてのテキストベースのファイルをサポート

## ✅ ファイルアップロードの仕組み

### 1️⃣ 拡張子チェック
以下に列挙されたファイル拡張子は自動的に認識されます。

### 2️⃣ MIME タイプチェック
- `text/*` で始まるすべての MIME タイプ（テキストファイル）
- `application/*` で始まるほぼすべてのタイプ（アプリケーションファイル）

### 3️⃣ Unicode ファイル名対応
- 中文（簡体字・繁体字）ファイル名 ✅
- 日本語（ひらがな・カタカナ・漢字）ファイル名 ✅
- その他言語のファイル名にも対応

---

## 🖥️ プログラミング言語

| 拡張子 | 言語 | 説明 |
|-------|------|------|
| `.py` | Python | データ分析、ML、Web 開発 |
| `.js` | JavaScript | フロントエンド、Node.js |
| `.ts` | TypeScript | 型安全な JavaScript |
| `.jsx` | JSX | React コンポーネント |
| `.tsx` | TSX | React + TypeScript |
| `.java` | Java | エンタープライズアプリ |
| `.cpp` | C++ | 高性能アプリケーション |
| `.c` | C | システムプログラミング |
| `.h` | C Header | C ヘッダーファイル |
| `.hpp` | C++ Header | C++ ヘッダーファイル |
| `.go` | Go | 並行処理、クラウド |
| `.rs` | Rust | 安全で高速 |
| `.rb` | Ruby | Web フレームワーク |
| `.php` | PHP | Web バックエンド |
| `.sh` / `.bash` | Shell Script | システム管理スクリプト |
| `.sql` | SQL | データベースクエリ |
| `.pl` | Perl | テキスト処理 |
| `.r` | R | 統計分析 |
| `.swift` | Swift | iOS/macOS 開発 |
| `.kt` | Kotlin | Android 開発 |
| `.scala` | Scala | JVM 上の関数型言語 |
| `.dart` | Dart | Flutter 開発 |
| `.lua` | Lua | ゲーム、組込 |
| `.clojure` | Clojure | Lisp 方言 |
| `.groovy` | Groovy | JVM スクリプト言語 |
| `.sol` | Solidity | スマートコントラクト |
| `.vy` | Vyper | スマートコントラクト |

---

## 🎨 Web & マークアップ

| 拡張子 | 形式 | 説明 |
|-------|------|------|
| `.html` | HTML | Webページ構造 |
| `.css` | CSS | スタイル定義 |
| `.scss` | SCSS | CSS プリプロセッサ |
| `.less` | LESS | CSS プリプロセッサ |
| `.vue` | Vue | Vue.js コンポーネント |
| `.svelte` | Svelte | Svelte コンポーネント |
| `.xml` | XML | マークアップ言語 |
| `.json` | JSON | データ形式 |
| `.jsonl` | JSON Lines | ログ形式 |
| `.proto` | Protocol Buffers | データシリアライゼーション |
| `.graphql` / `.gql` | GraphQL | API クエリ言語 |

---

## ⚙️ 設定 & ビルドファイル

| 拡張子 | 用途 | 説明 |
|-------|------|------|
| `.yaml` / `.yml` | YAML | 設定ファイル |
| `.toml` | TOML | 設定ファイル（Rust等） |
| `.ini` | INI | Windows 設定 |
| `.conf` / `.cfg` / `.config` | Config | 汎用設定ファイル |
| `.env` | Environment | 環境変数ファイル |
| `Dockerfile` | Docker | コンテナイメージ定義 |
| `Makefile` | Make | ビルド定義 |
| `.gradle` | Gradle | Java/Kotlin ビルド |
| `pom.xml` | Maven | Java ビルド（POM） |
| `.lock` | Lock File | パッケージバージョンロック |
| `.mod` | Go Modules | Go モジュール定義 |
| `.sum` | Checksum | Go チェックサム |
| `requirements.txt` | Python | Python 依存関係 |
| `Gemfile` | Ruby | Ruby 依存関係 |
| `Podfile` | CocoaPods | iOS 依存関係 |

---

## 📄 ドキュメント & データ

| 拡張子 | 形式 | 説明 |
|-------|------|------|
| `.md` | Markdown | ドキュメント（GitHub等） |
| `.txt` | Plain Text | 無形式テキストファイル |
| `.log` | Log File | ログファイル |
| `.pdf` | PDF | Portable Document Format |
| `.doc` / `.docx` | Word | Microsoft Word |
| `.xls` / `.xlsx` | Excel | Microsoft Excel スプレッドシート |
| `.ppt` / `.pptx` | PowerPoint | プレゼンテーション |
| `.csv` | CSV | カンマ区切り値 |
| `.tsv` | TSV | タブ区切り値 |

---

## 💻 スクリプト & システムファイル

| 拡張子 | 用途 | 説明 |
|-------|------|------|
| `.bat` | Batch | Windows バッチスクリプト |
| `.cmd` | CMD | Windows コマンド |
| `.ps1` | PowerShell | Windows PowerShell スクリプト |
| `.psm1` | PowerShell Module | PowerShell モジュール |

---

## 🌍 中文・日本語ファイル対応

以下のような中文ファイル名も完全サポート：

```
分析结果.py
数据处理.json
配置文件.yaml
日志文件.log
```

以下のような日本語ファイル名も完全サポート：

```
データ分析.py
設定ファイル.yaml
ログファイル.log
顧客情報.csv
```

---

## 📝 その他のテキストファイル

上記に列挙されていない拡張子でも、**以下の条件に該当すればアップロード可能**です：

✅ **テキストベース**（MIME type: `text/*`）
✅ **アプリケーション形式**（MIME type: `application/*`）
✅ **既知のプログラミング/設定言語**

---

## ❌ アップロード不可なファイル

以下の形式はセキュリティ上の理由でサポートされていません：

- 🚫 バイナリ実行ファイル（`.exe`, `.dll` 等）
- 🚫 圧縮ファイル（`.zip`, `.rar`, `.7z` 等）- 展開してアップロードしてください
- 🚫 画像ファイル（`.jpg`, `.png`, `.gif` 等）
- 🚫 ビデオ/オーディオ（`.mp4`, `.mp3` 等）
- 🚫 バイナリ形式（`.bin`, `.dat` 等）

---

## 🔧 ファイル形式が認識されない場合

**解決策**：

1. **ファイル名の拡張子を確認**
   - `.txt` など一般的な拡張子を追加

2. **MIME type を確認**
   - ブラウザの開発者ツール → Network でチェック

3. **テキスト形式で保存**
   - バイナリ形式の場合は、テキスト形式に変換

4. **サーバーログを確認**
   ```bash
   # サーバーを起動してエラーメッセージを確認
   npm start
   ```

---

## 📊 ファイルタイプ自動検出

アップロード時に自動的に以下が検出されます：

- **言語**: Python, JavaScript, Java, Ruby 等（50+ 言語対応）
- **ファイルタイプ**: Code, Document, Configuration
- **複雑度**: 自動判定（行数、構文複雑度等）
- **可読性スコア**: 0-100% で自動評価

---

## 💡 推奨ファイルサイズ

| ファイルタイプ | 推奨サイズ | 最大サイズ |
|---------------|---------|---------|
| ソースコード | < 1 MB | 100 MB |
| テキストドキュメント | < 5 MB | 100 MB |
| ログファイル | < 10 MB | 100 MB |
| JSON/YAML | < 5 MB | 100 MB |

**注**: ファイルが大きいほど分析に時間がかかります

---

## 🎯 サポートされていない形式をどうするか？

### 圧縮ファイルの場合
```bash
# .zip ファイルは事前に展開
unzip archive.zip
# 個別ファイルをアップロード
```

### バイナリファイルの場合
```
# テキストエクスポート機能を使用
# または、16進数ダンプをテキストに変換
xxd binary_file.bin > binary_file.txt
```

### 画像内のテキストの場合
- OCR ツールでテキスト抽出後、テキストファイルとしてアップロード

---

更新日: 2026-03-05
