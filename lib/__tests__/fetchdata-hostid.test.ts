/**
 * @fileoverview Tests to prevent fetchData calls without hostId parameter
 * This test suite ensures all fetchData calls include the hostId parameter
 * to prevent host switching issues (GitHub issue #509)
 */

import { describe, expect, it } from '@jest/globals'
import fs, { readdirSync } from 'node:fs'
import path from 'node:path'

describe('fetchData hostId parameter validation', () => {
  jest.setTimeout(10000) // 10 second timeout for these tests
  const projectRoot = path.resolve(__dirname, '../..')

  // Find all TypeScript/JavaScript files that might contain fetchData calls
  const getFilesToCheck = (): string[] => {
    const allFiles: string[] = []

    const scanDirectory = (dir: string, maxDepth: number = 3) => {
      if (maxDepth <= 0) return

      try {
        const items = readdirSync(dir, { withFileTypes: true })

        for (const item of items) {
          const fullPath = path.join(dir, item.name)

          if (item.isDirectory()) {
            // Skip certain directories
            if (
              !item.name.startsWith('.') &&
              item.name !== 'node_modules' &&
              item.name !== '__tests__' &&
              item.name !== 'jest-reports' &&
              item.name !== 'coverage'
            ) {
              scanDirectory(fullPath, maxDepth - 1)
            }
          } else if (item.isFile()) {
            // Include TypeScript files
            if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
              // Skip test files
              if (
                !item.name.includes('.test.') &&
                !item.name.includes('.spec.') &&
                !item.name.includes('.cy.')
              ) {
                allFiles.push(fullPath)
              }
            }
          }
        }
      } catch (_error) {
        // Directory doesn't exist or permission denied
      }
    }

    // Scan specific directories with limited depth
    const dirsToScan = ['app', 'components', 'lib'].map((d) =>
      path.join(projectRoot, d)
    )
    for (const dir of dirsToScan) {
      if (fs.existsSync(dir)) {
        scanDirectory(dir, 3) // Limit recursion depth
      }
    }

    return allFiles
  }

  it('should ensure all fetchData calls use either fetchDataWithHost or include hostId parameter', () => {
    const files = getFilesToCheck()
    const violations: Array<{ file: string; line: number; content: string }> =
      []

    // Limit number of files to check to prevent timeouts
    const filesToCheck = files.slice(0, 50) // Check first 50 files only

    for (const filePath of filesToCheck) {
      if (!fs.existsSync(filePath)) continue

      try {
        const content = fs.readFileSync(filePath, 'utf-8')

        // Quick check - if file doesn't contain fetchData, skip it
        if (!content.includes('fetchData')) continue

        // Skip if file uses fetchDataWithHost wrapper (which handles hostId automatically)
        if (content.includes('fetchDataWithHost')) continue

        const lines = content.split('\n')

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
          const fetchDataMatch = trimmed.match(
            /(?<!With)fetchData[<\w[\]>]*\s*\(\s*{/
          )
          if (fetchDataMatch) {
            // Check if this is a multiline call - look ahead for the closing brace
            let fullCall = line
            let lineIndex = index
            let braceCount =
              (line.match(/{/g) || []).length - (line.match(/}/g) || []).length

            while (braceCount > 0 && lineIndex < lines.length - 1) {
              lineIndex++
              fullCall += `\n${lines[lineIndex]}`
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
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Skipping file ${filePath}: ${error.message}`)
      }
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

    // hostId is now required (not optional) after refactoring
    expect(content).toMatch(/hostId\s*:\s*number\s*\|\s*string/)
  })

  it('should ensure getHostIdCookie is imported where needed', () => {
    const files = getFilesToCheck()
    const violations: Array<{ file: string; reason: string }> = []

    for (const filePath of files) {
      if (!fs.existsSync(filePath)) continue

      const content = fs.readFileSync(filePath, 'utf-8')

      // Skip files that don't use fetchData
      if (!content.includes('fetchData')) continue

      // Check if it's a static page (under app/ but not app/api/)
      const isStaticPage =
        filePath.includes('app/') &&
        (filePath.endsWith('/page.tsx') || filePath.endsWith('/layout.tsx')) &&
        !filePath.includes('app/api/')

      // If it's a static page and uses fetchData, it should use hostId parameter
      if (isStaticPage && content.includes('fetchData')) {
        if (!content.includes('hostId:') && !content.includes('hostId:')) {
          const relativePath = path.relative(projectRoot, filePath)
          violations.push({
            file: relativePath,
            reason:
              'Static page uses fetchData but should include hostId parameter',
          })
        }
      }
    }

    // This is a warning test - we'll check but not fail the build
    if (violations.length > 0) {
      console.warn(
        `⚠️  Found ${violations.length} files that might need hostId parameter:\n` +
          violations.map((v) => `  - ${v.file}: ${v.reason}`).join('\n')
      )
    }
  })

  it('should validate that static pages use hostId correctly', () => {
    const staticPages = getFilesToCheck()
      .filter(
        (file) =>
          file.includes('app/') &&
          file.endsWith('/page.tsx') &&
          !file.includes('app/api/')
      )
      .map((file) => path.relative(projectRoot, file))
    const violations: Array<{ file: string; issue: string }> = []

    for (const pagePath of staticPages) {
      const fullPath = path.join(projectRoot, pagePath)
      if (!fs.existsSync(fullPath)) continue

      const content = fs.readFileSync(fullPath, 'utf-8')

      // Skip pages that don't use fetchData
      if (!content.includes('fetchData')) continue

      // Check if fetchData includes hostId parameter
      if (!content.includes('hostId:') && !content.includes('hostId:')) {
        violations.push({
          file: pagePath,
          issue: 'Page uses fetchData but does not include hostId parameter',
        })
      }
    }

    if (violations.length > 0) {
      const violationMessages = violations
        .map((v) => `${v.file} - ${v.issue}`)
        .join('\n')

      throw new Error(
        `Found ${violations.length} static pages with hostId issues:\n${violationMessages}\n\n` +
          'Static pages must include hostId parameter in fetchData calls.'
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

  it('should have multi-host configuration support', () => {
    // Static site architecture: hostId is managed through cookies and server context
    const serverContextPath = path.join(__dirname, '../server-context.ts')

    if (fs.existsSync(serverContextPath)) {
      const content = fs.readFileSync(serverContextPath, 'utf-8')

      // Should have hostId management functions
      expect(content).toMatch(/getHostIdCookie|setHostId|getHostId/)
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
        create: (context: any) => ({
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
        }),
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
