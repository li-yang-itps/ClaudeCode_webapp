# ========================
# Claude AI Chat - Makefile
# ワンクリック展開スクリプト
# ========================

.PHONY: help install setup start dev clean check doctor

# デフォルトターゲット
.DEFAULT_GOAL := help

# 色定義
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # カラーなし

# ========================
# ヘルプ
# ========================
help:
	@echo "$(CYAN)======================================$(NC)"
	@echo "$(CYAN)Claude AI Chat - Makefile$(NC)"
	@echo "$(CYAN)======================================$(NC)"
	@echo ""
	@echo "$(GREEN)利用可能なコマンド:$(NC)"
	@echo ""
	@echo "  $(CYAN)make install$(NC)    - 依存関係をインストール（npm install）"
	@echo "  $(CYAN)make setup$(NC)      - 初期設定を実行（install + check）"
	@echo "  $(CYAN)make start$(NC)      - サーバーを起動"
	@echo "  $(CYAN)make dev$(NC)        - 開発モードでサーバーを起動"
	@echo "  $(CYAN)make clean$(NC)      - node_modules と生成ファイルを削除"
	@echo "  $(CYAN)make check$(NC)      - 環境をチェック（Node.js、npm）"
	@echo "  $(CYAN)make doctor$(NC)     - 詳細診断を実行"
	@echo ""
	@echo "$(GREEN)クイックスタート:$(NC)"
	@echo "  $(CYAN)make setup && make start$(NC)"
	@echo ""

# ========================
# チェック: Node.js と npm
# ========================
check:
	@echo "$(CYAN)📋 環境をチェック中...$(NC)"
	@echo ""
	@which node > /dev/null 2>&1 && echo "$(GREEN)✓ Node.js がインストール済み: $$(node --version)$(NC)" || (echo "$(RED)✗ Node.js がインストールされていません$(NC)" && exit 1)
	@which npm > /dev/null 2>&1 && echo "$(GREEN)✓ npm がインストール済み: $$(npm --version)$(NC)" || (echo "$(RED)✗ npm がインストールされていません$(NC)" && exit 1)
	@echo ""

# ========================
# インストール: npm dependencies
# ========================
install: check
	@echo "$(CYAN)📦 npm 依存関係をインストール中...$(NC)"
	@echo ""
	@if [ -d "node_modules" ]; then \
		echo "$(YELLOW)⚠ node_modules が既に存在します$(NC)"; \
		echo "$(YELLOW)既存のモジュールを使用します$(NC)"; \
	else \
		npm install && echo "$(GREEN)✓ npm install 完了$(NC)"; \
	fi
	@echo ""

# ========================
# セットアップ: 完全な初期化
# ========================
setup: check install doctor
	@echo "$(GREEN)======================================$(NC)"
	@echo "$(GREEN)✓ セットアップ完了！$(NC)"
	@echo "$(GREEN)======================================$(NC)"
	@echo ""
	@echo "$(CYAN)次のコマンドを実行してサーバーを起動してください:$(NC)"
	@echo "  $(GREEN)make start$(NC)"
	@echo ""

# ========================
# 診断: 詳細チェック
# ========================
doctor:
	@echo "$(CYAN)🔍 詳細診断を実行中...$(NC)"
	@echo ""
	@echo "$(CYAN)【ファイル構造】$(NC)"
	@test -f server.js && echo "$(GREEN)✓ server.js$(NC)" || echo "$(RED)✗ server.js$(NC)"
	@test -f package.json && echo "$(GREEN)✓ package.json$(NC)" || echo "$(RED)✗ package.json$(NC)"
	@test -f .gitignore && echo "$(GREEN)✓ .gitignore$(NC)" || echo "$(RED)✗ .gitignore$(NC)"
	@test -d public && echo "$(GREEN)✓ public/$(NC)" || echo "$(RED)✗ public/$(NC)"
	@test -f public/index.html && echo "$(GREEN)✓ public/index.html$(NC)" || echo "$(RED)✗ public/index.html$(NC)"
	@test -f public/script.js && echo "$(GREEN)✓ public/script.js$(NC)" || echo "$(RED)✗ public/script.js$(NC)"
	@test -f public/styles.css && echo "$(GREEN)✓ public/styles.css$(NC)" || echo "$(RED)✗ public/styles.css$(NC)"
	@echo ""
	@echo "$(CYAN)【環境変数】$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN)✓ .env ファイルが存在$(NC)"; \
		grep -q "CLAUDE_API_KEY" .env && echo "$(GREEN)✓ CLAUDE_API_KEY が設定$(NC)" || echo "$(YELLOW)⚠ CLAUDE_API_KEY が見つかりません$(NC)"; \
	else \
		echo "$(YELLOW)⚠ .env ファイルが見つかりません$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)【npm パッケージ】$(NC)"
	@if [ -d "node_modules" ]; then \
		echo "$(GREEN)✓ node_modules が存在（$$(find node_modules -maxdepth 1 -type d | wc -l) パッケージ）$(NC)"; \
	else \
		echo "$(YELLOW)⚠ node_modules が見つかりません$(NC)"; \
	fi
	@echo ""

# ========================
# スタート: サーバー起動
# ========================
start:
	@echo "$(GREEN)======================================$(NC)"
	@echo "$(GREEN)🚀 Claude AI Chat を起動中...$(NC)"
	@echo "$(GREEN)======================================$(NC)"
	@echo ""
	@echo "$(CYAN)ブラウザで以下を開いてください:$(NC)"
	@echo "  $(GREEN)→ http://localhost:3002$(NC)"
	@echo ""
	@echo "$(YELLOW)Ctrl+C でサーバーを停止できます$(NC)"
	@echo ""
	node server.js

# ========================
# 開発モード
# ========================
dev: install
	@echo "$(GREEN)======================================$(NC)"
	@echo "$(GREEN)🔧 開発モードで起動中...$(NC)"
	@echo "$(GREEN)======================================$(NC)"
	@echo ""
	node server.js

# ========================
# クリーン: 生成ファイルを削除
# ========================
clean:
	@echo "$(CYAN)🧹 クリーン中...$(NC)"
	@echo ""
	@if [ -d "node_modules" ]; then \
		echo "$(YELLOW)削除中: node_modules/$(NC)"; \
		rm -rf node_modules; \
		echo "$(GREEN)✓ node_modules を削除$(NC)"; \
	fi
	@if [ -d "uploads" ]; then \
		echo "$(YELLOW)削除中: uploads/$(NC)"; \
		rm -rf uploads; \
		echo "$(GREEN)✓ uploads を削除$(NC)"; \
	fi
	@if [ -f ".env.local" ]; then \
		echo "$(YELLOW)削除中: .env.local$(NC)"; \
		rm -f .env.local; \
		echo "$(GREEN)✓ .env.local を削除$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)✓ クリーン完了$(NC)"
	@echo ""

# ========================
# 再インストール: clean + install
# ========================
reinstall: clean install
	@echo "$(GREEN)✓ 再インストール完了$(NC)"

# ========================
# ステータス
# ========================
status:
	@echo "$(CYAN)📊 ステータス確認$(NC)"
	@echo ""
	@echo "Node.js: $$(node --version)"
	@echo "npm: $$(npm --version)"
	@echo ""
	@if [ -d "node_modules" ]; then \
		echo "$(GREEN)✓ node_modules が存在$(NC)"; \
	else \
		echo "$(RED)✗ node_modules が見つかりません$(NC)"; \
	fi
	@if [ -f ".env" ]; then \
		echo "$(GREEN)✓ .env が存在$(NC)"; \
	else \
		echo "$(YELLOW)⚠ .env が見つかりません$(NC)"; \
	fi
	@echo ""
