<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import 'highlight.js/styles/github.css'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

const markdown = ref(`# Welcome to Markdown Editor

This is a **Typora-like** markdown editor with instant rendering.

## Features

- Real-time preview
- Syntax highlighting
- Clean interface
- Split view

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
  
  // ES6 arrow function
  const greet = (name) => {
    return \`Hello, \${name}!\`;
  };
  
  // Array methods
  const numbers = [1, 2, 3, 4, 5];
  const doubled = numbers.map(n => n * 2);
  console.log(doubled);
}

// Call the function
hello();
\`\`\`

### Python Example

\`\`\`python
def fibonacci(n):
    """Generate Fibonacci sequence up to n terms."""
    a, b = 0, 1
    result = []
    
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    
    return result

# Generate first 10 Fibonacci numbers
fib_sequence = fibonacci(10)
print(f"Fibonacci sequence: {fib_sequence}")
\`\`\`

### Lists

- Item 1
- Item 2
  - Nested item
  - Another nested item

### Tables

| Language | Extension | Syntax Highlighting |
|----------|-----------|-------------------|
| JavaScript | .js | ✅ |
| Python | .py | ✅ |
| TypeScript | .ts | ✅ |

### Links and Images

[Link to Google](https://google.com)

> This is a blockquote example with **bold** and *italic* text.

---

Start editing to see the magic! ✨`)

const htmlContent = computed(() => {
  try {
    return marked(markdown.value)
  } catch (error) {
    return '<p>Error parsing markdown</p>'
  }
})

const editorRef = ref<HTMLTextAreaElement>()
const previewRef = ref<HTMLDivElement>()

const syncScroll = (source: 'editor' | 'preview') => {
  if (!editorRef.value || !previewRef.value) return
  
  const editor = editorRef.value
  const preview = previewRef.value
  
  if (source === 'editor') {
    const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
    preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight)
  } else {
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
    editor.scrollTop = scrollPercentage * (editor.scrollHeight - editor.clientHeight)
  }
}

const highlightCodeBlocks = () => {
  if (!previewRef.value) return
  
  nextTick(() => {
    const codeBlocks = previewRef.value!.querySelectorAll('pre code')
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })
  })
}

onMounted(() => {
  // Register languages
  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('python', python)
  hljs.registerLanguage('typescript', typescript)
  hljs.registerLanguage('css', css)
  hljs.registerLanguage('html', html)
  hljs.registerLanguage('json', json)
  hljs.registerLanguage('bash', bash)
  
  // Configure marked for better rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value
        } catch (err) {
          console.error('Highlighting error:', err)
        }
      }
      return code
    }
  })
  
  // Initial highlighting
  highlightCodeBlocks()
})

// Watch for content changes and re-highlight
const updateContent = () => {
  nextTick(() => {
    highlightCodeBlocks()
  })
}

// File operations
const currentFilePath = ref<string | null>(null)
const isModified = ref(false)

const newFile = () => {
  if (isModified.value) {
    const shouldProceed = confirm('You have unsaved changes. Are you sure you want to create a new file?')
    if (!shouldProceed) return
  }
  
  markdown.value = ''
  currentFilePath.value = null
  isModified.value = false
}

const openFile = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Markdown',
        extensions: ['md', 'markdown', 'txt']
      }]
    })
    
    if (selected) {
      const content = await readTextFile(selected as string)
      markdown.value = content
      currentFilePath.value = selected as string
      isModified.value = false
    }
  } catch (error) {
    console.error('Error opening file:', error)
    alert('Failed to open file')
  }
}

const saveFile = async () => {
  try {
    if (currentFilePath.value) {
      await writeTextFile(currentFilePath.value, markdown.value)
      isModified.value = false
    } else {
      await saveAsFile()
    }
  } catch (error) {
    console.error('Error saving file:', error)
    alert('Failed to save file')
  }
}

const saveAsFile = async () => {
  try {
    const filePath = await save({
      filters: [{
        name: 'Markdown',
        extensions: ['md']
      }],
      defaultPath: 'untitled.md'
    })
    
    if (filePath) {
      await writeTextFile(filePath, markdown.value)
      currentFilePath.value = filePath
      isModified.value = false
    }
  } catch (error) {
    console.error('Error saving file:', error)
    alert('Failed to save file')
  }
}

// Track changes
const handleInput = () => {
  isModified.value = true
  updateContent()
}

const getFileName = () => {
  if (!currentFilePath.value) return 'Untitled'
  return currentFilePath.value.split('/').pop() || 'Untitled'
}
</script>

<template>
  <div class="markdown-editor">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button @click="newFile" class="toolbar-btn" title="New File (Ctrl+N)">
          📄 New
        </button>
        <button @click="openFile" class="toolbar-btn" title="Open File (Ctrl+O)">
          📁 Open
        </button>
        <button @click="saveFile" class="toolbar-btn" title="Save File (Ctrl+S)">
          💾 Save
        </button>
        <button @click="saveAsFile" class="toolbar-btn" title="Save As (Ctrl+Shift+S)">
          💾 Save As
        </button>
      </div>
      <div class="toolbar-center">
        <span class="file-name">{{ getFileName() }}{{ isModified ? ' •' : '' }}</span>
      </div>
      <div class="toolbar-right">
        <span class="status">Ready</span>
      </div>
    </div>
    
    <div class="editor-container">
      <div class="editor-panel">
        <div class="panel-header">
          <h3>Editor</h3>
        </div>
        <textarea
          ref="editorRef"
          v-model="markdown"
          class="editor"
          placeholder="Start typing your markdown here..."
          @scroll="syncScroll('editor')"
          @input="handleInput"
        ></textarea>
      </div>
      
      <div class="preview-panel">
        <div class="panel-header">
          <h3>Preview</h3>
        </div>
        <div
          ref="previewRef"
          class="preview"
          v-html="htmlContent"
          @scroll="syncScroll('preview')"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  min-height: 40px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-center {
  flex: 1;
  text-align: center;
}

.toolbar-btn {
  padding: 6px 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #ffffff;
  color: #24292f;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #f3f4f6;
  border-color: #8c959f;
}

.toolbar-btn:active {
  background: #ebecef;
}

.file-name {
  font-weight: 600;
  color: #24292f;
  font-size: 14px;
}

.status {
  font-size: 12px;
  color: #656d76;
}

.editor-container {
  display: flex;
  flex: 1;
  height: calc(100vh - 56px);
}

.editor-panel,
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e1e5e9;
}

.preview-panel {
  border-right: none;
}

.panel-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #586069;
}

.panel-header h3 {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.editor {
  flex: 1;
  border: none;
  outline: none;
  padding: 20px;
  font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  background: #ffffff;
  color: #24292e;
}

.preview {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #ffffff;
  color: #24292e;
  line-height: 1.6;
}

/* Preview content styling */
.preview :deep(h1) {
  font-size: 2em;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eaecef;
}

.preview :deep(h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin-bottom: 16px;
  margin-top: 24px;
}

.preview :deep(h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin-bottom: 16px;
  margin-top: 24px;
}

.preview :deep(p) {
  margin-bottom: 16px;
}

.preview :deep(ul),
.preview :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
}

.preview :deep(li) {
  margin-bottom: 4px;
}

.preview :deep(blockquote) {
  padding: 0 16px;
  margin: 0 0 16px 0;
  color: #6a737d;
  border-left: 4px solid #dfe2e5;
}

.preview :deep(code) {
  background: #f6f8fa;
  border-radius: 3px;
  font-size: 85%;
  padding: 2px 4px;
  font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
}

.preview :deep(pre) {
  background: #f6f8fa;
  border-radius: 6px;
  font-size: 85%;
  line-height: 1.45;
  overflow: auto;
  padding: 16px;
  margin-bottom: 16px;
}

.preview :deep(pre code) {
  background: transparent;
  border: 0;
  display: inline;
  line-height: inherit;
  margin: 0;
  overflow: visible;
  padding: 0;
  word-wrap: normal;
}

.preview :deep(table) {
  border-collapse: collapse;
  border-spacing: 0;
  display: block;
  overflow: auto;
  width: 100%;
  margin-bottom: 16px;
}

.preview :deep(table th),
.preview :deep(table td) {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.preview :deep(table th) {
  background: #f6f8fa;
  font-weight: 600;
}

.preview :deep(table tr) {
  background: #fff;
  border-top: 1px solid #c6cbd1;
}

.preview :deep(table tr:nth-child(2n)) {
  background: #f6f8fa;
}

.preview :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.preview :deep(a:hover) {
  text-decoration: underline;
}

.preview :deep(hr) {
  height: 0.25em;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
}

.preview :deep(strong) {
  font-weight: 600;
}

.preview :deep(em) {
  font-style: italic;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .markdown-editor {
    background: #0d1117;
  }
  
  .toolbar {
    background: #161b22;
    border-bottom-color: #30363d;
  }
  
  .toolbar-btn {
    background: #21262d;
    border-color: #30363d;
    color: #e6edf3;
  }
  
  .toolbar-btn:hover {
    background: #30363d;
    border-color: #8b949e;
  }
  
  .toolbar-btn:active {
    background: #262c36;
  }
  
  .file-name {
    color: #e6edf3;
  }
  
  .status {
    color: #8b949e;
  }
  
  .editor-panel,
  .preview-panel {
    border-right-color: #30363d;
  }
  
  .panel-header {
    background: #161b22;
    border-bottom-color: #30363d;
    color: #8b949e;
  }
  
  .editor {
    background: #0d1117;
    color: #e6edf3;
  }
  
  .preview {
    background: #0d1117;
    color: #e6edf3;
  }
  
  .preview :deep(h1) {
    border-bottom-color: #30363d;
  }
  
  .preview :deep(blockquote) {
    color: #8b949e;
    border-left-color: #30363d;
  }
  
  .preview :deep(code) {
    background: #161b22;
  }
  
  .preview :deep(pre) {
    background: #161b22;
  }
  
  .preview :deep(table th),
  .preview :deep(table td) {
    border-color: #30363d;
  }
  
  .preview :deep(table th) {
    background: #161b22;
  }
  
  .preview :deep(table tr) {
    background: #0d1117;
    border-top-color: #30363d;
  }
  
  .preview :deep(table tr:nth-child(2n)) {
    background: #161b22;
  }
  
  .preview :deep(a) {
    color: #58a6ff;
  }
  
  .preview :deep(hr) {
    background-color: #30363d;
  }
}
</style>