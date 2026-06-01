import { CheckIcon, CopyIcon } from 'lucide-react'
import { type HTMLAttributes, useEffect, useRef, useState } from 'react'
import { type BundledLanguage, codeToHtml } from 'shiki'
import { cn } from '../../../lib/utils'

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: BundledLanguage
}

export async function highlightCode(code: string, language: BundledLanguage) {
  return await Promise.all([
    codeToHtml(code, {
      lang: language,
      theme: 'one-light',
    }),
    codeToHtml(code, {
      lang: language,
      theme: 'one-dark-pro',
    }),
  ])
}

export const CodeBlock = ({
  code,
  language,
  className,
  ...props
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('')
  const [darkHtml, setDarkHtml] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    highlightCode(code, language).then(([light, dark]) => {
      if (!mounted.current) {
        setHtml(light)
        setDarkHtml(dark)
        mounted.current = true
      }
    })
    return () => {
      mounted.current = false
    }
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'group/codeblock relative w-full overflow-hidden rounded-md border border-border bg-background text-foreground',
        className,
      )}
      {...props}
    >
      <div className="relative">
        <div
          className="overflow-hidden dark:hidden [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-foreground! [&>pre]:text-xs [&_code]:font-mono [&_code]:text-xs"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div
          className="hidden overflow-hidden dark:block [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-foreground! [&>pre]:text-xs [&_code]:font-mono [&_code]:text-xs"
          dangerouslySetInnerHTML={{ __html: darkHtml }}
        />
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity hover:text-foreground group-hover/codeblock:opacity-100"
          type="button"
        >
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <CopyIcon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
