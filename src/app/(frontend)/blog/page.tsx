import type { Metadata } from 'next'
import Link from 'next/link'
import { blogPosts } from '@/lib/blog-data'
export const metadata: Metadata = { title: 'Pet Care Blog', description: 'Pet health, nutrition and safety guides in Bangla and English from Pet Zone Bangladesh.' }
export default function BlogPage(){return <><section className="page-hero"><div className="shell"><p className="eyebrow">CARE GUIDES</p><h1>Answers for healthier, happier pets.</h1><p>Practical English and Bangla guidance. Health articles do not replace veterinary advice.</p></div></section><section className="section shell"><div className="blog-grid">{blogPosts.map((post)=><article className="blog-card" key={post.slug}><p className="eyebrow">{post.category}</p><h2>{post.title}</h2><Link href={`/blog/${post.slug}`}>বিস্তারিত পড়ুন →</Link></article>)}</div></section></>}
