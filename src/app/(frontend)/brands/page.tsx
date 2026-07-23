import type { Metadata } from 'next'
import Link from 'next/link'
import { brands } from '@/lib/brands'

export const metadata: Metadata = { title: 'Shop by Brands', description: 'Browse trusted pet food and care brands available at Pet Zone Bangladesh.' }
export default function BrandsPage(){return <><section className="page-hero"><div className="shell"><p className="eyebrow">SHOP BY BRANDS</p><h1>Trusted names, one calm shelf.</h1><p>Browse authentic pet food and care brands available through Pet Zone.</p></div></section><section className="section shell"><div className="brand-grid">{brands.map((brand)=><Link className="brand-card" key={brand} href={`/shop?brand=${encodeURIComponent(brand)}`}>{brand}</Link>)}</div></section></>}
