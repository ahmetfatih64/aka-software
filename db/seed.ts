import { db, ContactMessages } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
    await db.insert(ContactMessages).values([
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Hello, what services do you provide?',
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            message: 'I would like to request an AI consultation.',
        },
    ]);
    console.log('Seed data inserted into ContactMessages table.');
}
