import config from '@payload-config'
import { getPayload } from 'payload'
import { isProductCSVStaff, loadProductsForCSVExport } from '@/lib/admin-product-csv'
import { serializeProductsToCSV } from '@/lib/product-csv'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 })
  if (!isProductCSVStaff(user)) return Response.json({ error: 'Staff access required.' }, { status: 403 })

  const products = await loadProductsForCSVExport(payload)
  const csv = serializeProductsToCSV(products)
  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      'cache-control': 'private, no-store',
      'content-disposition': 'attachment; filename="petzone-products.csv"',
      'content-type': 'text/csv; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
  })
}
