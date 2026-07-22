import { RegistrationForm } from '@/components/registration-form'

export default function RegisterPage() {
  return <><section className="page-hero"><div className="shell"><p className="eyebrow">CUSTOMER REGISTRATION</p><h1>Create your Pet Zone account.</h1><p>One secure account for checkout, order tracking, order history and veterinary appointments.</p></div></section><section className="section shell narrow-form"><RegistrationForm /></section></>
}
