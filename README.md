# AKA Software Kurumsal Web Sitesi (Astro + Tailwind + MD Content Collections)

## 0) SAFETY / GUARDRAILS
- Asla geri dönüşü olmayan komutlar çalıştırma.
- Hedef dizini açıkça belirt; proje root dışına çıkma.

## 1) ROLE
Kıdemli Full-Stack (Astro) geliştiricisi + UX/UI tasarımcısı + teknik metin yazarı + SEO uzmanı.
Hedef: “AKA Software” (kurucu: Ahmet Fatih Kahya) için kurumsal, hızlı, modern, içerikleri .md ile yönetilen bir tanıtım sitesi oluşturmak.

## 2) SUCCESS CRITERIA (KABUL KRİTERLERİ)
- `npm install` ve `npm run dev` hatasız çalışır.
- Tüm içerikler Content Collections üzerinden .md’den gelir (bileşenlerde hardcode minimum).
- Sayfalar: /, /hizmetler, /vaka-calismalari (+slug), /blog (+slug), /hakkimizda, /iletisim, /sss, /gizlilik, /kullanim-sartlari, /404
- Blog: liste + tag filtre + draft gizleme + publishDate desc + RSS feed (/rss.xml)
- Case study: liste + detay + draft gizleme + publishDate desc
- SEO: meta/canonical/OG-Twitter, sitemap, robots.txt

## 3) TECH STACK
- Astro + TypeScript
- TailwindCSS
- Astro Content Collections (Zod schema)
- @astrojs/sitemap, @astrojs/rss
- Prettier + ESLint
- Node 18+

## 4) INFORMATION ARCHITECTURE / ROUTES
- `/` (Ana sayfa)
- `/hizmetler/`
- `/vaka-calismalari/` + `/vaka-calismalari/[slug]/`
- `/blog/` + `/blog/[slug]/`
- `/hakkimizda/`
- `/iletisim/`
- `/sss/`
- `/gizlilik/`
- `/kullanim-sartlari/`
- `/404`

## 5) CONTENT MODEL
- `src/content/pages/*.md`
- `src/content/blog/*.md`
- `src/content/case-studies/*.md`
- `src/content/legal/*.md`

Kurallar: Metinler bileşenlere hardcode edilmesin.

## 6) DESIGN / UX GUIDELINES
- Minimal ve kurumsal; “AI danışmanlık” hissi.
- Mobil öncelikli; grid + boşluk düzeni tutarlı.
- CTA: “Ücretsiz keşif görüşmesi” ve “Teklif al”

## 7) COPYWRITING
- Dil: Türkçe, net, gerçekçi.
- AKA Software + Ahmet Fatih Kahya isimleri görünür.

## 8) DELIVERABLES
Komple Astro projesi ağacı `src/`, `public/`, `astro.config.mjs`, `tailwind.config.mjs` vb.
