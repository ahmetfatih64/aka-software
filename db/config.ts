import { defineDb, defineTable, column, NOW } from 'astro:db';

const ContactMessages = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        name: column.text(),
        email: column.text(),
        message: column.text(),
        createdAt: column.date({ default: NOW }),
    }
});

// https://astro.build/db/config
export default defineDb({
    tables: { ContactMessages },
});
