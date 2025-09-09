// Wrapper for GitHub's official CodeMirror modes
// This file makes GitHub's JavaScript files work as ES modules

// Create a mock CodeMirror object if it doesn't exist
if (typeof window !== 'undefined' && !window.CodeMirror) {
  window.CodeMirror = {
    defineMode: (name: string, factory: any) => {
      // Store mode definitions
      if (!window.CodeMirror.modes) {
        window.CodeMirror.modes = {}
      }
      window.CodeMirror.modes[name] = factory
    },
    defineMIME: (mime: string, spec: any) => {
      // Store MIME type definitions
      if (!window.CodeMirror.mimeTypes) {
        window.CodeMirror.mimeTypes = {}
      }
      window.CodeMirror.mimeTypes[mime] = spec
    },
    getMode: (config: any, spec: any) => {
      const modeName = typeof spec === 'string' ? spec : spec.name || 'null'
      const factory = window.CodeMirror.modes[modeName]
      if (factory) {
        return factory(config, spec)
      }
      return { name: 'null', token: () => null }
    },
    overlayMode: (base: any, overlay: any) => {
      return {
        startState: () => ({
          base: base.startState(),
          overlay: overlay.startState(),
          basePos: 0,
          baseCur: null,
          overlayPos: 0,
          overlayCur: null
        }),
        copyState: (state: any) => ({
          base: base.copyState(state.base),
          overlay: overlay.copyState(state.overlay),
          basePos: state.basePos,
          baseCur: null,
          overlayPos: state.overlayPos,
          overlayCur: null
        }),
        token: (stream: any, state: any) => {
          if (stream.start == stream.pos && overlay.token) {
            return overlay.token(stream, state.overlay) || base.token(stream, state.base)
          }
          return base.token(stream, state.base)
        }
      }
    },
    runMode: (text: string, mode: any, callback: any) => {
      const lines = text.split('\n')
      const modeObj = typeof mode === 'string' ? window.CodeMirror.getMode({}, mode) : mode
      let state = modeObj.startState()
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const stream = new StringStream(line)
        
        if (typeof callback === 'function') {
          // Callback mode
          while (!stream.eol()) {
            const style = modeObj.token(stream, state)
            callback(stream.current(), style, i, stream.start, state)
            stream.start = stream.pos
          }
        } else {
          // DOM node mode
          const node = callback
          const lineDiv = document.createElement('div')
          
          while (!stream.eol()) {
            const style = modeObj.token(stream, state)
            const span = document.createElement('span')
            span.textContent = stream.current()
            if (style) {
              span.className = style.split(' ').map((s: string) => `cm-${s}`).join(' ')
            }
            lineDiv.appendChild(span)
            stream.start = stream.pos
          }
          
          node.appendChild(lineDiv)
          if (i < lines.length - 1) {
            node.appendChild(document.createTextNode('\n'))
          }
        }
      }
    },
    modes: {},
    mimeTypes: {},
    Pass: {}
  }
}

// Simple StringStream implementation for CodeMirror
class StringStream {
  public pos: number = 0
  public start: number = 0
  public string: string
  public tabSize: number = 4
  public lineStart: number = 0

  constructor(string: string) {
    this.string = string
  }

  eol(): boolean {
    return this.pos >= this.string.length
  }

  sol(): boolean {
    return this.pos === this.lineStart
  }

  peek(): string | null {
    return this.string.charAt(this.pos) || null
  }

  next(): string | null {
    if (this.pos < this.string.length) {
      return this.string.charAt(this.pos++)
    }
    return null
  }

  eat(match: string | RegExp | ((char: string) => boolean)): string | null {
    const ch = this.string.charAt(this.pos)
    let ok: boolean
    
    if (typeof match === 'string') {
      ok = ch === match
    } else if (match instanceof RegExp) {
      ok = match.test(ch)
    } else {
      ok = match(ch)
    }
    
    if (ok) {
      ++this.pos
      return ch
    }
    return null
  }

  eatWhile(match: string | RegExp | ((char: string) => boolean)): boolean {
    const start = this.pos
    while (this.eat(match)) {}
    return this.pos > start
  }

  eatSpace(): boolean {
    const start = this.pos
    while (/\s/.test(this.string.charAt(this.pos))) this.pos++
    return this.pos > start
  }

  skipToEnd(): void {
    this.pos = this.string.length
  }

  skipTo(ch: string): boolean {
    const found = this.string.indexOf(ch, this.pos)
    if (found > -1) {
      this.pos = found
      return true
    }
    return false
  }

  backUp(n: number): void {
    this.pos -= n
  }

  column(): number {
    return this.pos - this.lineStart
  }

  indentation(): number {
    let i = 0
    while (i < this.string.length && /\s/.test(this.string.charAt(i))) {
      if (this.string.charAt(i) === '\t') {
        i += this.tabSize - (i % this.tabSize)
      } else {
        i++
      }
    }
    return i
  }

  match(pattern: string | RegExp, consume?: boolean, caseInsensitive?: boolean): string[] | boolean | null {
    if (typeof pattern === 'string') {
      const cased = caseInsensitive ? (str: string) => str.toLowerCase() : (str: string) => str
      const substr = this.string.substr(this.pos, pattern.length)
      if (cased(substr) === cased(pattern)) {
        if (consume !== false) this.pos += pattern.length
        return true
      }
      return null
    } else {
      const match = this.string.slice(this.pos).match(pattern)
      if (match && match.index === 0) {
        if (consume !== false) this.pos += match[0].length
        return match
      }
      return null
    }
  }

  current(): string {
    return this.string.slice(this.start, this.pos)
  }

  lookAhead(n: number): string | null {
    const lines = this.string.split('\n')
    // This is a simplified implementation
    return lines[n] || null
  }
}

// Make StringStream available globally
if (typeof window !== 'undefined') {
  (window as any).StringStream = StringStream
}

export { }