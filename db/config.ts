import { defineDb, defineTable, column, NOW } from 'astro:db';

const ContactMessages = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        name: column.text(),
        email: column.text(),
        message: column.text(),
        createdAt: column.date({ default: NOW }),
        isRead: column.boolean({ default: false }),
    }
});

const ServiceRequests = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        name: column.text(),
        email: column.text(),
        company: column.text({ optional: true }),
        phone: column.text({ optional: true }),
        service: column.text(),
        message: column.text(),
        status: column.text({ default: 'beklemede' }),
        createdAt: column.date({ default: NOW }),
    }
});

const SiteSettings = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        key: column.text(),
        value: column.text(),
        label: column.text(),
        group: column.text(),
    }
});

// https://astro.build/db/config
export default defineDb({
    tables: { ContactMessages, ServiceRequests, SiteSettings },
});
