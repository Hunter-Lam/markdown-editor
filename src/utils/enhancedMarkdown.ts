import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'
import remarkHtml from 'remark-html'
import rehypeKatex from 'rehype-katex'
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
      .use(remarkHtml, {
        sanitize: false // Allow HTML for better rendering
      })
      .use(rehypeKatex, {
        // KaTeX options
        throwOnError: false,
        strict: false
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
    
    return html.replace(codeBlockRegex, (match, language, code) => {
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

  // Emoji support methods
  static processEmojis(text: string): string {
    // GitHub emoji shortcodes - curated list of popular emojis without duplicates
    const emojiMap: Record<string, string> = {
      // Smileys & Emotion
      ':smile:': '😄', ':grin:': '😁', ':joy:': '😂', ':laughing:': '😆',
      ':blush:': '😊', ':heart_eyes:': '😍', ':kissing_heart:': '😘',
      ':wink:': '😉', ':stuck_out_tongue:': '😛', ':sunglasses:': '😎',
      ':confused:': '😕', ':cry:': '😢', ':sob:': '😭', ':angry:': '😠',
      ':rage:': '😡', ':thinking:': '🤔', ':neutral_face:': '😐',
      ':unamused:': '😒', ':roll_eyes:': '🙄', ':smirk:': '😏',

      // People & Body
      ':wave:': '👋', ':thumbsup:': '👍', ':thumbsdown:': '👎',
      ':ok_hand:': '👌', ':v:': '✌️', ':crossed_fingers:': '🤞',
      ':point_left:': '👈', ':point_right:': '👉', ':point_up:': '☝️',
      ':point_down:': '👇', ':clap:': '👏', ':raised_hands:': '🙌',
      ':pray:': '🙏', ':muscle:': '💪', ':eyes:': '👀',

      // Animals & Nature
      ':dog:': '🐶', ':cat:': '🐱', ':mouse:': '🐭', ':bear:': '🐻',
      ':panda_face:': '🐼', ':tiger:': '🐯', ':lion:': '🦁',
      ':pig:': '🐷', ':frog:': '🐸', ':monkey_face:': '🐵',

      // Food & Drink
      ':apple:': '🍎', ':banana:': '🍌', ':pizza:': '🍕',
      ':hamburger:': '🍔', ':coffee:': '☕', ':beer:': '🍺',
      ':wine_glass:': '🍷', ':cake:': '🍰',

      // Activity
      ':soccer:': '⚽', ':basketball:': '🏀', ':football:': '🏈',
      ':tennis:': '🎾', ':golf:': '⛳', ':video_game:': '🎮',

      // Travel & Places
      ':car:': '🚗', ':taxi:': '🚕', ':bus:': '🚌', ':train:': '🚆',
      ':airplane:': '✈️', ':rocket:': '🚀', ':bike:': '🚲',

      // Objects
      ':computer:': '💻', ':iphone:': '📱', ':camera:': '📷',
      ':bulb:': '💡', ':book:': '📖', ':money_with_wings:': '💸',

      // Symbols
      ':heart:': '❤️', ':yellow_heart:': '💛', ':green_heart:': '💚',
      ':blue_heart:': '💙', ':purple_heart:': '💜', ':broken_heart:': '💔',
      ':star:': '⭐', ':sparkles:': '✨', ':fire:': '🔥',
      ':zap:': '⚡', ':boom:': '💥', ':tada:': '🎉',
      ':confetti_ball:': '🎊', ':balloon:': '🎈', ':gift:': '🎁',
      ':trophy:': '🏆', ':medal:': '🥇', ':crown:': '👑',
      ':100:': '💯', ':warning:': '⚠️', ':white_check_mark:': '✅',
      ':x:': '❌', ':exclamation:': '❗', ':question:': '❓'
    }

    return text.replace(/:([a-z_+\-0-9]+):/g, (match, emojiName) => {
      return emojiMap[match] || match
    })
  }
}

export const enhancedMarkdownProcessor = EnhancedMarkdownProcessor.getInstance()