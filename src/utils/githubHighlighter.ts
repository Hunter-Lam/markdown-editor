// GitHub-style syntax highlighter using highlight.js
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

export class GitHubHighlighter {
  private static instance: GitHubHighlighter
  private loaded = false

  private constructor() {}

  static getInstance(): GitHubHighlighter {
    if (!GitHubHighlighter.instance) {
      GitHubHighlighter.instance = new GitHubHighlighter()
    }
    return GitHubHighlighter.instance
  }

  async loadGitHubAssets(): Promise<void> {
    if (this.loaded) return

    try {
      // Configure highlight.js with GitHub-style languages
      hljs.configure({
        classPrefix: 'hljs-',
        languages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'markdown', 'bash', 'shell', 'sql', 'dockerfile', 'nginx']
      })
      
      this.loaded = true
      console.log('GitHub-style syntax highlighting loaded successfully')
    } catch (error) {
      console.warn('Failed to initialize GitHub syntax highlighting:', error)
      this.loaded = true
    }
  }

  highlight(code: string, language: string): string {
    if (!this.loaded) {
      return this.escapeHtml(code)
    }

    try {
      // Use highlight.js to get GitHub-style syntax highlighting
      if (language && hljs.getLanguage(language)) {
        const result = hljs.highlight(code, { language })
        return result.value
      } else {
        // Auto-detect language if specific language not supported
        const result = hljs.highlightAuto(code)
        return result.value
      }
    } catch (error) {
      console.warn('Highlight.js failed, using escaped code:', error)
      return this.escapeHtml(code)
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

}

export const githubHighlighter = GitHubHighlighter.getInstance()