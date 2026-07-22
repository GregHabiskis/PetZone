import { getPayload } from 'payload'
import config from '../src/payload.config'
import { blogPosts } from '../src/lib/blog-data'

const ADMIN_EMAIL = 'aversion-coke-punk@duck.com'
const ADMIN_PASSWORD = 'bNgr^%xR#Re3S6wUh@Bc1^dux0NWGPsex9^0#k2gj6S5g*eNyUm&ZjhpaWycXffP'

const payload = await getPayload({ config })

// 1. Reset admin password
await payload.update({
  collection: 'users',
  id: 1,
  data: { password: ADMIN_PASSWORD },
  overrideAccess: true,
})
console.log('✓ Admin password reset')

// 2. Seed blog posts from blog-data.ts
let postsCreated = 0
let postsUpdated = 0
for (const post of blogPosts) {
  const existing = await payload.find({
    collection: 'posts',
    where: { slug: { equals: post.slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const data = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    _status: 'published' as const,
  }
  if (existing.docs[0]) {
    await payload.update({ collection: 'posts', id: existing.docs[0].id, data, overrideAccess: true })
    postsUpdated++
  } else {
    await payload.create({ collection: 'posts', data, overrideAccess: true })
    postsCreated++
  }
}
console.log(`✓ Blog posts: ${postsCreated} created, ${postsUpdated} updated`)

function lexicalContent(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [{ type: 'paragraph', format: '', indent: 0, version: 1, textFormat: 0, textStyle: '', children: [{ text }] }],
      direction: 'ltr',
    },
  }
}

// 3. Seed main pages
const pages = [
  {
    title: 'Homepage',
    slug: 'home',
    content: { en: lexicalContent('Welcome to Pet Zone Bangladesh — everything your pet needs, with friendly help choosing what is right.'), bn: lexicalContent('পেট জোন বাংলাদেশে আপনাকে স্বাগতম — আপনার পোষা প্রাণীর জন্য প্রয়োজনীয় সবকিছু, সঠিক পছন্দে বন্ধুত্বপূর্ণ সাহায্য।') },
  },
  {
    title: 'About Us',
    slug: 'about',
    content: { en: lexicalContent('Pet Zone Bangladesh is your trusted partner in pet care. We provide high-quality pet food, medicines, accessories, and veterinary services across Bangladesh. Our mission is to make pet parenting easier and more joyful.'), bn: lexicalContent('পেট জোন বাংলাদেশ পশুপালনে আপনার বিশ্বস্ত অংশীদার। আমরা সারা বাংলাদেশে উচ্চমানের পোষা প্রাণীর খাবার, ওষুধ, আনুষাঙ্গিক এবং ভেটেরিনারি সেবা প্রদান করি। আমাদের লক্ষ্য পোষা প্রাণী পালনকে সহজ এবং আনন্দময় করে তোলা।') },
  },
  {
    title: 'Vet Care Center',
    slug: 'vet-care',
    content: { en: lexicalContent('Our Vet Care Center offers routine checkups, vaccinations, diagnostics, dental care, and grooming services. Request an appointment online and our team will confirm the schedule.'), bn: lexicalContent('আমাদের ভেট কেয়ার সেন্টার রুটিন চেকআপ, টিকা, ডায়াগনস্টিকস, ডেন্টাল কেয়ার এবং গ্রুমিং সেবা প্রদান করে। অনলাইনে অ্যাপয়েন্টমেন্টের জন্য অনুরোধ করুন এবং আমাদের দল সময়সূচী নিশ্চিত করবে।') },
  },
  {
    title: 'Return & Refund Policy',
    slug: 'return-and-refund-policy',
    content: { en: lexicalContent('We want you to be completely satisfied with your purchase. If you are not satisfied, you may return most items within 7 days of delivery for a refund or exchange. Items must be unused and in original packaging. Prescription items and perishable goods are non-returnable.'), bn: lexicalContent('আমরা চাই আপনি আপনার কেনাকাটায় সম্পূর্ণ সন্তুষ্ট হন। আপনি যদি সন্তুষ্ট না হন, তবে ডেলিভারির ৭ দিনের মধ্যে অধিকাংশ পণ্য ফেরত দিতে পারেন রিফান্ড বা এক্সচেঞ্জের জন্য। পণ্যগুলি অবশ্যই অব্যবহৃত এবং আসল প্যাকেজিংয়ে থাকতে হবে। প্রেসক্রিপশন আইটেম এবং পচনশীল পণ্য ফেরতযোগ্য নয়।') },
  },
  {
    title: 'Terms & Conditions',
    slug: 'terms-and-conditions',
    content: { en: lexicalContent('These Terms & Conditions govern your use of the Pet Zone Bangladesh website and services. By using our services, you agree to these terms. We reserve the right to update these terms at any time.'), bn: lexicalContent('এই শর্তাবলী পেট জোন বাংলাদেশ ওয়েবসাইট এবং পরিষেবাগুলির আপনার ব্যবহার নিয়ন্ত্রণ করে। আমাদের পরিষেবাগুলি ব্যবহার করে, আপনি এই শর্তাবলীতে সম্মত হন। আমরা যেকোনো সময় এই শর্তাবলী আপডেট করার অধিকার সংরক্ষণ করি।') },
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: { en: lexicalContent('Pet Zone Bangladesh respects your privacy. This policy explains how we collect, use, and protect your personal information when you use our website and services.'), bn: lexicalContent('পেট জোন বাংলাদেশ আপনার গোপনীয়তাকে সম্মান করে। এই নীতি ব্যাখ্যা করে যে আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষা করি যখন আপনি আমাদের ওয়েবসাইট এবং পরিষেবাগুলি ব্যবহার করেন।') },
  },
  {
    title: 'Offer Zone',
    slug: 'offer-zone',
    content: { en: lexicalContent('Check out our latest offers and promotions on pet food, medicines, accessories, and more. Great savings for your beloved pets!'), bn: lexicalContent('পোষা প্রাণীর খাবার, ওষুধ, আনুষাঙ্গিক এবং আরও অনেক কিছুতে আমাদের সর্বশেষ অফার এবং প্রচারণা দেখুন। আপনার প্রিয় পোষা প্রাণীদের জন্য দুর্দান্ত সঞ্চয়!') },
  },
]

let pagesCreated = 0
let pagesUpdated = 0
for (const page of pages) {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: page.slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const data = {
    title: page.title,
    slug: page.slug,
    content: page.content,
    _status: 'published' as const,
  }
  if (existing.docs[0]) {
    await payload.update({ collection: 'pages', id: existing.docs[0].id, data: data as any, overrideAccess: true })
    pagesUpdated++
  } else {
    await payload.create({ collection: 'pages', data: data as any, overrideAccess: true })
    pagesCreated++
  }
}
console.log(`✓ Pages: ${pagesCreated} created, ${pagesUpdated} updated`)

console.log('All done.')
process.exit(0)
