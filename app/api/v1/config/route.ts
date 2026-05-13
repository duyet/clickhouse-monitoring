import { NextResponse } from 'next/server'
import {
  AppFeaturePermissionConfigError,
  getPublicFeaturePermissionConfig,
} from '@/lib/feature-permissions/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await getPublicFeaturePermissionConfig()
    return NextResponse.json(config)
  } catch (error) {
    if (error instanceof AppFeaturePermissionConfigError) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FEATURE_PERMISSION_CONFIG',
            message: error.message,
          },
        },
        { status: 500 }
      )
    }

    throw error
  }
}
