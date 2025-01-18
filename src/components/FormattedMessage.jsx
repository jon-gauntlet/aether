import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { measureRender } from '../utils/performance'

function FormattedMessage({ content }) {
  // Memoize markdown components to prevent unnecessary re-renders
  const components = useMemo(() => ({
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      
      if (!inline && language) {
        return (
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      }
      
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    a({ node, children, href, ...props }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
          {...props}
        >
          {children}
        </a>
      )
    },
    img({ node, src, alt, ...props }) {
      return (
        <img
          src={src}
          alt={alt}
          className="max-w-full h-auto rounded-lg"
          loading="lazy"
          {...props}
        />
      )
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {children}
          </table>
        </div>
      )
    }
  }), [])

  // Memoize remarkGfm plugin to prevent re-initialization
  const remarkPlugins = useMemo(() => [remarkGfm], [])

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={remarkPlugins}
      className="prose prose-sm max-w-none dark:prose-invert"
    >
      {content}
    </ReactMarkdown>
  )
}

// Wrap with performance monitoring and memoization
export default measureRender(memo(FormattedMessage)) 