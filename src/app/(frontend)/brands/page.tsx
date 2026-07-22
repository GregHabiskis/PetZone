import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Shop by Brands', description: 'Browse trusted pet food and care brands available at Pet Zone Bangladesh.' }
const brands = ['Royal Canin','SmartHeart','Reflex Plus','Wanpy','Nekko','Whiskas','Jungle','Himalaya','Bioline','Bellotta','Drools','Pedigree','Purina','Kaniva','Felicia','Prama']
export default function BrandsPage(){return <><section className="page-hero"><div className="shell"><p className="eyebrow">SHOP BY BRANDS</p><h1>Trusted names, one calm shelf.</h1><p>Browse authentic pet food and care brands available through Pet Zone.</p></div></section><section className="section shell"><div className="brand-grid">{brands.map((brand)=><Link className="brand-card" key={brand} href={`/shop?brand=${encodeURIComponent(brand)}`}>{brand}</Link>)}</div></section></>}
