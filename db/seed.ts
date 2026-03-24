import { db, ContactMessages } from 'astro:db';

// https://astro.build/db/seed
// Production seed — no demo data inserted.
export default async function seed() {
  // Intentionally empty: contact messages are created by real users via /iletisim.
  void db; void ContactMessages;
}
