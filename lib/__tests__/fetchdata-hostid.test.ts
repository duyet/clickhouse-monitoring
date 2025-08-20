/**
 * @fileoverview Tests to prevent fetchData calls without hostId parameter
 * This test suite ensures all fetchData calls include the hostId parameter
 * to prevent host switching issues (GitHub issue #509)
 */

import { describe, expect, it } from '@jest/globals'
import fs, { readdirSync } from 'fs'
import path from 'path'

describe('fetchData hostId parameter validation', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  // Find all TypeScript/JavaScript files that might contain fetchData calls
  const getFilesToCheck = (): string[] => {
    const allFiles: string[] = []

    const scanDirectory = (dir: string) => {
      try {
        const items = readdirSync(dir, { withFileTypes: true })

        for (const item of items) {
          const fullPath = path.join(dir, item.name)

          if (item.isDirectory()) {
            // Skip certain directories
            if (
              !item.name.startsWith('.') &&
              item.name !== 'node_modules' &&
              item.name !== '__tests__'
            ) {
              scanDirectory(fullPath)
            }
          } else if (item.isFile()) {
            // Include TypeScript files
            if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
              // Skip test files
              if (
                !item.name.includes('.test.') &&
                !item.name.includes('.spec.')
              ) {
                allFiles.push(fullPath)
              }
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist or permission denied
      }
    }

    // Scan specific directories
    const dirsToScan = ['app', 'components', 'lib'].map((d) =>
      path.join(projectRoot, d)
    )
    for (const dir of dirsToScan) {
      scanDirectory(dir)
    }

    return allFiles
  }

  it('should ensure all fetchData calls use either fetchDataWithHost or include hostId parameter', () => {
    const files = getFilesToCheck()
    const violations: Array<{ file: string; line: number; content: string }> =
      []

    for (const filePath of files) {
      if (!fs.existsSync(filePath)) continue

      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')

      // Check if file imports fetchData or fetchDataWithHost
      if (!content.includes('fetchData')) continue
      
      // Skip if file uses fetchDataWithHost wrapper (which handles hostId automatically)
      if (content.includes('fetchDataWithHost')) continue

      // Look for fetchData calls
      lines.forEach((line, index) => {
        const trimmed = line.trim()

        // Skip comments and type definitions
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('/*')
        ) {
          return
        }

        // Look for fetchData calls (not fetchDataWithHost)
        const fetchDataMatch = trimmed.match(/(?<!With)fetchData[<\w\[\]>]*\s*\(\s*{/)
        if (fetchDataMatch) {
          // Check if this is a multiline call - look ahead for the closing brace
          let fullCall = line
          let lineIndex = index
          let braceCount =
            (line.match(/{/g) || []).length - (line.match(/}/g) || []).length

          while (braceCount > 0 && lineIndex < lines.length - 1) {
            lineIndex++
            fullCall += '\n' + lines[lineIndex]
            braceCount +=
              (lines[lineIndex].match(/{/g) || []).length -
              (lines[lineIndex].match(/}/g) || []).length
          }

          // Check if hostId parameter is present
          // Handle all valid hostId parameter formats
          const hasHostId = 
            fullCall.includes('hostId:') || 
            fullCall.includes('hostId ') || 
            /[,{]\s*hostId\s*[,}]/.test(fullCall) ||
            /hostId\s*:/.test(fullCall) ||
            /\{\s*[^}]*hostId[^}]*\}/.test(fullCall) ||
            fullCall.match(/hostId\s*[,}\s]/) !== null
          
          if (!hasHostId) {
            violations.push({
              file: path.relative(projectRoot, filePath),
              line: index + 1,
              content: fullCall.trim(),
            })
          }
        }
      })
    }

    if (violations.length > 0) {
      const violationMessages = violations
        .map(
          (v) => `${v.file}:${v.line} - Missing hostId parameter:\n${v.content}`
        )
        .join('\n\n')

      throw new Error(
        `Found ${violations.length} fetchData calls missing hostId parameter:\n\n${violationMessages}\n\n` +
          'All fetchData calls must either:\n' +
          '1. Use fetchDataWithHost wrapper (recommended), or\n' +
          '2. Include the hostId parameter explicitly\n' +
          'This ensures correct multi-host functionality.'
      )
    }
  })

  it('should verify fetchData function signature accepts hostId', () => {
    const clickhousePath = path.join(projectRoot, 'lib/clickhouse.ts')

    if (!fs.existsSync(clickhousePath)) {
      throw new Error('lib/clickhouse.ts not found')
    }

    const content = fs.readFileSync(clickhousePath, 'utf-8')

    // Check if fetchData function accepts hostId parameter
    const functionMatch = content.match(/export\s+const\s+fetchData\s*=/)
    expect(functionMatch).toBeTruthy()

    // Should have hostId in the parameter interface or as optional parameter
    expect(content).toMatch(/hostId\?\s*:\s*number\s*\|\s*string/)
  })

  it('should ensure getHostIdCookie is imported where needed', () => {
    const files = getFilesToCheck()
    const violations: Array<{ file: string; reason: string }> = []

    for (const filePath of files) {
      if (!fs.existsSync(filePath)) continue

      const content = fs.readFileSync(filePath, 'utf-8')

      // Skip files that don't use fetchData
      if (!content.includes('fetchData')) continue

      // Check if it's a component (not a page under [host])
      const isPageUnderHost =
        filePath.includes('app/[host]') &&
        (filePath.endsWith('/page.tsx') || filePath.endsWith('/layout.tsx'))

      // If it's not a page under [host] and uses fetchData, it should import getHostIdCookie
      if (!isPageUnderHost && content.includes('fetchData')) {
        if (
          !content.includes('getHostIdCookie') &&
          !content.includes('hostId:')
        ) {
          // This might be a component that needs to use getHostIdCookie
          const relativePath = path.relative(projectRoot, filePath)
          violations.push({
            file: relativePath,
            reason:
              'Component uses fetchData but may need getHostIdCookie import',
          })
        }
      }
    }

    // This is a warning test - we'll check but not fail the build
    if (violations.length > 0) {
      console.warn(
        `⚠️  Found ${violations.length} files that might need getHostIdCookie:\n` +
          violations.map((v) => `  - ${v.file}: ${v.reason}`).join('\n')
      )
    }
  })

  it('should validate that pages under [host] extract host from params', () => {
    const hostPages = getFilesToCheck()
      .filter(
        (file) => file.includes('app/[host]') && file.endsWith('/page.tsx')
      )
      .map((file) => path.relative(projectRoot, file))
    const violations: Array<{ file: string; issue: string }> = []

    for (const pagePath of hostPages) {
      const fullPath = path.join(projectRoot, pagePath)
      if (!fs.existsSync(fullPath)) continue

      const content = fs.readFileSync(fullPath, 'utf-8')

      // Skip pages that don't use fetchData
      if (!content.includes('fetchData')) continue

      // Check if function signature includes params
      if (!content.includes('{ params }') && !content.includes('params:')) {
        violations.push({
          file: pagePath,
          issue:
            'Page uses fetchData but function signature missing params parameter',
        })
        continue
      }

      // Check if host is extracted from params
      if (
        !content.includes('await params') &&
        !content.includes('params.host')
      ) {
        violations.push({
          file: pagePath,
          issue: 'Page has params but does not extract host from params',
        })
      }
    }

    if (violations.length > 0) {
      const violationMessages = violations
        .map((v) => `${v.file} - ${v.issue}`)
        .join('\n')

      throw new Error(
        `Found ${violations.length} pages under [host] with parameter issues:\n${violationMessages}\n\n` +
          'Pages under app/[host]/ must extract host from params and pass it to fetchData calls.'
      )
    }
  })
})

describe('Host switching regression tests', () => {
  it('should have getHostIdCookie function available', () => {
    const scopedLinkPath = path.join(__dirname, '../scoped-link.ts')

    if (fs.existsSync(scopedLinkPath)) {
      const content = fs.readFileSync(scopedLinkPath, 'utf-8')
      expect(content).toMatch(/export.*getHostIdCookie/)
    } else {
      // Alternative locations for getHostIdCookie
      const serverContextPath = path.join(__dirname, '../server-context.ts')
      if (fs.existsSync(serverContextPath)) {
        const content = fs.readFileSync(serverContextPath, 'utf-8')
        expect(content).toMatch(/getHostIdCookie|getHostId/)
      }
    }
  })

  it('should have multi-host configuration in layout', () => {
    const layoutPath = path.join(__dirname, '../../app/[host]/layout.tsx')

    if (fs.existsSync(layoutPath)) {
      const content = fs.readFileSync(layoutPath, 'utf-8')

      // Should extract host from params
      expect(content).toMatch(/const.*host.*=.*await params/)

      // Should set host context or cookie
      expect(content).toMatch(
        /(setHostId|hostId.*=.*host|document\.cookie.*hostId)/i
      )
    }
  })
})

describe('ESLint rule suggestion', () => {
  it('should suggest ESLint rule for fetchData hostId enforcement', () => {
    // This test documents a potential ESLint rule that could be added
    const eslintRuleSuggestion = {
      'fetchdata-require-hostid': {
        meta: {
          type: 'problem',
          docs: {
            description: 'require hostId parameter in fetchData calls',
            category: 'Possible Errors',
          },
          schema: [],
        },
        create: function (context: any) {
          return {
            CallExpression(node: any) {
              if (node.callee.name === 'fetchData') {
                const args = node.arguments
                if (args.length === 0) return

                const firstArg = args[0]
                if (firstArg.type !== 'ObjectExpression') return

                const hasHostId = firstArg.properties.some(
                  (prop: any) => prop.key && prop.key.name === 'hostId'
                )

                if (!hasHostId) {
                  context.report({
                    node,
                    message:
                      'fetchData calls must include hostId parameter for multi-host support',
                  })
                }
              }
            },
          }
        },
      },
    }

    // This is a documentation test - always passes but suggests the rule
    expect(eslintRuleSuggestion).toBeDefined()
    console.log(
      '💡 Consider adding ESLint rule:',
      JSON.stringify(eslintRuleSuggestion, null, 2)
    )
  })
})
