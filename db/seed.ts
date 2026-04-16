import { db, ContactMessages, SiteSettings } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
  void ContactMessages;

  await db.insert(SiteSettings).values([
    // İletişim
    { id: 1,  key: 'contact.email',   value: 'info@akasoftware.com.tr',    label: 'E-posta',          group: 'iletisim' },
    { id: 2,  key: 'contact.phone',   value: '+90 (555) 000 00 00',     label: 'Telefon',          group: 'iletisim' },
    { id: 3,  key: 'contact.address', value: 'İstanbul, Türkiye',       label: 'Adres',            group: 'iletisim' },
    { id: 4,  key: 'contact.hours',   value: 'Pzt–Cum, 09:00–18:00',    label: 'Çalışma Saatleri', group: 'iletisim' },
    // Sosyal Medya
    { id: 5,  key: 'social.linkedin', value: 'https://linkedin.com/company/akasoftware', label: 'LinkedIn', group: 'sosyal' },
    { id: 6,  key: 'social.twitter',  value: '',                         label: 'Twitter / X',      group: 'sosyal' },
    { id: 7,  key: 'social.github',   value: '',                         label: 'GitHub',           group: 'sosyal' },
    { id: 8,  key: 'social.instagram',value: '',                         label: 'Instagram',        group: 'sosyal' },
    // Site
    { id: 9,  key: 'site.name',       value: 'AKA Software',            label: 'Site Adı',         group: 'site' },
    { id: 10, key: 'site.tagline',    value: 'Teknik Vizyonunuzu Çalışan Sisteme Dönüştürüyoruz', label: 'Slogan', group: 'site' },
    { id: 11, key: 'site.lang',       value: 'tr',                      label: 'Varsayılan Dil',   group: 'site' },
  ]);
}
