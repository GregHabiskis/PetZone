import Link from 'next/link'
import { LoginForm } from '@/components/auth-forms'
import { CheckoutForm } from '@/components/checkout-form'
import { getCurrentUser } from '@/lib/current-user'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const { user } = await getCurrentUser()
  return <><section className="page-hero"><div className="shell"><p className="eyebrow">SECURE CHECKOUT</p><h1>Contact → Delivery → Payment</h1><p>Guest checkout is disabled. Every order belongs to a verified customer account.</p></div></section>{!user ? <section className="section shell auth-grid"><LoginForm redirectTo="/checkout" /><div className="form-card"><p className="eyebrow">ACCOUNT REQUIRED</p><h2>New customer?</h2><p>Create your account with the delivery details required for every Pet Zone order.</p><div className="card-actions"><Link className="primary-button" href="/register">Create customer account</Link></div></div></section> : <CheckoutForm customer={{ firstName: String(user.firstName || ''), lastName: String(user.lastName || ''), phone: String(user.phone || ''), email: user.email ? String(user.email) : null, streetAddress: String(user.streetAddress || ''), city: String(user.city || ''), postalCode: String(user.postalCode || '') }} />}</>
}
