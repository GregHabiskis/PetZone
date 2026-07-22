import config from '@payload-config'
import { getPayload } from 'payload'
import {
  buildProductCSVImportPlan,
  commitProductCSVImport,
  isProductCSVStaff,
  isSameOriginAdminRequest,
  productCSVCommitError,
} from '@/lib/admin-product-csv'
import { PRODUCT_CSV_MAX_BYTES, serializeProductCSVErrors } from '@/lib/product-csv'

const CSV_MIME_TYPES = new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel'])

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value !== 'string' && typeof value.name === 'string' && typeof value.arrayBuffer === 'function')
}

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return errorResponse('Authentication required.', 401)
  if (!isProductCSVStaff(user)) return errorResponse('Staff access required.', 403)
  if (!isSameOriginAdminRequest(request)) return errorResponse('Cross-origin import requests are forbidden.', 403)

  const form = await request.formData().catch(() => null)
  if (!form) return errorResponse('Upload a valid multipart form.', 400)
  const file = form.get('file')
  const mode = form.get('mode')
  if (!isUploadedFile(file)) return errorResponse('Select a CSV file.', 400)
  if (!file.name.toLocaleLowerCase().endsWith('.csv')) return errorResponse('Only .csv files are accepted.', 400)
  if (!CSV_MIME_TYPES.has(file.type.toLocaleLowerCase())) return errorResponse('The uploaded file must use a CSV MIME type.', 400)
  if (file.size === 0) return errorResponse('The CSV file is empty.', 400)
  if (file.size > PRODUCT_CSV_MAX_BYTES) return errorResponse(`CSV files cannot exceed ${PRODUCT_CSV_MAX_BYTES} bytes.`, 413)
  if (mode !== 'dry-run' && mode !== 'commit') return errorResponse('Import mode must be dry-run or commit.', 400)

  const source = Buffer.from(await file.arrayBuffer())
  const plan = await buildProductCSVImportPlan(payload, source)
  if (plan.errors.length) {
    return Response.json({
      dryRun: mode === 'dry-run',
      createCount: 0,
      updateCount: 0,
      rejectCount: plan.errors.length,
      errors: plan.errors,
      errorCSV: serializeProductCSVErrors(plan.errors),
    }, { status: 422 })
  }

  if (mode === 'commit') {
    try {
      await commitProductCSVImport(payload, user, plan)
    } catch (error) {
      const failure = productCSVCommitError(error)
      return Response.json({
        dryRun: false,
        createCount: 0,
        updateCount: 0,
        rejectCount: 1,
        errors: [failure],
        errorCSV: serializeProductCSVErrors([failure]),
      }, { status: 422 })
    }
  }

  return Response.json({
    dryRun: mode === 'dry-run',
    createCount: plan.createCount,
    updateCount: plan.updateCount,
    rejectCount: 0,
    errors: [],
  })
}
