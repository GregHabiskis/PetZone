import Link from 'next/link'
import { LoginForm, LogoutButton } from '@/components/auth-forms'
import { getCurrentUser } from '@/lib/current-user'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const { user } = await getCurrentUser()
  if (!user) return <><section className="page-hero"><div className="shell"><p className="eyebrow">MY ACCOUNT</p><h1>Welcome back.</h1><p>Sign in to view your protected order history and appointments.</p></div></section><section className="section shell auth-grid"><LoginForm /><div className="form-card"><p className="eyebrow">NEW TO PET ZONE?</p><h2>Create an account first.</h2><p>Checkout and order tracking are available only to registered customers. Guest checkout and guest tracking are disabled.</p><Link className="primary-button" href="/register">Create customer account</Link></div></section></>

  return <><section className="page-hero"><div className="shell"><p className="eyebrow">MY ACCOUNT</p><h1>Hello, {String(user.firstName || 'customer')}.</h1><p>Your profile, orders and appointments are private to this account.</p></div></section><section className="section shell"><div className="form-card account-card"><dl><div><dt>Name</dt><dd>{String(user.firstName)} {String(user.lastName)}</dd></div><div><dt>Phone</dt><dd>{String(user.phone)}</dd></div><div><dt>Email</dt><dd>{user.email ? String(user.email) : 'Not provided'}</dd></div><div><dt>Delivery address</dt><dd>{String(user.streetAddress)}, {String(user.city)} {String(user.postalCode)}</dd></div></dl><div className="hero-actions"><Link className="primary-button" href="/orders">View orders</Link><Link className="secondary-button" href="/vet-care">Book vet care</Link><LogoutButton /></div></div></section></>
}
