export async function GET() {
  return Response.json({ status: 'ok', service: 'petzone' }, { headers: { 'cache-control': 'no-store' } })
}
