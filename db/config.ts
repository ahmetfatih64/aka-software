import { defineDb, defineTable, column, NOW } from 'astro:db';

const Leads = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        serviceRequestId: column.number({ optional: true }),   // FK ServiceRequests.id
        companyName: column.text({ optional: true }),
        contactName: column.text(),
        contactEmail: column.text(),
        contactPhone: column.text({ optional: true }),
        source: column.text({ default: 'web_form' }),          // web_form | referral | outbound | event
        status: column.text({ default: 'new' }),               // new | qualified | proposal_sent | won | lost
        estimatedValue: column.number({ optional: true }),     // TL
        priority: column.text({ default: 'medium' }),          // low | medium | high
        notes: column.text({ optional: true }),
        assignedTo: column.text({ optional: true }),
        nextFollowUp: column.date({ optional: true }),
        createdAt: column.date({ default: NOW }),
        updatedAt: column.date({ default: NOW }),
    }
});

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

const Proposals = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        leadId: column.number(),                                  // FK Leads.id
        proposalNumber: column.text(),                            // TKL-2024-001
        title: column.text(),
        status: column.text({ default: 'draft' }),                // draft | sent | accepted | rejected | expired
        currency: column.text({ default: 'TRY' }),
        subtotal: column.number({ default: 0 }),
        discountRate: column.number({ default: 0 }),
        discountAmount: column.number({ default: 0 }),
        taxRate: column.number({ default: 20 }),
        taxAmount: column.number({ default: 0 }),
        totalAmount: column.number({ default: 0 }),
        validUntil: column.date(),
        sentAt: column.date({ optional: true }),
        acceptedAt: column.date({ optional: true }),
        notes: column.text({ optional: true }),
        terms: column.text({ optional: true }),
        createdAt: column.date({ default: NOW }),
        updatedAt: column.date({ default: NOW }),
    }
});

const ProposalItems = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        proposalId: column.number(),                              // FK Proposals.id
        sortOrder: column.number({ default: 0 }),
        description: column.text(),
        unit: column.text({ default: 'adet' }),                   // saat | gün | adet | aylık
        quantity: column.number({ default: 1 }),
        unitPrice: column.number({ default: 0 }),
        totalPrice: column.number({ default: 0 }),                // quantity × unitPrice
        isOptional: column.number({ default: 0 }),                // 0|1
    }
});

const Contracts = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        proposalId: column.number({ optional: true }),            // FK Proposals.id
        leadId: column.number(),                                   // FK Leads.id
        contractNumber: column.text(),                            // SZL-2024-001
        title: column.text(),
        status: column.text({ default: 'draft' }),                // draft | sent | signed | active | completed | cancelled
        contractType: column.text({ default: 'fixed_price' }),    // fixed_price | time_material | retainer
        totalValue: column.number({ default: 0 }),
        startDate: column.date({ optional: true }),
        endDate: column.date({ optional: true }),
        billingCycle: column.text({ default: 'milestone' }),      // milestone | monthly | completion
        paymentTerms: column.number({ default: 30 }),             // gün (NET30)
        hourlyRate: column.number({ optional: true }),
        signedAt: column.date({ optional: true }),
        signedBy: column.text({ optional: true }),
        documentPath: column.text({ optional: true }),
        notes: column.text({ optional: true }),
        createdAt: column.date({ default: NOW }),
        updatedAt: column.date({ default: NOW }),
    }
});

const Projects = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        contractId: column.number({ optional: true }),            // FK Contracts.id (opsiyonel)
        leadId: column.number({ optional: true }),                // FK Leads.id
        projectCode: column.text(),                               // PRJ-2024-001
        name: column.text(),
        status: column.text({ default: 'planning' }),             // planning | active | on_hold | completed | cancelled
        projectType: column.text({ default: 'fixed_price' }),     // fixed_price | time_material | retainer
        budgetHours: column.number({ optional: true }),
        budgetAmount: column.number({ optional: true }),
        hourlyRate: column.number({ optional: true }),
        startDate: column.date({ optional: true }),
        endDate: column.date({ optional: true }),
        actualEndDate: column.date({ optional: true }),
        description: column.text({ optional: true }),
        noContractReason: column.text({ optional: true }),        // sözleşmesiz ise gerekçe
        createdAt: column.date({ default: NOW }),
        updatedAt: column.date({ default: NOW }),
    }
});

const TimeEntries = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        projectId: column.number(),                               // FK Projects.id
        userName: column.text(),
        entryDate: column.date(),
        hours: column.number(),                                   // ondalık (1.5 = 90dk)
        description: column.text(),
        isBillable: column.number({ default: 1 }),                // 0|1
        status: column.text({ default: 'draft' }),                // draft | submitted | approved | rejected | invoiced
        invoiceId: column.number({ optional: true }),             // FK Invoices.id
        hourlyRate: column.number({ optional: true }),            // girişte kopyalanır
        billableAmount: column.number({ optional: true }),        // hours × hourlyRate
        approvedBy: column.text({ optional: true }),
        approvedAt: column.date({ optional: true }),
        createdAt: column.date({ default: NOW }),
    }
});

const Invoices = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        projectId: column.number(),                               // FK Projects.id
        leadId: column.number(),                                   // FK Leads.id
        invoiceNumber: column.text(),                             // FTR-2024-001
        status: column.text({ default: 'draft' }),                // draft | sent | partial | paid | overdue | cancelled
        invoiceType: column.text({ default: 'time_material' }),   // time_material | milestone | advance | final
        issueDate: column.date(),
        dueDate: column.date(),
        subtotal: column.number({ default: 0 }),
        taxRate: column.number({ default: 20 }),
        taxAmount: column.number({ default: 0 }),
        totalAmount: column.number({ default: 0 }),
        paidAmount: column.number({ default: 0 }),
        remaining: column.number({ default: 0 }),
        notes: column.text({ optional: true }),
        createdAt: column.date({ default: NOW }),
        updatedAt: column.date({ default: NOW }),
    }
});

const Payments = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        invoiceId: column.number(),                               // FK Invoices.id
        amount: column.number(),
        paymentDate: column.date(),
        paymentMethod: column.text({ default: 'bank_transfer' }), // bank_transfer | credit_card | check | cash
        reference: column.text({ optional: true }),
        notes: column.text({ optional: true }),
        createdAt: column.date({ default: NOW }),
    }
});

const Expenses = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        projectId: column.number(),                               // FK Projects.id
        category: column.text({ default: 'other' }),              // personnel | software | hardware | travel | subcontractor | other
        description: column.text(),
        amount: column.number(),
        expenseDate: column.date(),
        isBillable: column.number({ default: 0 }),                // 0|1
        invoiceId: column.number({ optional: true }),
        receiptPath: column.text({ optional: true }),
        createdAt: column.date({ default: NOW }),
    }
});

const ChatSessions = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        sessionId: column.text(),
        pageContext: column.text({ default: 'homepage' }),
        mode: column.text({ default: 'website' }),
        createdAt: column.date({ default: NOW }),
    }
});

const ChatMessages = defineTable({
    columns: {
        id: column.number({ primaryKey: true }),
        sessionId: column.text(),
        role: column.text(),             // user | bot
        message: column.text(),
        pageContext: column.text({ optional: true }),
        createdAt: column.date({ default: NOW }),
    }
});

// https://astro.build/db/config
export default defineDb({
    tables: {
        ContactMessages, ServiceRequests, SiteSettings,
        Leads, Proposals, ProposalItems,
        Contracts, Projects, TimeEntries,
        Invoices, Payments, Expenses,
        ChatSessions, ChatMessages,
    },
});
