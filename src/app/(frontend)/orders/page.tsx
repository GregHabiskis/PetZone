import Link from 'next/link'
import { LoginForm } from '@/components/auth-forms'
import { formatBDT } from '@/lib/commerce'
import { getCurrentUser } from '@/lib/current-user'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const { payload, user } = await getCurrentUser()
  if (!user) return <><section className="page-hero"><div className="shell"><p className="eyebrow">YOUR ORDERS</p><h1>Protected order history.</h1><p>Guest order access is disabled. Sign in to the customer account that placed the order.</p></div></section><section className="section shell narrow-form"><LoginForm redirectTo="/orders" /></section></>
  const orders = await payload.find({ collection: 'orders', where: { customer: { equals: user.id } }, sort: '-createdAt', limit: 50, overrideAccess: true })
  return <><section className="page-hero"><div className="shell"><p className="eyebrow">YOUR ORDERS</p><h1>Order history.</h1><p>Every order shown here is linked to your authenticated account.</p></div></section><section className="section shell">{orders.docs.length ? <div className="order-list">{orders.docs.map((order) => <article className="form-card order-card" key={order.id}><div><p className="eyebrow">{order.orderNumber}</p><h2>{String(order.status).replaceAll('_', ' ')}</h2><p>Payment: {String(order.paymentStatus)} · {String(order.shippingClass)}</p></div><div className="order-total"><strong>{formatBDT(Number(order.total))}</strong><Link className="secondary-button" href="/track-order">Track status</Link></div></article>)}</div> : <div className="empty-state"><h2>No orders yet.</h2><p>Your first authenticated order will appear here.</p><Link className="primary-button" href="/shop">Start shopping</Link></div>}</section></>
}
