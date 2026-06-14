/**
 * Shared hljs color token classes for syntax highlighting.
 *
 * Used by both CodeBlock and DialogSQL to keep the color scheme consistent.
 * If the color scheme changes, update this single constant.
 */
export const HLJS_TOKEN_CLASSES =
  '[&_code]:break-words [&_pre]:m-0 [&_pre]:max-w-full [&_pre]:whitespace-pre-wrap [&_.hljs-keyword]:text-purple-600 [&_.hljs-string]:text-green-700 [&_.hljs-number]:text-blue-600 [&_.hljs-comment]:text-gray-500 [&_.hljs-built_in]:text-cyan-700 [&_.hljs-title]:text-blue-700 [&_.hljs-attr]:text-orange-600 [&_.hljs-literal]:text-blue-600 dark:[&_.hljs-keyword]:text-purple-400 dark:[&_.hljs-string]:text-green-400 dark:[&_.hljs-number]:text-blue-400 dark:[&_.hljs-comment]:text-gray-400 dark:[&_.hljs-built_in]:text-cyan-400 dark:[&_.hljs-title]:text-blue-400 dark:[&_.hljs-attr]:text-orange-400 dark:[&_.hljs-literal]:text-blue-400'
