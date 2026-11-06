import React from 'react'

interface RichContentProps {
  content?: string | null
  className?: string
}

function renderDomNode(node: Node, key: string | number): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    return text
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const children = Array.from(el.childNodes).map((child, idx) =>
    renderDomNode(child, `${key}-${idx}`),
  )

  switch (tag) {
    case 'p':
      return (
        <p key={key} className="mb-2 last:mb-0 leading-relaxed text-foreground/90">
          {children}
        </p>
      )
    case 'strong':
    case 'b':
      return (
        <strong key={key} className="font-semibold text-foreground">
          {children}
        </strong>
      )
    case 'em':
    case 'i':
      return (
        <em key={key} className="italic">
          {children}
        </em>
      )
    case 'u':
      return (
        <u key={key} className="underline underline-offset-2">
          {children}
        </u>
      )
    case 's':
    case 'del':
    case 'strike':
      return (
        <s key={key} className="line-through text-muted-foreground">
          {children}
        </s>
      )
    case 'br':
      return <br key={key} />
    case 'hr':
      return <hr key={key} className="my-3 border-border/60" />
    case 'ul':
      return (
        <ul key={key} className="my-2 list-disc pl-5 space-y-1">
          {children}
        </ul>
      )
    case 'ol':
      return (
        <ol key={key} className="my-2 list-decimal pl-5 space-y-1">
          {children}
        </ol>
      )
    case 'li':
      return (
        <li key={key} className="leading-relaxed">
          {children}
        </li>
      )
    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2"
        >
          {children}
        </blockquote>
      )
    case 'code':
      return (
        <code
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
        >
          {children}
        </code>
      )
    case 'pre':
      return (
        <pre
          key={key}
          className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground"
        >
          {children}
        </pre>
      )
    case 'table':
      return (
        <div key={key} className="my-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-border border border-border text-sm">
            {children}
          </table>
        </div>
      )
    case 'thead':
      return (
        <thead key={key} className="bg-muted/50 font-medium text-foreground">
          {children}
        </thead>
      )
    case 'tbody':
      return (
        <tbody key={key} className="divide-y divide-border">
          {children}
        </tbody>
      )
    case 'tr':
      return <tr key={key}>{children}</tr>
    case 'th':
      return (
        <th key={key} className="px-3 py-2 text-left font-semibold">
          {children}
        </th>
      )
    case 'td':
      return (
        <td key={key} className="px-3 py-2 text-foreground/90">
          {children}
        </td>
      )
    case 'h1':
      return (
        <h1 key={key} className="mt-3 mb-1 text-lg font-bold text-foreground">
          {children}
        </h1>
      )
    case 'h2':
      return (
        <h2 key={key} className="mt-3 mb-1 text-base font-bold text-foreground">
          {children}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={key} className="mt-2 mb-1 text-sm font-semibold text-foreground">
          {children}
        </h3>
      )
    case 'div':
      return (
        <div key={key} className="mb-1 last:mb-0">
          {children}
        </div>
      )
    case 'span':
      return <span key={key}>{children}</span>
    case 'script':
    case 'style':
    case 'iframe':
    case 'object':
    case 'embed':
      return null
    default:
      return <React.Fragment key={key}>{children}</React.Fragment>
  }
}

export function RichContent({ content, className = '' }: RichContentProps) {
  if (!content) return null

  // Fast path for non-HTML text
  if (!/<[a-z][\s\S]*>/i.test(content)) {
    return (
      <div className={`whitespace-pre-wrap leading-relaxed text-foreground/90 ${className}`}>
        {content}
      </div>
    )
  }

  if (typeof DOMParser === 'undefined') {
    return (
      <div className={`whitespace-pre-wrap leading-relaxed text-foreground/90 ${className}`}>
        {content.replace(/<[^>]+>/g, ' ')}
      </div>
    )
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const nodes = Array.from(doc.body.childNodes)

    return (
      <div className={`rich-content text-sm text-foreground/90 ${className}`}>
        {nodes.map((node, i) => renderDomNode(node, `node-${i}`))}
      </div>
    )
  } catch {
    return (
      <div className={`whitespace-pre-wrap leading-relaxed text-foreground/90 ${className}`}>
        {content}
      </div>
    )
  }
}
