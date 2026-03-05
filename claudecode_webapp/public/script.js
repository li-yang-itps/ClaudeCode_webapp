// Session and conversation management
let sessionId = null;
let conversationId = null;
let messages = [];
let attachedFiles = [];  // Changed to array for multiple files
let isSending = false;
let conversationsList = [];

// Constants
const MAX_FILES = 10;

// DOM Elements
const fileBtn = document.getElementById('fileBtn');
const fileInput = document.getElementById('fileInput');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesArea = document.getElementById('messagesArea');
const loadingIndicator = document.getElementById('loadingIndicator');
const newChatBtn = document.getElementById('newChatBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const conversationsListEl = document.getElementById('conversationsList');
const fileAttachments = document.getElementById('fileAttachments');
const currentConvInfo = document.getElementById('currentConvInfo');

// Initialize
function initChat() {
  const storedSessionId = sessionStorage.getItem('sessionId');
  sessionId = storedSessionId || generateUUID();
  sessionStorage.setItem('sessionId', sessionId);
  setupEventListeners();
  loadConversations();
}

function setupEventListeners() {
  // File input with drag and drop
  fileBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(Array.from(e.target.files));
    }
  });

  // Drag and drop on entire document
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.querySelector('.chat-layout').classList.add('drag-over');
  });

  document.addEventListener('dragleave', (e) => {
    if (e.target === document || e.target === document.documentElement) {
      document.querySelector('.chat-layout').classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    document.querySelector('.chat-layout').classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  });

  // Message input
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  newChatBtn.addEventListener('click', createNewConversation);

  clearChatBtn.addEventListener('click', () => {
    if (confirm('Clear this conversation?')) {
      deleteConversation(conversationId);
    }
  });
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function loadConversations() {
  try {
    const response = await fetch(`/api/session/${sessionId}/conversations`);
    const data = await response.json();
    conversationsList = data.conversationIds || [];
    updateConversationsDisplay();

    // If no active conversation, create new one
    if (!conversationId && conversationsList.length > 0) {
      switchConversation(conversationsList[0].id);
    } else if (!conversationId) {
      createNewConversation();
    }
  } catch (error) {
    console.error('Failed to load conversations:', error);
    createNewConversation();
  }
}

function updateConversationsDisplay() {
  conversationsListEl.innerHTML = '';
  const t = translations[currentLanguage];

  if (conversationsList.length === 0) {
    conversationsListEl.innerHTML = '<div style="padding: 12px; color: #999; font-size: 0.9em; text-align: center;">No conversations yet</div>';
    return;
  }

  // Sort by creation date, newest first
  const sorted = [...conversationsList].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  sorted.forEach(conv => {
    const convContainer = document.createElement('div');
    convContainer.style.position = 'relative';

    const convBtn = document.createElement('button');
    convBtn.className = `conversation-item ${conv.id === conversationId ? 'active' : ''}`;

    // Use generated title if available, otherwise use last message or date
    const title = conv.title || conv.lastMessage || new Date(conv.createdAt).toLocaleString();
    const preview = title.length > 30 ? title.substring(0, 30) + '...' : title;

    // Add star icon if conversation is starred
    const starIcon = conv.starred ? '⭐ ' : '';
    convBtn.innerHTML = `${starIcon}<span>${preview}</span>`;
    convBtn.title = title;
    convBtn.style.width = '100%';

    convBtn.addEventListener('click', () => switchConversation(conv.id));

    // Menu button
    const menuBtn = document.createElement('button');
    menuBtn.className = 'conversation-menu-btn';
    menuBtn.innerHTML = '⋮';
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleConversationMenu(convContainer, conv.id);
    });

    // Menu
    const menu = document.createElement('div');
    menu.className = 'conversation-menu';

    const starBtn = document.createElement('button');
    starBtn.className = 'conversation-menu-item';
    starBtn.innerHTML = '⭐ ' + (conv.starred ? t['unstar'] : t['star']);
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStarConversation(conv.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'conversation-menu-item delete';
    deleteBtn.innerHTML = '🗑️ ' + t['delete'];
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(t['confirmDelete'])) {
        deleteConversation(conv.id);
      }
    });

    menu.appendChild(starBtn);
    menu.appendChild(deleteBtn);

    convBtn.appendChild(menuBtn);
    convContainer.appendChild(convBtn);
    convContainer.appendChild(menu);
    conversationsListEl.appendChild(convContainer);
  });
}

async function createNewConversation() {
  conversationId = null;
  messages = [];
  attachedFiles = [];
  messagesArea.innerHTML = `
    <div class="welcome-message">
      <h2>Welcome to Claude AI Chat</h2>
      <p>Start a conversation or upload a file to begin</p>
      <div class="welcome-features">
        <div class="feature" data-action="chat" onclick="window.handleFeatureClick('chat')">💬 <strong>Chat</strong><br>Ask questions and have conversations</div>
        <div class="feature" data-action="upload" onclick="window.handleFeatureClick('upload')">📎 <strong>Upload Files</strong><br>Drag & drop or click to upload</div>
        <div class="feature" data-action="history" onclick="window.handleFeatureClick('history')">🕐 <strong>History</strong><br>All conversations saved in sidebar</div>
      </div>
    </div>
  `;
  fileAttachments.innerHTML = '';
  currentConvInfo.textContent = 'New conversation';
  updateConversationsDisplay();
}

async function switchConversation(convId) {
  try {
    const response = await fetch(`/api/conversation/${convId}`);
    const data = await response.json();

    conversationId = convId;
    messages = data.messages;
    attachedFiles = [];

    removeWelcomeMessage();
    messagesArea.innerHTML = '';
    updateMessagesDisplay();
    updateConversationsDisplay();

    const convData = conversationsList.find(c => c.id === convId);
    if (convData) {
      currentConvInfo.textContent = convData.title || 'New conversation';
    }

    fileAttachments.innerHTML = '';
    messageInput.focus();
  } catch (error) {
    console.error('Failed to load conversation:', error);
  }
}

async function deleteConversation(convId) {
  if (!convId) return;

  try {
    await fetch(`/api/conversation/${convId}`, { method: 'DELETE' });
    conversationId = null;
    messages = [];
    await loadConversations();
  } catch (error) {
    console.error('Failed to delete conversation:', error);
  }
}

function toggleConversationMenu(container, convId) {
  // Close all other menus
  document.querySelectorAll('.conversation-menu').forEach(menu => {
    if (menu.parentElement !== container) {
      menu.classList.remove('active');
    }
  });

  // Toggle current menu
  const menu = container.querySelector('.conversation-menu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

async function toggleStarConversation(convId) {
  try {
    const response = await fetch(`/api/conversation/${convId}/star`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      const conv = conversationsList.find(c => c.id === convId);
      if (conv) {
        conv.starred = data.starred;
        updateConversationsDisplay();
      }
    }
  } catch (error) {
    console.error('Failed to toggle star:', error);
  }
}

function handleFileSelect(files) {
  // Handle both single file and array of files
  const newFiles = Array.isArray(files) ? files : [files];

  // Check total file count doesn't exceed MAX_FILES
  const totalFiles = attachedFiles.length + newFiles.length;
  if (totalFiles > MAX_FILES) {
    alert(`Maximum ${MAX_FILES} files allowed. Currently have ${attachedFiles.length} file(s).`);
    return;
  }

  // Add new files to the array
  attachedFiles.push(...newFiles);

  updateFileAttachmentDisplay();
  setTimeout(() => messageInput.focus(), 100);
}

function updateFileAttachmentDisplay() {
  fileAttachments.innerHTML = '';

  attachedFiles.forEach((file, index) => {
    const attachmentEl = document.createElement('div');
    attachmentEl.className = 'attachment';
    attachmentEl.innerHTML = `
      📎 ${file.name} (${formatFileSize(file.size)})
      <button class="attachment-remove" type="button" data-index="${index}">×</button>
    `;

    attachmentEl.querySelector('.attachment-remove').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(e.target.getAttribute('data-index'));
      attachedFiles.splice(idx, 1);
      updateFileAttachmentDisplay();
      messageInput.focus();
    });

    fileAttachments.appendChild(attachmentEl);
  });

  // Show file count if there are files
  if (attachedFiles.length > 0) {
    const countEl = document.createElement('div');
    countEl.style.fontSize = '0.85em';
    countEl.style.color = 'var(--text-secondary)';
    countEl.style.marginTop = '4px';
    countEl.textContent = `${attachedFiles.length}/${MAX_FILES} files selected`;
    fileAttachments.appendChild(countEl);
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function sendMessage() {
  if (isSending) return;

  const messageText = messageInput.value.trim();

  if (!messageText && attachedFiles.length === 0) {
    messageInput.focus();
    return;
  }

  isSending = true;

  // Add user message to UI immediately
  removeWelcomeMessage();
  const userMsg = {
    role: 'user',
    content: messageText || (attachedFiles.length > 0 ? `(${attachedFiles.length} file(s) attached)` : ''),
    files: attachedFiles.map(f => ({ name: f.name, size: f.size }))
  };
  messages.push(userMsg);
  addMessageToUI(userMsg);

  // Clear input immediately for better UX
  messageInput.value = '';
  messageInput.placeholder = 'Sending...';
  fileInput.value = '';
  sendBtn.disabled = true;

  // Show loading state
  showLoading(true);

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    formData.append('message', messageText);
    formData.append('language', currentLanguage || 'en');

    // Append all attached files
    attachedFiles.forEach((file) => {
      formData.append('files', file);
    });

    // Send to backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = {
        role: 'assistant',
        content: `Error: ${data.error || 'Failed to process message'}`
      };
      messages.push(errorMsg);
      addMessageToUI(errorMsg);
      isSending = false;
      return;
    }

    // Update conversation ID on first message
    if (!conversationId) {
      conversationId = data.conversationId;
    }

    messages = data.history;

    // Clear attached files
    attachedFiles = [];
    updateFileAttachmentDisplay();

    // Update UI with full history
    messagesArea.innerHTML = '';
    updateMessagesDisplay();

    // Reload conversations list to show updated titles
    await loadConversations();

    // Update header with generated title if available
    const updatedConv = conversationsList.find(c => c.id === conversationId);
    if (updatedConv && updatedConv.title && updatedConv.title !== 'New conversation') {
      console.log('[Frontend] Setting title:', updatedConv.title);
      currentConvInfo.textContent = updatedConv.title;
    }

    // Poll for title updates for next 5 seconds (title generation is async on backend)
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;
      if (pollCount > 10) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const response = await fetch(`/api/session/${sessionId}/conversations`);
        const data = await response.json();
        const conv = data.conversationIds.find(c => c.id === conversationId);

        if (conv && conv.title && conv.title !== 'New conversation' && currentConvInfo.textContent === 'New conversation') {
          console.log('[Frontend] Auto-updating title:', conv.title);
          currentConvInfo.textContent = conv.title;
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('[Frontend] Poll error:', err);
      }
    }, 500);

  } catch (error) {
    console.error('Error:', error);
    const errorMsg = {
      role: 'assistant',
      content: `Error: ${error.message || 'Failed to send message'}`
    };
    messages.push(errorMsg);
    addMessageToUI(errorMsg);
  } finally {
    showLoading(false);
    messageInput.placeholder = 'Type your message...';
    sendBtn.disabled = false;
    messageInput.focus();
    isSending = false;
  }
}

function removeWelcomeMessage() {
  const welcomeMsg = messagesArea.querySelector('.welcome-message');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }
}

function updateMessagesDisplay() {
  messagesArea.innerHTML = '';
  messages.forEach(msg => {
    addMessageToUI(msg);
  });
  scrollToBottom();
}

function addMessageToUI(message) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${message.role}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-bubble';

  // If message has files attached, show them
  if (message.files && message.files.length > 0) {
    const fileInfo = document.createElement('div');
    fileInfo.className = 'message-files';
    message.files.forEach(file => {
      const fileEl = document.createElement('div');
      fileEl.className = 'file-indicator';
      fileEl.textContent = `📎 ${file.name}`;
      fileInfo.appendChild(fileEl);
    });
    contentDiv.appendChild(fileInfo);
  }

  // Message content
  const textEl = document.createElement('div');
  textEl.className = 'message-text';
  textEl.textContent = message.content;
  contentDiv.appendChild(textEl);

  messageEl.appendChild(contentDiv);
  messagesArea.appendChild(messageEl);
}

function showLoading(show) {
  if (show) {
    loadingIndicator.classList.remove('hidden');
  } else {
    loadingIndicator.classList.add('hidden');
  }
}

function scrollToBottom() {
  setTimeout(() => {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }, 0);
}

// Settings management
let currentTheme = 'dark';
let currentLanguage = 'en';

const translations = {
  en: {
    'newChat': '+ New Chat',
    'title': 'Claude AI Chat',
    'newConversation': 'New conversation',
    'clear': '🗑️ Clear',
    'welcome': 'Welcome to Claude AI Chat',
    'welcomeSubtitle': 'Start a conversation or upload a file to begin',
    'chatFeature': 'Chat',
    'chatFeatureDesc': 'Ask questions and have conversations',
    'uploadFeature': 'Upload Files',
    'uploadFeatureDesc': 'Analyze code, documents, and more',
    'historyFeature': 'History',
    'historyFeatureDesc': 'All conversations saved in sidebar',
    'placeholder': 'Type your message...',
    'send': '➤',
    'star': 'Star',
    'unstar': 'Unstar',
    'delete': 'Delete',
    'confirmDelete': 'Delete this conversation?',
    'settings': 'Settings',
    'theme': 'Theme',
    'language': 'Language',
    'account': 'Account Information',
    'sessionId': 'Session ID',
    'region': 'Region',
    'apiType': 'API Type',
    'conversationCount': 'Active Conversations',
    'colorScheme': 'Color Scheme:',
    'selectLanguage': 'Select Language:',
    'darkTheme': 'Dark',
    'lightTheme': 'Technopro',
    'purpleTheme': 'Purple',
    'english': 'English',
    'chinese': '中文 (Chinese)',
    'japanese': '日本語 (Japanese)',
    'save': 'Save Settings'
  },
  zh: {
    'newChat': '+ 新建对话',
    'title': '聊天',
    'newConversation': '新对话',
    'clear': '🗑️ 清除',
    'welcome': '欢迎使用 Claude AI 聊天',
    'welcomeSubtitle': '开始对话或上传文件开始',
    'chatFeature': '聊天',
    'chatFeatureDesc': '提问和进行对话',
    'uploadFeature': '上传文件',
    'uploadFeatureDesc': '分析代码、文档等',
    'historyFeature': '历史记录',
    'historyFeatureDesc': '所有对话都保存在侧栏中',
    'placeholder': '输入你的消息...',
    'send': '➤',
    'star': '标星',
    'unstar': '取消标星',
    'delete': '删除',
    'confirmDelete': '确认删除此对话？',
    'settings': '设置',
    'theme': '主题',
    'language': '语言',
    'account': '账户信息',
    'sessionId': '会话 ID',
    'region': '地区',
    'apiType': 'API 类型',
    'conversationCount': '活跃对话',
    'colorScheme': '颜色方案:',
    'selectLanguage': '选择语言:',
    'darkTheme': '深色',
    'lightTheme': '浅色（Technopro）',
    'purpleTheme': '紫色',
    'english': 'English',
    'chinese': '中文 (Chinese)',
    'japanese': '日本語 (Japanese)',
    'save': '保存设置'
  },
  ja: {
    'newChat': '+ 新しいチャット',
    'title': 'チャット',
    'newConversation': '新しい会話',
    'clear': '🗑️ クリア',
    'welcome': 'Claude AI チャットへようこそ',
    'welcomeSubtitle': '会話を開始するか、ファイルをアップロードして開始',
    'chatFeature': 'チャット',
    'chatFeatureDesc': '質問して会話してください',
    'uploadFeature': 'ファイルをアップロード',
    'uploadFeatureDesc': 'コード、ドキュメントなどを分析',
    'historyFeature': '履歴',
    'historyFeatureDesc': 'すべての会話がサイドバーに保存されます',
    'placeholder': 'メッセージを入力してください...',
    'send': '➤',
    'star': 'スター',
    'unstar': 'スター解除',
    'delete': '削除',
    'confirmDelete': 'この会話を削除しますか？',
    'settings': '設定',
    'theme': 'テーマ',
    'language': '言語',
    'account': 'アカウント情報',
    'sessionId': 'セッション ID',
    'region': 'リージョン',
    'apiType': 'API タイプ',
    'conversationCount': 'アクティブな会話',
    'colorScheme': 'カラースキーム:',
    'selectLanguage': '言語を選択:',
    'darkTheme': 'ダーク',
    'lightTheme': 'ライト（Technopro）',
    'purpleTheme': 'パープル',
    'english': 'English',
    'chinese': '中文 (Chinese)',
    'japanese': '日本語 (Japanese)',
    'save': '設定を保存'
  }
};

function setupSettings() {
  console.log('[setupSettings] Starting setup');

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const themeSelect = document.getElementById('themeSelect');
  const languageSelect = document.getElementById('languageSelect');

  // Validate all elements exist
  if (!settingsBtn) console.error('settingsBtn not found');
  if (!settingsModal) console.error('settingsModal not found');
  if (!closeSettingsBtn) console.error('closeSettingsBtn not found');
  if (!saveSettingsBtn) console.error('saveSettingsBtn not found');
  if (!themeSelect) console.error('themeSelect not found');
  if (!languageSelect) console.error('languageSelect not found');

  if (!settingsBtn || !settingsModal || !closeSettingsBtn || !saveSettingsBtn || !themeSelect || !languageSelect) {
    console.error('[setupSettings] Some elements missing, aborting');
    return;
  }

  // Load saved settings
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const savedLanguage = localStorage.getItem('language') || 'en';
  currentTheme = savedTheme;
  currentLanguage = savedLanguage;
  themeSelect.value = savedTheme;
  languageSelect.value = savedLanguage;

  console.log('[setupSettings] Applying theme:', savedTheme, 'language:', savedLanguage);

  // Apply saved theme and language
  applyTheme(savedTheme);
  applyLanguage(savedLanguage);

  // Settings button click
  settingsBtn.addEventListener('click', function(e) {
    console.log('[settingsBtn] Clicked');
    e.preventDefault();
    e.stopPropagation();
    console.log('[settingsBtn] Removing hidden class');
    settingsModal.classList.remove('hidden');
    updateUserInfo();
  });

  // Close settings
  closeSettingsBtn.addEventListener('click', function(e) {
    console.log('[closeSettingsBtn] Clicked');
    e.preventDefault();
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', function(e) {
    if (e.target === settingsModal) {
      console.log('[settingsModal backdrop] Clicked');
      settingsModal.classList.add('hidden');
    }
  });

  // Save settings
  saveSettingsBtn.addEventListener('click', function(e) {
    console.log('[saveSettingsBtn] Clicked');
    e.preventDefault();
    const newTheme = themeSelect.value;
    const newLanguage = languageSelect.value;

    localStorage.setItem('theme', newTheme);
    localStorage.setItem('language', newLanguage);

    currentTheme = newTheme;
    currentLanguage = newLanguage;

    applyTheme(newTheme);
    applyLanguage(newLanguage);

    settingsModal.classList.add('hidden');
  });

  // Theme change preview
  themeSelect.addEventListener('change', function(e) {
    console.log('[themeSelect] Changed to:', e.target.value);
    applyTheme(e.target.value);
  });

  // Language change preview
  languageSelect.addEventListener('change', function(e) {
    console.log('[languageSelect] Changed to:', e.target.value);
    applyLanguage(e.target.value);
  });

  console.log('[setupSettings] Setup complete, all listeners attached');
}

function applyTheme(theme) {
  const root = document.documentElement;

  switch(theme) {
    case 'light':
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8f8f8');
      root.style.setProperty('--bg-tertiary', '#f0f0f0');
      root.style.setProperty('--text-primary', '#333333');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--text-tertiary', '#999999');
      root.style.setProperty('--accent', '#00809E');
      root.style.setProperty('--accent-hover', '#0099b8');
      root.style.setProperty('--border', '#e0e0e0');
      root.style.setProperty('--feature-bg', 'linear-gradient(135deg, rgba(240, 248, 255, 0.9) 0%, rgba(230, 240, 250, 0.7) 100%)');
      root.style.setProperty('--feature-bg-hover', 'linear-gradient(135deg, rgba(225, 240, 255, 1) 0%, rgba(210, 235, 255, 0.9) 100%)');
      root.style.setProperty('--feature-border', 'rgba(0, 128, 158, 0.3)');
      root.style.setProperty('--feature-shadow', '0 8px 32px rgba(0, 128, 158, 0.1)');
      document.body.style.background = '#ffffff';
      document.body.style.color = '#333333';
      break;
    case 'purple':
      root.style.setProperty('--bg-primary', '#2a1a4a');
      root.style.setProperty('--bg-secondary', '#3d2663');
      root.style.setProperty('--bg-tertiary', '#4d3073');
      root.style.setProperty('--text-primary', '#f5e6ff');
      root.style.setProperty('--text-secondary', '#d4a8ff');
      root.style.setProperty('--text-tertiary', '#c991e8');
      root.style.setProperty('--accent', '#9d4edd');
      root.style.setProperty('--accent-hover', '#b366ff');
      root.style.setProperty('--border', '#5a3a7a');
      root.style.setProperty('--feature-bg', 'linear-gradient(135deg, rgba(61, 38, 99, 0.8) 0%, rgba(77, 48, 115, 0.4) 100%)');
      root.style.setProperty('--feature-bg-hover', 'linear-gradient(135deg, rgba(61, 38, 99, 0.9) 0%, rgba(77, 48, 115, 0.6) 100%)');
      root.style.setProperty('--feature-border', 'rgba(157, 78, 221, 0.3)');
      root.style.setProperty('--feature-shadow', '0 8px 32px rgba(157, 78, 221, 0.2)');
      document.body.style.background = '#2a1a4a';
      document.body.style.color = '#f5e6ff';
      break;
    default: // dark
      root.style.setProperty('--bg-primary', '#222222');
      root.style.setProperty('--bg-secondary', '#2a2a2a');
      root.style.setProperty('--bg-tertiary', '#333333');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b0b0');
      root.style.setProperty('--text-tertiary', '#c0c0c0');
      root.style.setProperty('--accent', '#D47B5E');
      root.style.setProperty('--accent-hover', '#e89870');
      root.style.setProperty('--border', '#3a3a3a');
      root.style.setProperty('--feature-bg', 'linear-gradient(135deg, rgba(26, 31, 58, 0.8) 0%, rgba(37, 45, 66, 0.4) 100%)');
      root.style.setProperty('--feature-bg-hover', 'linear-gradient(135deg, rgba(26, 31, 58, 0.9) 0%, rgba(37, 45, 66, 0.6) 100%)');
      root.style.setProperty('--feature-border', 'rgba(80, 70, 229, 0.2)');
      root.style.setProperty('--feature-shadow', '0 8px 32px rgba(80, 70, 229, 0.15)');
  }
}

function applyLanguage(language) {
  currentLanguage = language;
  updateUIText();
}

function updateUIText() {
  const t = translations[currentLanguage];

  // Update header
  const titleEl = document.querySelector('.header-left h1');
  if (titleEl) titleEl.textContent = t['title'];

  const newChatBtn = document.getElementById('newChatBtn');
  if (newChatBtn) newChatBtn.textContent = t['newChat'];

  const clearChatBtn = document.getElementById('clearChatBtn');
  if (clearChatBtn) clearChatBtn.innerHTML = t['clear'];

  const messageInput = document.getElementById('messageInput');
  if (messageInput) messageInput.placeholder = t['placeholder'];

  // Update welcome message
  const welcomeMsg = document.querySelector('.welcome-message h2');
  if (welcomeMsg) welcomeMsg.textContent = t['welcome'];

  const welcomeDesc = document.querySelector('.welcome-message p');
  if (welcomeDesc) welcomeDesc.textContent = t['welcomeSubtitle'];

  // Update welcome features
  const features = document.querySelectorAll('.feature');
  if (features.length >= 3) {
    features[0].innerHTML = `📝 <strong>${t['chatFeature']}</strong><br>${t['chatFeatureDesc']}`;
    features[1].innerHTML = `📎 <strong>${t['uploadFeature']}</strong><br>${t['uploadFeatureDesc']}`;
    features[2].innerHTML = `💾 <strong>${t['historyFeature']}</strong><br>${t['historyFeatureDesc']}`;
  }

  // Update settings
  const settingsHeader = document.querySelector('.settings-header h2');
  if (settingsHeader) settingsHeader.textContent = t['settings'];

  // Update settings section headers
  const settingsSections = document.querySelectorAll('.settings-section h3');
  if (settingsSections.length >= 3) {
    settingsSections[0].textContent = t['theme'];
    settingsSections[1].textContent = t['language'];
    settingsSections[2].textContent = t['account'];
  }

  // Update settings labels
  const labels = document.querySelectorAll('.settings-group label');
  if (labels.length >= 6) {
    labels[0].textContent = t['colorScheme'];
    labels[1].textContent = t['selectLanguage'];
    labels[2].textContent = t['sessionId'];
    labels[3].textContent = t['region'];
    labels[4].textContent = t['apiType'];
    labels[5].textContent = t['conversationCount'];
  }

  // Update select options
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.innerHTML = `
      <option value="dark">${t['darkTheme']}</option>
      <option value="light">${t['lightTheme']}</option>
      <option value="purple">${t['purpleTheme']}</option>
    `;
    themeSelect.value = currentTheme;
  }

  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.innerHTML = `
      <option value="en">${t['english']}</option>
      <option value="zh">${t['chinese']}</option>
      <option value="ja">${t['japanese']}</option>
    `;
    languageSelect.value = currentLanguage;
  }

  // Update save button
  const saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn) saveBtn.textContent = t['save'];
}

function updateUserInfo() {
  document.getElementById('sessionIdDisplay').textContent = sessionId || '-';
  document.getElementById('regionDisplay').textContent = 'ap-northeast-1';
  document.getElementById('apiTypeDisplay').textContent = 'Bedrock/Claude API';
  document.getElementById('conversationCountDisplay').textContent = conversationsList.length.toString();
}

// Global settings functions
window.openSettings = function() {
  console.log('[openSettings] Called');
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.classList.remove('hidden');
    updateUserInfo();
  }
};

window.closeSettings = function() {
  console.log('[closeSettings] Called');
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.classList.add('hidden');
  }
};

// Start the chat
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Init] DOMContentLoaded triggered');

  // Initialize settings FIRST (with better error handling)
  try {
    setupSettings();
    console.log('[Init] setupSettings() completed');
  } catch (e) {
    console.error('[Init] setupSettings() error:', e);
  }

  // Then initialize chat
  try {
    initChat();
    console.log('[Init] initChat() completed');
  } catch (e) {
    console.error('[Init] initChat() error:', e);
  }
});

window.handleFeatureClick = function(action) {
  console.log('[Feature Click]', action);

  if (action === 'chat') {
    console.log('[Feature] Removing welcome message and focusing input');
    removeWelcomeMessage();
    messageInput.focus();
  } else if (action === 'upload') {
    console.log('[Feature] Triggering file upload');
    fileBtn.click();
  } else if (action === 'history') {
    console.log('[Feature] Scrolling to conversations list');
    conversationsListEl.scrollIntoView({ behavior: 'smooth' });
  }
};
