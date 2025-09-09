import '../github-js/index.ts'

declare global {
  interface Window {
    CodeMirror: any
  }
}

export class GitHubHighlighter {
  private static instance: GitHubHighlighter
  private loaded = false
  private codeMirror: any = null

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
      await this.loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css')
      await this.loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/github.min.css')
      if (typeof window !== 'undefined' && window.CodeMirror) {
        this.codeMirror = window.CodeMirror
        this.loaded = true
        console.log('GitHub CodeMirror modes loaded successfully')
      } else {
        throw new Error('CodeMirror not available')
      }
    } catch (error) {
      console.warn('Failed to load GitHub assets:', error)
      this.loaded = true // Prevent infinite retry
    }
  }

  private loadStylesheet(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }
      
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onload = () => resolve()
      link.onerror = reject
      document.head.appendChild(link)
    })
  }

  highlight(code: string, language: string): string {
    if (!this.loaded || !this.codeMirror) {
      return this.escapeHtml(code)
    }

    try {
      // Map common languages to CodeMirror modes
      const modeMap: Record<string, string> = {
        'javascript': 'javascript',
        'js': 'javascript',
        'typescript': 'javascript',
        'ts': 'javascript',
        'markdown': 'gfm',
        'md': 'gfm',
        'html': 'xml',
        'xml': 'xml',
        'json': 'javascript',
        'python': 'python',
        'java': 'text/x-java',
        'cpp': 'text/x-c++src',
        'c': 'text/x-csrc',
        'css': 'css',
        'php': 'php',
        'ruby': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'shell': 'shell',
        'bash': 'shell',
        'sql': 'sql'
      }

      const mode = modeMap[language?.toLowerCase()] || 'gfm'
      
      // Create a temporary div to hold the highlighted code
      const tempDiv = document.createElement('div')
      
      // Use CodeMirror's runMode to highlight the code
      if (this.codeMirror.runMode) {
        this.codeMirror.runMode(code, mode, tempDiv)
        return tempDiv.innerHTML
      } else {
        return this.escapeHtml(code)
      }
    } catch (error) {
      console.warn('GitHub CodeMirror highlighting failed:', error)
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