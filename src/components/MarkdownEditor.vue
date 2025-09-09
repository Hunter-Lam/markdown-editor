<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { enhancedMarkdownProcessor } from '../utils/enhancedMarkdown'
import 'katex/dist/katex.min.css'

const markdown = ref(`# Welcome to GitHub Flavored Markdown Editor

This is a **Typora-like** markdown editor with instant rendering and **GitHub Flavored Markdown** support!

## ✨ Features

- [x] Real-time preview with GFM support
- [x] GitHub-style syntax highlighting
- [x] Task lists (like this one!)
- [x] Tables with alignment
- [x] Strikethrough text
- [x] Auto-linking URLs
- [x] Clean interface
- [ ] More features coming soon!

## Code Examples

### JavaScript with GitHub Highlighting

\`\`\`javascript
// GitHub-style syntax highlighting
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// ES6 features
const asyncExample = async () => {
  try {
    const response = await fetch('https://api.github.com/users/octocat');
    const user = await response.json();
    console.log(\`User: \${user.name}\`);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Modern JavaScript features
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
\`\`\`

### Python Example

\`\`\`python
import asyncio
from typing import List, Optional

class DataProcessor:
    """A class for processing data with async support."""
    
    def __init__(self, data: List[int]):
        self.data = data
    
    async def process_async(self) -> Optional[int]:
        """Asynchronously process the data."""
        if not self.data:
            return None
        
        # Simulate async processing
        await asyncio.sleep(0.1)
        return sum(x * 2 for x in self.data if x > 0)

# Usage example
async def main():
    processor = DataProcessor([1, -2, 3, 4, -5])
    result = await processor.process_async()
    print(f"Processed result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`

### JSON Configuration

\`\`\`json
{
  "name": "markdown-editor",
  "version": "1.0.0",
  "features": {
    "gfm": true,
    "syntaxHighlighting": "github",
    "taskLists": true,
    "tables": true,
    "strikethrough": true
  },
  "languages": ["javascript", "python", "rust", "go", "typescript"]
}
\`\`\`

## GitHub Flavored Markdown Features

### Task Lists
- [x] Support for task lists
- [x] Checked items
- [ ] Unchecked items
- [ ] ~~Strikethrough~~ completed items

### Tables with Alignment

| Feature | Status | Priority | Notes |
|---------|:------:|:---------|------:|
| GFM Support | ✅ | High | Using GitHub assets |
| Syntax Highlighting | ✅ | High | Official GitHub JS |
| Task Lists | ✅ | Medium | Interactive checkboxes |
| Tables | ✅ | Medium | With alignment support |
| Strikethrough | ✅ | Low | ~~Like this~~ |
| Auto-linking | ✅ | Low | https://github.com |

### Text Formatting

**Bold text** and *italic text* and ***bold italic***

~~Strikethrough text~~ for deleted content

### Links and References

Auto-linking: https://github.com/microsoft/vscode

[GitHub](https://github.com) - The world's leading software development platform

### Code and Mentions

Inline \`code\` with backticks

You can reference users like @octocat (GitHub-style)

### Blockquotes

> GitHub Flavored Markdown extends the basic Markdown specification.
> 
> > Nested blockquotes are also supported.
> 
> **Features include:**
> - Fenced code blocks with syntax highlighting
> - Tables with column alignment
> - Task lists for todos
> - Strikethrough text

### Horizontal Rules

---

## 🎭 Emoji Support

GitHub supports emoji shortcodes! Try these:

:smile: :heart: :rocket: :fire: :sparkles: :star: :+1: :-1: :warning: :check_mark:

:coffee: :computer: :bulb: :zap: :boom: :tada: :wave: :eyes: :clap: :pray:

You can use emoji shortcodes like \`:smile:\` which renders as :smile:

## 🧮 Math Expressions

### Inline Math
When $a \\ne 0$, there are two solutions to $ax^2 + bx + c = 0$ and they are:

$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$

### Block Math

$$
\\begin{aligned}
\\nabla \\times \\vec{\\mathbf{B}} -\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{E}}}{\\partial t} &= \\frac{4\\pi}{c}\\vec{\\mathbf{j}} \\\\
\\nabla \\cdot \\vec{\\mathbf{E}} &= 4 \\pi \\rho \\\\
\\nabla \\times \\vec{\\mathbf{E}}\\, +\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{B}}}{\\partial t} &= \\vec{\\mathbf{0}} \\\\
\\nabla \\cdot \\vec{\\mathbf{B}} &= 0
\\end{aligned}
$$

### More Math Examples

Fractions: $\\frac{n!}{k!(n-k)!} = \\binom{n}{k}$

Limits: $\\lim_{x \\to \\infty} \\frac{1}{x} = 0$

Integrals: $\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$

Matrices:
$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

---

🚀 Start editing to see GitHub Flavored Markdown with emoji :tada: and math $E = mc^2$ in action!`)

const htmlContent = ref('')

const updateHtmlContent = async () => {
  try {
    htmlContent.value = await enhancedMarkdownProcessor.renderMarkdown(markdown.value)
  } catch (error) {
    console.error('Markdown rendering error:', error)
    htmlContent.value = '<p>Error parsing markdown</p>'
  }
}

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

onMounted(async () => {
  // Initialize the enhanced markdown processor
  await enhancedMarkdownProcessor.initialize()
  
  // Initial render
  await updateHtmlContent()
})

// Watch for content changes
const updateContent = async () => {
  await updateHtmlContent()
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

/* GitHub Flavored Markdown Features */
.preview :deep(del) {
  text-decoration: line-through;
  color: #656d76;
}

.preview :deep(.task-list-item) {
  list-style-type: none;
}

.preview :deep(.task-list-item input) {
  margin: 0 6px 0 -20px;
  vertical-align: middle;
}

.preview :deep(.highlight) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}

/* GitHub-style syntax highlighting - both hljs and CodeMirror */
.preview :deep(.hljs-keyword),
.preview :deep(.cm-keyword) {
  color: #d73a49;
  font-weight: 600;
}

.preview :deep(.hljs-string),
.preview :deep(.cm-string) {
  color: #032f62;
}

.preview :deep(.hljs-number),
.preview :deep(.cm-number) {
  color: #005cc5;
}

.preview :deep(.hljs-comment),
.preview :deep(.cm-comment) {
  color: #6a737d;
  font-style: italic;
}

.preview :deep(.hljs-function),
.preview :deep(.cm-def),
.preview :deep(.cm-variable-2) {
  color: #6f42c1;
}

.preview :deep(.hljs-variable),
.preview :deep(.cm-variable) {
  color: #e36209;
}

.preview :deep(.hljs-property),
.preview :deep(.cm-property) {
  color: #005cc5;
}

.preview :deep(.hljs-boolean),
.preview :deep(.cm-atom) {
  color: #005cc5;
  font-weight: 600;
}

.preview :deep(.hljs-class),
.preview :deep(.cm-variable-3) {
  color: #6f42c1;
  font-weight: 600;
}

.preview :deep(.cm-operator) {
  color: #d73a49;
}

.preview :deep(.cm-bracket) {
  color: #24292e;
}

.preview :deep(.cm-tag) {
  color: #22863a;
}

.preview :deep(.cm-attribute) {
  color: #6f42c1;
}

/* Table alignment support */
.preview :deep(td[align="center"]),
.preview :deep(th[align="center"]) {
  text-align: center;
}

.preview :deep(td[align="right"]),
.preview :deep(th[align="right"]) {
  text-align: right;
}

.preview :deep(td[align="left"]),
.preview :deep(th[align="left"]) {
  text-align: left;
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
  
  /* Dark mode GFM features */
  .preview :deep(del) {
    color: #8b949e;
  }
  
  .preview :deep(.highlight) {
    background: #161b22;
  }
  
  /* Dark mode syntax highlighting - both hljs and CodeMirror */
  .preview :deep(.hljs-keyword),
  .preview :deep(.cm-keyword) {
    color: #ff7b72;
  }
  
  .preview :deep(.hljs-string),
  .preview :deep(.cm-string) {
    color: #a5d6ff;
  }
  
  .preview :deep(.hljs-number),
  .preview :deep(.cm-number) {
    color: #79c0ff;
  }
  
  .preview :deep(.hljs-comment),
  .preview :deep(.cm-comment) {
    color: #8b949e;
  }
  
  .preview :deep(.hljs-function),
  .preview :deep(.cm-def),
  .preview :deep(.cm-variable-2) {
    color: #d2a8ff;
  }
  
  .preview :deep(.hljs-variable),
  .preview :deep(.cm-variable) {
    color: #ffa657;
  }
  
  .preview :deep(.hljs-property),
  .preview :deep(.cm-property) {
    color: #79c0ff;
  }
  
  .preview :deep(.hljs-boolean),
  .preview :deep(.cm-atom) {
    color: #79c0ff;
  }
  
  .preview :deep(.hljs-class),
  .preview :deep(.cm-variable-3) {
    color: #d2a8ff;
  }
  
  .preview :deep(.cm-operator) {
    color: #ff7b72;
  }
  
  .preview :deep(.cm-bracket) {
    color: #e6edf3;
  }
  
  .preview :deep(.cm-tag) {
    color: #7ee787;
  }
  
  .preview :deep(.cm-attribute) {
    color: #d2a8ff;
  }
}
</style>