import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  return <footer className="footer" data-od-id="site-footer"><div className="shell footer-grid">
    <div><div className="footer-logo" data-od-id="footer-logo"><Image src="/media/petzone-logo.png" alt="Pet Zone" width={180} height={90} /></div><p>Everything your pet needs, with friendly help choosing what is right.</p><p>order@petzone.com.bd<br />+880 1787-101001</p></div>
    <div><h3>Shop</h3><Link href="/shop">All products</Link><Link href="/brands">Shop by brands</Link><Link href="/vet-care">Vet Care Center</Link><Link href="/offer-zone">Offer Zone</Link></div>
    <div><h3>Quick links</h3><Link href="/about">About Us</Link><Link href="/track-order">Track Your Order</Link><Link href="/vet-care">Vet Care Center</Link><Link href="/blog">Blog</Link></div>
    <div><h3>Policies</h3><Link href="/return-and-refund-policy">Return & Refund Policy</Link><Link href="/terms-and-conditions">Terms & Conditions</Link><Link href="/privacy-policy">Privacy Policy</Link></div>
  </div><div className="shell footer-bottom">© 2026 Pet Zone Bangladesh. All rights reserved.</div></footer>
}
