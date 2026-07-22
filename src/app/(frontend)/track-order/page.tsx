import Link from 'next/link'
import { LoginForm } from '@/components/auth-forms'
import { getCurrentUser } from '@/lib/current-user'

export const dynamic = 'force-dynamic'

const statuses = ['received', 'confirmed', 'processing', 'shipped', 'delivered'] as const

export default async function TrackOrderPage() {
  const { payload, user } = await getCurrentUser()
  if (!user) return <><section className="page-hero"><div className="shell"><p className="eyebrow">TRACK YOUR ORDER</p><h1>Private by design.</h1><p>Guest tracking is disabled. Sign in to see orders belonging only to your account.</p></div></section><section className="section shell narrow-form"><LoginForm redirectTo="/track-order" /></section></>
  const orders = await payload.find({ collection: 'orders', where: { customer: { equals: user.id } }, sort: '-createdAt', limit: 20, overrideAccess: true })
  return <><section className="page-hero"><div className="shell"><p className="eyebrow">TRACK YOUR ORDER</p><h1>One clear status, no guessing.</h1><p>Live order status for your signed-in customer account.</p></div></section><section className="section shell">{orders.docs.length ? <div className="order-list">{orders.docs.map((order) => { const active = statuses.indexOf(order.status as typeof statuses[number]); return <article className="form-card tracking-card" key={order.id}><div className="tracking-heading"><div><p className="eyebrow">{order.orderNumber}</p><h2>{String(order.status).replaceAll('_', ' ')}</h2></div><span>Payment: {String(order.paymentStatus)}</span></div><ol className="status-track">{statuses.map((status, index) => <li className={index <= active ? 'complete' : ''} key={status}><span aria-hidden="true" /><b>{status}</b></li>)}</ol></article>})}</div> : <div className="empty-state"><h2>No order to track.</h2><p>Place an order from your account first.</p><Link className="primary-button" href="/shop">Shop products</Link></div>}</section></>
}
