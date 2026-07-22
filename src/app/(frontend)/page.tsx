import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, HeartPulse, PackageCheck, ShieldCheck, Stethoscope } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { posts, products } from '@/lib/data'

const pets = [
  ['Cat', 'Food, litter & care'], ['Dog', 'Food, treats & walks'], ['Bird', 'Food, cages & health'], ['Fish', 'Food & water care'], ['Rabbit', 'Food, bedding & toys'], ['Small pets', 'Everyday essentials'],
]
const needs = ['Sensitive stomach', 'Skin & coat', 'Dental care', 'Flea & tick', 'Kitten & puppy', 'Weight management', 'Calming', 'Litter & cleanup']

export default function Home() {
  return <>
    <section className="hero" data-od-id="home-hero"><div className="shell hero-grid"><div className="hero-copy"><p className="eyebrow">CARE FOR EVERY KIND OF COMPANION</p><h1 data-od-id="hero-heading">Happy pets start here.</h1><p className="hero-lead">Food, medicine and everyday essentials — with friendly help whenever you need it.</p><div className="hero-actions"><Link href="/shop" className="primary-button" data-od-id="shop-best-sellers">Shop best sellers <ArrowRight /></Link><Link href="#shop-by-pet" className="secondary-button">Shop by pet</Link></div><div className="trust-chips"><span><BadgeCheck /> Authentic products</span><span><PackageCheck /> Easy returns</span><span><HeartPulse /> Helpful support</span></div></div><div className="hero-visual"><Image className="hero-pets" src="/media/hero-image.jpg" alt="Pet Zone — food, medicine and everyday essentials for pets" fill priority sizes="(max-width: 767px) 100vw, 48vw" /></div></div></section>

    <section className="section shell" id="shop-by-pet" data-od-id="shop-by-pet"><div className="section-heading"><div><p className="eyebrow">START WITH YOUR PET</p><h2>Find the right shelf, faster.</h2></div><Link href="/shop">View all products <ArrowRight /></Link></div><div className="pet-grid">{pets.map(([name, detail], index) => <Link href={`/shop?pet=${name}`} className={`pet-tile pet-${index}`} key={name}><span>{name.slice(0, 1)}</span><h3>{name}</h3><p>{detail}</p></Link>)}</div></section>

    <section className="needs" data-od-id="shop-by-need"><div className="shell"><div className="section-heading"><div><p className="eyebrow">SHOP BY NEED</p><h2>A little guidance goes a long way.</h2></div><p>Browse by the thing you are trying to solve — not a maze of categories.</p></div><div className="need-grid">{needs.map((need) => <Link key={need} href={`/shop?q=${encodeURIComponent(need)}`}>{need}<ArrowRight /></Link>)}</div></div></section>

    <section className="section shell" data-od-id="best-sellers"><div className="section-heading"><div><p className="eyebrow">CUSTOMER FAVORITES</p><h2>Best sellers, clearly chosen.</h2></div><Link href="/shop">Shop all <ArrowRight /></Link></div><div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div></section>

    <section className="pharmacy shell" data-od-id="pharmacy-feature"><div><ShieldCheck /><p className="eyebrow">VET CARE CENTER</p><h2>Health essentials, explained clearly.</h2><p>Shop everyday care, understand prescription verification, or ask our clinic team before you choose.</p><div className="hero-actions"><Link href="/vet-care" className="light-button">Visit Vet Care Center</Link><Link href="/vet-care#appointment" className="text-link">Book an appointment <ArrowRight /></Link></div><small>Product information supports shopping and does not replace veterinary advice.</small></div><div className="pharmacy-list"><span><b>1</b> Choose care or medicine</span><span><b>2</b> Upload a prescription if required</span><span><b>3</b> We verify before fulfillment</span></div></section>

    <section className="section shell" data-od-id="vet-care-feature"><div className="vet-feature"><div className="vet-image"><Image src="/media/vet-care-center.jpg" alt="Pet Zone Vet Care Center" fill sizes="(max-width: 767px) 100vw, 50vw" /></div><div className="vet-copy"><Stethoscope /><p className="eyebrow">VET CARE CENTER</p><h2>Care from whiskers to tail.</h2><p>Request routine checkups, vaccinations, diagnostics, dental care and grooming with our modern veterinary team.</p><ul><li>Digital diagnostics and imaging</li><li>Vaccination and preventive care</li><li>Minor surgery and recovery monitoring</li></ul><Link href="/vet-care" className="primary-button">Request an appointment <ArrowRight /></Link></div></div></section>

    <section className="section shell" data-od-id="care-guides"><div className="section-heading"><div><p className="eyebrow">CARE GUIDES · বাংলা</p><h2>Useful answers for better pet care.</h2></div><Link href="/blog">Read the blog <ArrowRight /></Link></div><div className="post-grid">{posts.slice(0, 3).map((post) => <article key={post.slug}><p>{post.category}</p><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><Link href={`/blog/${post.slug}`}>বিস্তারিত পড়ুন <ArrowRight /></Link></article>)}</div></section>
  </>
}
