const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const execAsync = promisify(exec);

const {
  BedrockRuntimeClient,
  InvokeModelCommand
} = require('@aws-sdk/client-bedrock-runtime');

const mammoth = require('mammoth');

// Note: If behind corporate proxy with CA certificate injection,
// add the CA certificate to Node's certificate chain instead of disabling verification
// Example: process.env.NODE_EXTRA_CA_CERTS = 'path/to/ca-bundle.crt'

const app = express();
const PORT = process.env.PORT || 3002;
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-1';
const API_TYPE = process.env.API_TYPE || 'bedrock';
const AWS_ENDPOINT_URL = process.env.AWS_ENDPOINT_URL;

// Load credentials from ~/.claude/settings.json if available
function loadCredentialsFromSettings() {
  try {
    const settingsPath = path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      if (settings.env) {
        return settings.env;
      }
    }
  } catch (error) {
    console.warn('Warning: Could not load settings from ~/.claude/settings.json:', error.message);
  }
  return {};
}

const claudeSettings = loadCredentialsFromSettings();

// Initialize Bedrock client
let bedrockClient;
try {
  const clientConfig = {
    region: AWS_REGION
  };

  // Priority: Claude settings > Environment variables > AWS profile
  const accessKeyId = claudeSettings.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = claudeSettings.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = claudeSettings.AWS_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;

  if (accessKeyId && secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    };

    if (sessionToken) {
      clientConfig.credentials.sessionToken = sessionToken;
    }
    console.log('✓ Using credentials from ~/.claude/settings.json');
  } else if (process.env.AWS_PROFILE) {
    process.env.AWS_SDK_LOAD_CONFIG = 'true';
    console.log('✓ Using AWS profile:', process.env.AWS_PROFILE);
  }

  // Add endpoint URL if provided (for VPC endpoints)
  const endpointUrl = claudeSettings.AWS_ENDPOINT_URL || AWS_ENDPOINT_URL;
  if (endpointUrl) {
    clientConfig.endpoint = endpointUrl;
    console.log('✓ Using VPC endpoint');
  }

  bedrockClient = new BedrockRuntimeClient(clientConfig);
  console.log('✓ Bedrock client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Bedrock client:', error.message);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Conversation management (session-based, in-memory)
const conversations = new Map(); // conversationId -> { id, sessionId, createdAt, messages[] }
const sessionConversations = new Map(); // sessionId -> { conversationIds: [], createdAt }

function getOrCreateSession(sessionId) {
  if (!sessionConversations.has(sessionId)) {
    sessionConversations.set(sessionId, {
      conversationIds: [],
      createdAt: new Date()
    });
  }
  return sessionConversations.get(sessionId);
}

function createConversation(sessionId) {
  const conversationId = uuidv4();
  const session = getOrCreateSession(sessionId);

  conversations.set(conversationId, {
    id: conversationId,
    sessionId: sessionId,
    createdAt: new Date(),
    title: null, // Will be auto-generated after first assistant message
    starred: false, // Star status for favorites
    messages: []
  });

  session.conversationIds.push(conversationId);
  return conversationId;
}

function setConversationTitle(conversationId, title) {
  const conversation = getConversation(conversationId);
  if (conversation) {
    conversation.title = title;
  }
}

async function generateConversationTitle(conversationId, language = 'en') {
  const conversation = getConversation(conversationId);
  if (!conversation || conversation.title) return; // Already has title

  try {
    // Get first user message and first assistant response
    const userMsg = conversation.messages.find(m => m.role === 'user');
    const assistantMsg = conversation.messages.find(m => m.role === 'assistant');

    if (!userMsg || !assistantMsg) return;

    // Build prompt based on language
    let prompt;
    let languageInstruction;

    switch (language) {
      case 'zh':
        languageInstruction = '请用中文总结以下对话，生成一个简短的标题（最多8个字）。标题应该概括主要话题。';
        prompt = `${languageInstruction}

用户: ${userMsg.content.substring(0, 200)}

仅回复标题，不要有其他任何文字。`;
        break;
      case 'ja':
        languageInstruction = '以下の会話を日本語で要約し、短いタイトル（最大8語）を生成してください。タイトルは主なトピックをキャプチャする必要があります。';
        prompt = `${languageInstruction}

ユーザー: ${userMsg.content.substring(0, 200)}

タイトルのみで返してください。他のテキストはありません。`;
        break;
      default: // 'en' or others
        languageInstruction = 'Summarize the following conversation in a very short title (3-8 words max). The title should capture the main topic.';
        prompt = `${languageInstruction}

User: ${userMsg.content.substring(0, 200)}

Respond with ONLY the title, nothing else. No quotes, no extra text.`;
    }

    // Call Claude API directly for title generation
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const modelId = process.env.ANTHROPIC_MODEL || 'arn:aws:bedrock:ap-northeast-1:717279689801:application-inference-profile/nvgwb4nzdaq8';

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 100,
      messages: messages
    };

    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const titleResponse = responseBody.content[0].text || '';
    const title = titleResponse.trim().substring(0, 50); // Limit to 50 chars

    if (title && title.length > 2) {
      setConversationTitle(conversationId, title);
    }
  } catch (error) {
    // Silently fail - title generation is optional
    console.error('[Title Generation] Error:', error.message);
  }
}

function getConversation(conversationId) {
  return conversations.get(conversationId);
}

function addMessageToConversation(conversationId, role, content, files = []) {
  const conversation = getConversation(conversationId);
  if (!conversation) return null;

  const message = {
    id: uuidv4(),
    role: role,
    content: content,
    files: files,
    timestamp: new Date().toISOString()
  };

  conversation.messages.push(message);
  return message;
}

function getConversationHistory(conversationId, limit = 20) {
  const conversation = getConversation(conversationId);
  if (!conversation) return [];

  // Return last N messages for context
  return conversation.messages.slice(-limit);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/json',
      'text/markdown',
      'application/x-python',
      'text/x-python',
      'application/javascript',
      'text/javascript',
      'text/html',
      'text/xml',
      'application/xml',
      'text/x-shellscript',
      'application/x-yaml',
      'text/yaml'
    ];

    // Comprehensive list of allowed file extensions (including Unicode filenames support)
    const allowedExtensions = [
      'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php', 'sh', 'sql',
      'yaml', 'yml', 'toml', 'xml', 'html', 'css', 'scss', 'md', 'txt', 'json', 'csv',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'log', 'conf', 'config', 'cfg', 'ini', 'env',
      'dockerfile', 'makefile', 'gradle', 'maven', 'pom',
      'lock', 'mod', 'sum',  // Go, Rust lock files
      'dart', 'swift', 'kt', 'scala', 'clojure', 'r', 'pl', 'lua',
      'jsx', 'vue', 'svelte', 'less',
      'proto', 'graphql', 'gql',
      'sol', 'vy',  // Solidity, Vyper
      'bat', 'cmd', 'ps1', 'psm1',  // Windows scripts
      'groovy', 'gradle', 'ant'  // Build scripts
    ];

    // Get file extension (handle Unicode filenames correctly)
    const fileName = file.originalname;
    const lastDotIndex = fileName.lastIndexOf('.');
    const fileExt = lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';

    // Check if MIME type is allowed or extension is in allowed list
    // Also allow any text/* MIME type for better Unicode support
    const isMimeAllowed = allowedMimes.includes(file.mimetype) ||
                         file.mimetype.startsWith('text/') ||
                         file.mimetype.startsWith('application/');
    const isExtAllowed = allowedExtensions.includes(fileExt);

    if (isMimeAllowed || isExtAllowed || fileExt) {
      // Allow files without extension or with recognized extensions
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload and analyze file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!bedrockClient) {
      return res.status(500).json({ error: 'Bedrock client not initialized. Check AWS credentials.' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const userPrompt = req.body.prompt || 'Please analyze this file and provide insights.';

    // Call AWS Bedrock API
    const response = await callBedrockAPI(req.file.originalname, fileContent, userPrompt);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      fileName: req.file.originalname,
      analysis: response
    });

  } catch (error) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to process file',
      details: error.response?.data || null
    });
  }
});

// Call Claude API - supports both single file analysis and multi-turn chat
async function callBedrockAPI(message, messageHistory = null, fileContent = '', fileInfo = []) {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (apiKey) {
    // Use Claude API directly
    console.log('Using Claude API...');
    return await callClaudeAPIChat(apiKey, message, messageHistory, fileContent, fileInfo);
  } else {
    // Use AWS Bedrock
    console.log('Using AWS Bedrock...');
    return await callBedrockAPIInternalChat(message, messageHistory, fileContent, fileInfo);
  }
}

// Call AWS Bedrock API for chat (multi-turn conversation)
async function callBedrockAPIInternalChat(message, messageHistory, fileContent, fileInfo) {
  const modelId = process.env.ANTHROPIC_MODEL || 'arn:aws:bedrock:ap-northeast-1:717279689801:application-inference-profile/nvgwb4nzdaq8';

  // Build context from message history
  const messages = messageHistory || [{ role: 'user', content: message }];

  // If no history, create simple message
  if (!messageHistory) {
    messages[0].content = message;
    if (fileContent && fileInfo.length > 0) {
      messages[0].content += `\n\n[File: ${fileInfo[0].name}]\n\`\`\`\n${fileContent}\n\`\`\``;
    }
  }

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2048,
    messages: messages
  };

  try {
    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      console.log('✓ Successfully called AWS Bedrock API');
      return responseBody.content[0].text;
    } else {
      throw new Error('Invalid response format from Bedrock API');
    }
  } catch (error) {
    throw new Error(`Bedrock API error: ${error.message}`);
  }
}

// Call AWS Bedrock API (original file analysis - kept for backward compatibility)
async function callBedrockAPIInternal(fileName, fileContent, userPrompt) {
  const modelId = process.env.ANTHROPIC_MODEL || 'arn:aws:bedrock:ap-northeast-1:717279689801:application-inference-profile/nvgwb4nzdaq8';

  // Detect file type from extension (improved with more languages and formats)
  const fileExt = fileName.split('.').pop().toLowerCase();
  const fileTypeMap = {
    // Programming Languages
    'py': 'Python', 'js': 'JavaScript', 'ts': 'TypeScript', 'jsx': 'JSX', 'tsx': 'TSX',
    'java': 'Java', 'cpp': 'C++', 'c': 'C', 'h': 'C Header', 'hpp': 'C++ Header',
    'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby', 'php': 'PHP', 'sh': 'Shell', 'bash': 'Bash',
    'sql': 'SQL', 'pl': 'Perl', 'r': 'R', 'swift': 'Swift', 'kt': 'Kotlin', 'scala': 'Scala',
    'dart': 'Dart', 'lua': 'Lua', 'clojure': 'Clojure', 'groovy': 'Groovy',
    'sol': 'Solidity', 'vy': 'Vyper',
    // Web & Markup
    'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'less': 'LESS', 'vue': 'Vue', 'svelte': 'Svelte',
    'xml': 'XML', 'json': 'JSON', 'jsonl': 'JSON Lines', 'proto': 'Protocol Buffers',
    'graphql': 'GraphQL', 'gql': 'GraphQL',
    // Configuration & Data
    'yaml': 'YAML', 'yml': 'YAML', 'toml': 'TOML', 'ini': 'INI', 'conf': 'Config', 'cfg': 'Config',
    'config': 'Config', 'env': 'Environment', 'dockerfile': 'Dockerfile', 'makefile': 'Makefile',
    'gradle': 'Gradle', 'maven': 'Maven', 'pom': 'Maven POM',
    // Documents
    'md': 'Markdown', 'txt': 'Text', 'log': 'Log',
    'pdf': 'PDF', 'doc': 'Word', 'docx': 'Word', 'xls': 'Excel', 'xlsx': 'Excel',
    'ppt': 'PowerPoint', 'pptx': 'PowerPoint', 'csv': 'CSV', 'tsv': 'TSV',
    // Lock/Dependency files
    'lock': 'Lock File', 'mod': 'Module File', 'sum': 'Checksum File',
    'requirements': 'Requirements', 'gemfile': 'Gemfile', 'podfile': 'Podfile',
    // Scripts
    'bat': 'Batch', 'cmd': 'CMD', 'ps1': 'PowerShell', 'psm1': 'PowerShell Module'
  };
  const language = fileTypeMap[fileExt] || 'Unknown';

  const codeExtensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'h', 'hpp',
    'go', 'rs', 'rb', 'php', 'sh', 'bash', 'sql', 'pl', 'r', 'swift', 'kt', 'scala',
    'dart', 'lua', 'clojure', 'groovy', 'sol', 'vy'];
  const documentExtensions = ['md', 'txt', 'log', 'doc', 'docx', 'pdf'];
  const configExtensions = ['yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'config', 'env',
    'dockerfile', 'makefile', 'gradle', 'maven', 'pom', 'lock', 'mod', 'sum',
    'requirements', 'gemfile', 'podfile', 'bat', 'cmd', 'ps1', 'psm1'];

  const isCode = codeExtensions.includes(fileExt);
  const isDocument = documentExtensions.includes(fileExt);
  const fileType = isCode ? 'code' : (isDocument ? 'document' : 'configuration');

  const structuredPrompt = `Analyze the following ${language} file and provide insights in a structured JSON format.

File name: ${fileName}

File content:
\`\`\`
${fileContent}
\`\`\`

User request: ${userPrompt}

Please respond with ONLY valid JSON (no additional text) in this exact format:
{
  "summary": "A brief 1-2 sentence summary of the file",
  "fileType": "code/document/configuration/other",
  "metrics": {
    "complexity": "high/medium/low",
    "lines": <number of lines>,
    "language": "${language}",
    "readability": <0-100>,
    "maintainability": <0-100>
  },
  "keyFindings": [
    { "title": "Finding 1", "description": "Details", "severity": "high/medium/low" }
  ],
  "suggestions": [
    { "title": "Suggestion 1", "description": "Details", "priority": "high/medium/low" }
  ],
  "detailedAnalysis": "Full detailed analysis text",
  "codeSnippets": [
    { "title": "Important code", "code": "snippet here", "language": "${language}" }
  ]
}

Ensure all fields are present. Use empty arrays for empty findings/suggestions. Make sure readability and maintainability are numbers between 0-100.`;

  const messageContent = structuredPrompt;

  // Bedrock-specific payload format - use bedrock-2023-05-31 version
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ]
  };

  try {
    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      console.log('✓ Successfully called AWS Bedrock API');
      const responseText = responseBody.content[0].text;

      // Parse JSON response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const structuredAnalysis = JSON.parse(jsonMatch[0]);
          return structuredAnalysis;
        }
      } catch (jsonError) {
        console.warn('Failed to parse structured response, falling back to text format');
        // Fallback: wrap plain text response in structure
        return {
          summary: 'Analysis complete',
          fileType: fileType,
          metrics: {
            complexity: 'unknown',
            lines: fileContent.split('\n').length,
            language: language,
            readability: 0,
            maintainability: 0
          },
          keyFindings: [],
          suggestions: [],
          detailedAnalysis: responseText,
          codeSnippets: []
        };
      }
    } else {
      throw new Error('Invalid response format from Bedrock API');
    }
  } catch (error) {
    throw new Error(`Bedrock API error: ${error.message}`);
  }
}

// Call Claude API directly for chat (multi-turn conversation)
async function callClaudeAPIChat(apiKey, message, messageHistory, fileContent, fileInfo) {
  const https = require('https');

  // Build context from message history
  const messages = messageHistory || [{ role: 'user', content: message }];

  // If no history, create simple message
  if (!messageHistory) {
    messages[0].content = message;
    if (fileContent && fileInfo.length > 0) {
      messages[0].content += `\n\n[File: ${fileInfo[0].name}]\n\`\`\`\n${fileContent}\n\`\`\``;
    }
  }

  const payload = JSON.stringify({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: messages
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Claude API error (${res.statusCode}): ${data}`));
            return;
          }

          const response = JSON.parse(data);
          if (response.content && response.content[0] && response.content[0].text) {
            console.log(`✓ Successfully called Claude API`);
            resolve(response.content[0].text);
          } else {
            reject(new Error('Invalid response format from Claude API'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Claude API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Call Claude API directly (original file analysis - kept for backward compatibility)
async function callClaudeAPI(apiKey, fileName, fileContent, userPrompt) {
  const https = require('https');

  // Detect file type from extension (improved with more languages and formats)
  const fileExt = fileName.split('.').pop().toLowerCase();
  const fileTypeMap = {
    // Programming Languages
    'py': 'Python', 'js': 'JavaScript', 'ts': 'TypeScript', 'jsx': 'JSX', 'tsx': 'TSX',
    'java': 'Java', 'cpp': 'C++', 'c': 'C', 'h': 'C Header', 'hpp': 'C++ Header',
    'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby', 'php': 'PHP', 'sh': 'Shell', 'bash': 'Bash',
    'sql': 'SQL', 'pl': 'Perl', 'r': 'R', 'swift': 'Swift', 'kt': 'Kotlin', 'scala': 'Scala',
    'dart': 'Dart', 'lua': 'Lua', 'clojure': 'Clojure', 'groovy': 'Groovy',
    'sol': 'Solidity', 'vy': 'Vyper',
    // Web & Markup
    'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'less': 'LESS', 'vue': 'Vue', 'svelte': 'Svelte',
    'xml': 'XML', 'json': 'JSON', 'jsonl': 'JSON Lines', 'proto': 'Protocol Buffers',
    'graphql': 'GraphQL', 'gql': 'GraphQL',
    // Configuration & Data
    'yaml': 'YAML', 'yml': 'YAML', 'toml': 'TOML', 'ini': 'INI', 'conf': 'Config', 'cfg': 'Config',
    'config': 'Config', 'env': 'Environment', 'dockerfile': 'Dockerfile', 'makefile': 'Makefile',
    'gradle': 'Gradle', 'maven': 'Maven', 'pom': 'Maven POM',
    // Documents
    'md': 'Markdown', 'txt': 'Text', 'log': 'Log',
    'pdf': 'PDF', 'doc': 'Word', 'docx': 'Word', 'xls': 'Excel', 'xlsx': 'Excel',
    'ppt': 'PowerPoint', 'pptx': 'PowerPoint', 'csv': 'CSV', 'tsv': 'TSV',
    // Lock/Dependency files
    'lock': 'Lock File', 'mod': 'Module File', 'sum': 'Checksum File',
    'requirements': 'Requirements', 'gemfile': 'Gemfile', 'podfile': 'Podfile',
    // Scripts
    'bat': 'Batch', 'cmd': 'CMD', 'ps1': 'PowerShell', 'psm1': 'PowerShell Module'
  };
  const language = fileTypeMap[fileExt] || 'Unknown';

  const codeExtensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'h', 'hpp',
    'go', 'rs', 'rb', 'php', 'sh', 'bash', 'sql', 'pl', 'r', 'swift', 'kt', 'scala',
    'dart', 'lua', 'clojure', 'groovy', 'sol', 'vy'];
  const documentExtensions = ['md', 'txt', 'log', 'doc', 'docx', 'pdf'];
  const configExtensions = ['yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'config', 'env',
    'dockerfile', 'makefile', 'gradle', 'maven', 'pom', 'lock', 'mod', 'sum',
    'requirements', 'gemfile', 'podfile', 'bat', 'cmd', 'ps1', 'psm1'];

  const isCode = codeExtensions.includes(fileExt);
  const isDocument = documentExtensions.includes(fileExt);
  const fileType = isCode ? 'code' : (isDocument ? 'document' : 'configuration');

  const structuredPrompt = `Analyze the following ${language} file and provide insights in a structured JSON format.

File name: ${fileName}

File content:
\`\`\`
${fileContent}
\`\`\`

User request: ${userPrompt}

Please respond with ONLY valid JSON (no additional text) in this exact format:
{
  "summary": "A brief 1-2 sentence summary of the file",
  "fileType": "code/document/configuration/other",
  "metrics": {
    "complexity": "high/medium/low",
    "lines": <number of lines>,
    "language": "${language}",
    "readability": <0-100>,
    "maintainability": <0-100>
  },
  "keyFindings": [
    { "title": "Finding 1", "description": "Details", "severity": "high/medium/low" }
  ],
  "suggestions": [
    { "title": "Suggestion 1", "description": "Details", "priority": "high/medium/low" }
  ],
  "detailedAnalysis": "Full detailed analysis text",
  "codeSnippets": [
    { "title": "Important code", "code": "snippet here", "language": "${language}" }
  ]
}

Ensure all fields are present. Use empty arrays for empty findings/suggestions. Make sure readability and maintainability are numbers between 0-100.`;

  const payload = JSON.stringify({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: structuredPrompt
      }
    ]
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload)
      },
      rejectUnauthorized: false // Handle corporate proxy
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Claude API error (${res.statusCode}): ${data}`));
            return;
          }

          const response = JSON.parse(data);
          if (response.content && response.content[0] && response.content[0].text) {
            console.log(`✓ Successfully called Claude API`);
            const responseText = response.content[0].text;

            // Parse JSON response
            try {
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const structuredAnalysis = JSON.parse(jsonMatch[0]);
                resolve(structuredAnalysis);
              }
            } catch (jsonError) {
              console.warn('Failed to parse structured response, falling back to text format');
              // Fallback: wrap plain text response in structure
              resolve({
                summary: 'Analysis complete',
                fileType: fileType,
                metrics: {
                  complexity: 'unknown',
                  lines: fileContent.split('\n').length,
                  language: language,
                  readability: 0,
                  maintainability: 0
                },
                keyFindings: [],
                suggestions: [],
                detailedAnalysis: responseText,
                codeSnippets: []
              });
            }
          } else {
            reject(new Error('Invalid response format from Claude API'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Claude API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Chat endpoint - supports conversation with optional file uploads (max 10 files)
app.post('/api/chat', upload.array('files', 10), async (req, res) => {
  try {
    const { sessionId, conversationId, message, language } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    if (!bedrockClient) {
      return res.status(500).json({ error: 'Bedrock client not initialized. Check AWS credentials.' });
    }

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      convId = createConversation(sessionId);
    }

    const conversation = getConversation(convId);
    if (!conversation) {
      return res.status(400).json({ error: 'Conversation not found' });
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Handle file attachments if present (support multiple files)
    let fileInfo = [];
    let filesContent = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const filePath = file.path;
          const fileExt = file.originalname.split('.').pop().toLowerCase();
          let fileContent = '';

          // Handle different file types
          if (fileExt === 'docx') {
            // Extract text from Word document
            const result = await mammoth.extractRawText({ path: filePath });
            fileContent = result.value;
          } else if (fileExt === 'pdf') {
            // For PDF, return a message that PDF handling is limited
            fileContent = '[PDF file detected - text extraction not fully supported. Please provide the document in another format or copy-paste the text.]';
          } else {
            // For text files
            fileContent = fs.readFileSync(filePath, 'utf-8');
          }

          fileInfo.push({
            name: file.originalname,
            size: file.size,
            type: detectFileType(file.originalname),
            language: detectLanguage(file.originalname)
          });

          filesContent.push({
            name: file.originalname,
            content: fileContent
          });

          // Clean up uploaded file
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Error reading file:', fileError.message);
          filesContent.push({
            name: file.originalname,
            content: `[Error reading file: ${fileError.message}]`
          });
          if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
    }

    // Add user message to conversation
    addMessageToConversation(convId, 'user', message, fileInfo);

    // Build message history for Claude (include file content if present)
    const history = getConversationHistory(convId);
    const messagesForClaude = history.map(msg => {
      let content = msg.content;

      // If message has file content, include it
      if (msg.files.length > 0 && msg.role === 'user') {
        // Find the corresponding file contents from current request
        for (const fileData of filesContent) {
          // Check if this file is in the message
          if (msg.files.some(f => f.name === fileData.name)) {
            content += `\n\nFile: ${fileData.name}\n\`\`\`\n${fileData.content}\n\`\`\``;
          }
        }
      }

      return {
        role: msg.role,
        content: content
      };
    });

    // Call Claude API (pass the first file content for compatibility, but all files are in messagesForClaude)
    const firstFileContent = filesContent.length > 0 ? filesContent[0].content : '';
    const response = await callBedrockAPI(message, messagesForClaude, firstFileContent, fileInfo);

    // Add assistant response to conversation
    const assistantMessage = addMessageToConversation(convId, 'assistant', response, []);

    // Generate title for conversation after first assistant message if not already titled
    const conv = getConversation(convId);
    if (conv?.title === null && conv?.messages.length === 2) {
      // Run title generation asynchronously, don't wait for it
      const userLanguage = language || 'en';
      generateConversationTitle(convId, userLanguage).catch(err =>
        console.error('Background title generation error:', err)
      );
    }

    res.json({
      success: true,
      conversationId: convId,
      sessionId: sessionId,
      message: assistantMessage,
      history: conversation.messages
    });

  } catch (error) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Chat error:', error.message);
    res.status(500).json({
      error: error.message || 'Chat failed',
      details: error.response?.data || null
    });
  }
});

// Get conversations for a session
app.get('/api/session/:sessionId/conversations', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionConversations.get(sessionId);

  if (!session) {
    return res.json({ conversationIds: [] });
  }

  const convList = session.conversationIds
    .map(id => {
      const conv = conversations.get(id);
      if (!conv) return null;
      return {
        id: conv.id,
        createdAt: conv.createdAt,
        title: conv.title || 'New conversation',
        starred: conv.starred || false,
        lastMessage: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content.substring(0, 50) : 'New conversation'
      };
    })
    .filter(Boolean);

  res.json({ conversationIds: convList });
});

// Get conversation history
app.get('/api/conversation/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const conversation = getConversation(conversationId);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  res.json({
    id: conversation.id,
    messages: conversation.messages
  });
});

// Delete conversation
app.delete('/api/conversation/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const conversation = getConversation(conversationId);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const sessionId = conversation.sessionId;
  conversations.delete(conversationId);

  const session = sessionConversations.get(sessionId);
  if (session) {
    session.conversationIds = session.conversationIds.filter(id => id !== conversationId);
  }

  res.json({ success: true });
});

// Toggle conversation star status
app.post('/api/conversation/:conversationId/star', (req, res) => {
  const { conversationId } = req.params;
  const conversation = getConversation(conversationId);

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  conversation.starred = !conversation.starred;

  res.json({
    success: true,
    starred: conversation.starred
  });
});

// Helper functions for file type detection
function detectFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const codeExtensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'c', 'h', 'hpp',
    'go', 'rs', 'rb', 'php', 'sh', 'bash', 'sql', 'pl', 'r', 'swift', 'kt', 'scala',
    'dart', 'lua', 'clojure', 'groovy', 'sol', 'vy'];
  const documentExtensions = ['md', 'txt', 'log', 'doc', 'docx', 'pdf'];
  const configExtensions = ['yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'config', 'env',
    'dockerfile', 'makefile', 'gradle', 'maven', 'pom', 'lock', 'mod', 'sum'];

  if (codeExtensions.includes(ext)) return 'code';
  if (documentExtensions.includes(ext)) return 'document';
  if (configExtensions.includes(ext)) return 'configuration';
  return 'other';
}

function detectLanguage(fileName) {
  const fileExt = fileName.split('.').pop().toLowerCase();
  const fileTypeMap = {
    'py': 'Python', 'js': 'JavaScript', 'ts': 'TypeScript', 'jsx': 'JSX', 'tsx': 'TSX',
    'java': 'Java', 'cpp': 'C++', 'c': 'C', 'h': 'C Header', 'hpp': 'C++ Header',
    'go': 'Go', 'rs': 'Rust', 'rb': 'Ruby', 'php': 'PHP', 'sh': 'Shell', 'bash': 'Bash',
    'sql': 'SQL', 'pl': 'Perl', 'r': 'R', 'swift': 'Swift', 'kt': 'Kotlin', 'scala': 'Scala',
    'dart': 'Dart', 'lua': 'Lua', 'clojure': 'Clojure', 'groovy': 'Groovy',
    'sol': 'Solidity', 'vy': 'Vyper',
    'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'less': 'LESS', 'vue': 'Vue', 'svelte': 'Svelte',
    'xml': 'XML', 'json': 'JSON', 'jsonl': 'JSON Lines', 'proto': 'Protocol Buffers',
    'graphql': 'GraphQL', 'gql': 'GraphQL',
    'yaml': 'YAML', 'yml': 'YAML', 'toml': 'TOML', 'ini': 'INI', 'conf': 'Config',
    'md': 'Markdown', 'txt': 'Text', 'log': 'Log',
    'pdf': 'PDF', 'doc': 'Word', 'docx': 'Word', 'xls': 'Excel', 'xlsx': 'Excel'
  };
  return fileTypeMap[fileExt] || 'Unknown';
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiType: API_TYPE,
    bedrockConfigured: !!bedrockClient,
    region: AWS_REGION
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\nClaude File Uploader running on http://localhost:${PORT}`);
  console.log(`API Type: ${API_TYPE}`);
  console.log(`AWS Region: ${AWS_REGION}`);
  console.log(`Bedrock client initialized: ${!!bedrockClient}`);
  if (AWS_ENDPOINT_URL) {
    console.log(`AWS Endpoint: ${AWS_ENDPOINT_URL}`);
  }
  console.log('');
});
