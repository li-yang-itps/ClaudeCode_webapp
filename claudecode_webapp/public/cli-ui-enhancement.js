// ========================
// CLI UI 拡張機能
// ========================

// コマンド実行結果を表示するためのスタイル拡張
const CLI_STYLES = `
<style id="cli-ui-styles">
.message-content.command-result {
  background-color: #1e1e1e;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  border-left: 4px solid #00ff00;
  padding: 12px;
  margin: 8px 0;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.4;
}

.message-content.command-result.success {
  border-left-color: #00cc00;
  color: #00ff00;
}

.message-content.command-result.error {
  border-left-color: #ff4444;
  color: #ff6666;
}

.message-content.command-result.info {
  border-left-color: #44aaff;
  color: #88ccff;
}

.command-prompt {
  color: #ff44ff;
  font-weight: bold;
  margin-right: 8px;
}

.command-output {
  margin-top: 8px;
  margin-left: 20px;
}

.file-content-block {
  background-color: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  line-height: 1.4;
  overflow-x: auto;
}

.file-header {
  color: #88ccff;
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}

.operation-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 0.85em;
  font-weight: bold;
  margin-right: 8px;
  margin-bottom: 4px;
}

.operation-badge.read {
  background-color: #4488ff;
  color: white;
}

.operation-badge.write {
  background-color: #44ff44;
  color: #000;
}

.operation-badge.delete {
  background-color: #ff4444;
  color: white;
}

.operation-badge.execute {
  background-color: #ffaa44;
  color: #000;
}
</style>
`;

// メッセージコンテンツをフォーマット（CLI 結果を表示）
function formatMessageContent(content, isCommandResult = false, operationType = null) {
  if (!isCommandResult) {
    return content;
  }

  // コマンド実行結果の場合
  let html = '<div class="message-content command-result">';

  // オペレーションバッジを追加
  if (operationType) {
    html += `<span class="operation-badge ${operationType}">${operationType.toUpperCase()}</span><br>`;
  }

  // コンテンツをハイライト
  if (content.includes('$')) {
    // コマンドプロンプト付き
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('$')) {
        html += `<div><span class="command-prompt">$</span>${escapeHtml(line.substring(1))}</div>`;
      } else if (line.startsWith('❌') || line.startsWith('エラー')) {
        html += `<div style="color: #ff6666;">${escapeHtml(line)}</div>`;
      } else if (line.startsWith('✓')) {
        html += `<div style="color: #00ff00;">${escapeHtml(line)}</div>`;
      } else if (line.trim()) {
        html += `<div>${escapeHtml(line)}</div>`;
      } else {
        html += '<br>';
      }
    }
  } else {
    // ファイルコンテンツの場合
    if (content.startsWith('📄')) {
      html += formatFileContent(content);
    } else {
      html += `<div>${escapeHtml(content)}</div>`;
    }
  }

  html += '</div>';
  return html;
}

// ファイルコンテンツをフォーマット
function formatFileContent(content) {
  const lines = content.split('\n');
  let html = '';
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('📄')) {
      html += `<div class="file-header">${escapeHtml(line)}</div>`;
    } else if (line === '```') {
      inCodeBlock = !inCodeBlock;
    } else if (inCodeBlock && line.trim()) {
      html += `<div class="file-content-block">${escapeHtml(line)}</div>`;
    } else if (line.includes('✓') || line.includes('→')) {
      html += `<div style="color: #00ff00; margin-top: 8px;">${escapeHtml(line)}</div>`;
    }
  }

  return html;
}

// HTML をエスケープ
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// CLI UI スタイルを初期化
function initCLIUIStyles() {
  if (!document.getElementById('cli-ui-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'cli-ui-styles';
    styleElement.textContent = CLI_STYLES.replace(/<style[^>]*>|<\/style>/g, '');
    document.head.appendChild(styleElement);
  }
}

// メッセージを表示（CLI 対応版）
function displayMessageWithCLISupport(message, isCommandResult = false, operationType = null) {
  if (isCommandResult) {
    const formattedContent = formatMessageContent(message.content, true, operationType);
    return {
      ...message,
      htmlContent: formattedContent,
      isCommandResult: true
    };
  }
  return message;
}

// 初期化
document.addEventListener('DOMContentLoaded', initCLIUIStyles);
