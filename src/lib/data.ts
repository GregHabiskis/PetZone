import type { Product } from './commerce'

export const products: Product[] = [
  { id: 'royal-canin-fit', slug: 'royal-canin-regular-fit-32-cat-food', name: { en: 'Royal Canin Regular Fit 32 Adult Cat Food', bn: 'রয়্যাল ক্যানিন রেগুলার ফিট ৩২ অ্যাডাল্ট ক্যাট ফুড' }, brand: 'Royal Canin', category: 'Cat', price: 2850, weightGrams: 2000, image: '/media/royal-canin-cat-food.jpg', inStock: true, badge: 'Best seller' },
  { id: 'smartheart-dog', slug: 'smartheart-adult-dog-food-roast-beef', name: { en: 'SmartHeart Adult Dog Food with Roast Beef', bn: 'স্মার্টহার্ট অ্যাডাল্ট ডগ ফুড — রোস্ট বিফ' }, brand: 'SmartHeart', category: 'Dog', price: 1480, weightGrams: 3000, compareAtPrice: 1580, image: '/media/smartheart-dog-food.jpg', inStock: true, badge: 'Sale' },
  { id: 'reflex-salmon', slug: 'reflex-plus-adult-cat-food-salmon', name: { en: 'Reflex Plus Adult Cat Food — Salmon', bn: 'রিফ্লেক্স প্লাস অ্যাডাল্ট ক্যাট ফুড — স্যামন' }, brand: 'Reflex Plus', category: 'Cat', price: 1250, weightGrams: 1500, image: '/media/reflex-salmon.jpg', inStock: true, badge: 'Vet recommended' },
  { id: 'wanpy-kitten', slug: 'wanpy-grain-free-kitten-food', name: { en: 'Wanpy Grain Free Kitten Food — Chicken', bn: 'ওয়ানপি গ্রেইন ফ্রি কিটেন ফুড — চিকেন' }, brand: 'Wanpy', category: 'Cat', price: 1200, weightGrams: 1000, image: '/media/wanpy-kitten.jpg', inStock: false },
  { id: 'jungle-rabbit', slug: 'jungle-premium-rabbit-food', name: { en: 'Jungle Premium Rabbit Food', bn: 'জাঙ্গল প্রিমিয়াম র‍্যাবিট ফুড' }, brand: 'Jungle', category: 'Rabbit', price: 420, weightGrams: 500, image: '/media/jungle-rabbit.jpg', inStock: true },
  { id: 'prama-dog', slug: 'prama-nori-seaweed-dog-treat', name: { en: 'Prama Nori Seaweed Adult Dog Treat', bn: 'প্রামা নরি সিউইড অ্যাডাল্ট ডগ ট্রিট' }, brand: 'Prama', category: 'Dog', price: 280, weightGrams: 100, image: '/media/prama-dog.jpg', inStock: true, badge: 'New' },
]

export const posts = [
  { slug: 'biral-bishakto-kichu-kheye-felle-ki-korbo', title: 'বিড়াল বিষাক্ত কিছু খেয়ে ফেললে কী করবো?', category: 'জরুরি যত্ন' },
  { slug: 'biral-hotat-durbol-hoye-gele-ki-korbo', title: 'বিড়াল হঠাৎ দুর্বল হয়ে গেলে কী করবো?', category: 'স্বাস্থ্য' },
  { slug: 'biraler-kan-theke-moyla-ba-durgondho-ashar-karon', title: 'বিড়ালের কান থেকে ময়লা বা দুর্গন্ধ আসার কারণ', category: 'স্বাস্থ্য' },
  { slug: 'biraler-mukhe-durgondho-keno-hoy', title: 'বিড়ালের মুখে দুর্গন্ধ কেন হয়?', category: 'ডেন্টাল কেয়ার' },
  { slug: 'biraler-shashkoshto-hole-ki-korbo', title: 'বিড়ালের শ্বাসকষ্ট হলে কী করবো?', category: 'জরুরি যত্ন' },
  { slug: 'kakhon-biralke-vet-dakterer-kache-niye-jaben', title: 'কখন বিড়ালকে ভেটেরিনারি ডাক্তারের কাছে নিয়ে যাবেন?', category: 'ভেট কেয়ার' },
]
