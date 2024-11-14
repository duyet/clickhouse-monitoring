import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { ClickHouseInfo } from '@/components/overview-charts/clickhouse-info'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import packageInfo from '@/package.json'

export const dynamic = 'force-static'

function getVersion(): { version: string; url: string | null } {
  // Get env variables
  const sha = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA
  const ref = process.env.GITHUB_REF || process.env.VERCEL_GIT_COMMIT_REF

  // Check for tag version (e.g. refs/tags/v0.1.11)
  const tagMatch = ref?.match(/refs\/tags\/(v\d+\.\d+\.\d+)/)
  if (tagMatch) {
    return {
      version: tagMatch[1],
      url: `${packageInfo.repository.url}/releases/tag/${tagMatch[1]}`,
    }
  }

  // Use short commit hash if available
  if (sha) {
    return {
      version: sha.slice(0, 7), // First 7 characters of commit hash
      url: `${packageInfo.repository.url}/commit/${sha}`,
    }
  }

  // Fallback
  return {
    version: 'N/A',
    url: null,
  }
}

export default async function AboutPage() {
  const githubUrl = packageInfo.repository.url
  const { version, url } = getVersion()

  return (
    <div className="container mx-auto flex flex-col gap-8 px-4 py-8 md:flex-row">
      <Card className="min-w-md max-w-md rounded shadow-none">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            ClickHouse Monitoring
          </CardTitle>
          <CardDescription>{packageInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col justify-between sm:flex-row sm:items-center">
            <span className="font-semibold">UI Version:</span>
            {url ? (
              <Link
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-500 hover:underline"
              >
                {version}
                <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <span>{version}</span>
            )}
          </div>

          <div className="flex flex-col justify-between sm:flex-row sm:items-center">
            <span className="truncate font-semibold">GitHub Repository:</span>
            <Link
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-none items-center truncate text-blue-500 hover:underline"
            >
              <GitHubLogoIcon className="mr-1 h-4 w-4" />
              View on GitHub
              <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <Suspense>
        <ClickHouseInfo
          className="min-w-md max-w-md content-normal"
          contentClassName="p-6 pt-0 gap-2"
          title="ClickHouse Cluster Info"
          description="Server Version and Uptime"
          uptime
          version
          hostName
          currentUser
        />
      </Suspense>
    </div>
  )
}
