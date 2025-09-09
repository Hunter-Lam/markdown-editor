import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import { githubHighlighter } from './githubHighlighter'

export class EnhancedMarkdownProcessor {
  private static instance: EnhancedMarkdownProcessor
  private processor: any
  private initialized = false

  private constructor() {}

  static getInstance(): EnhancedMarkdownProcessor {
    if (!EnhancedMarkdownProcessor.instance) {
      EnhancedMarkdownProcessor.instance = new EnhancedMarkdownProcessor()
    }
    return EnhancedMarkdownProcessor.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Load GitHub syntax highlighting first
    await githubHighlighter.loadGitHubAssets()

    // Create the unified processor with all plugins
    this.processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkEmoji, {
        // Use GitHub-style emoji
        emoticon: false
      })
      .use(remarkMath)
      .use(remarkRehype, {
        allowDangerousHtml: true // Allow HTML for code blocks
      })
      .use(rehypeKatex, {
        // KaTeX options
        throwOnError: false,
        strict: false
      })
      .use(rehypeStringify, {
        allowDangerousHtml: true // Allow HTML for code blocks
      })

    this.initialized = true
  }

  async renderMarkdown(markdown: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      // First process with remark
      let result = await this.processor.process(markdown)
      let html = String(result)

      // Then apply GitHub syntax highlighting to code blocks
      html = this.highlightCodeBlocks(html)

      return html
    } catch (error) {
      console.error('Markdown processing error:', error)
      return `<p>Error processing markdown: ${error}</p>`
    }
  }

  private highlightCodeBlocks(html: string): string {
    // Enhanced regex to match code blocks with language
    const codeBlockRegex = /<pre><code(?:\s+class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g
    
    return html.replace(codeBlockRegex, (_, language, code) => {
      // Decode HTML entities in the code
      const decodedCode = this.decodeHtmlEntities(code)
      
      if (language) {
        // Use GitHub highlighter for syntax highlighting
        const highlightedCode = githubHighlighter.highlight(decodedCode, language)
        return `<pre><code class="language-${language}">${highlightedCode}</code></pre>`
      } else {
        // No language specified, return as-is but escaped
        return `<pre><code>${this.escapeHtml(decodedCode)}</code></pre>`
      }
    })
  }

  private decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

}

export const enhancedMarkdownProcessor = EnhancedMarkdownProcessor.getInstance()