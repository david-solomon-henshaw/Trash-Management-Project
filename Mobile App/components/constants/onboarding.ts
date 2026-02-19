interface footerObject {
    text: string;
    color: string;
    backgroundColor: string;
}

interface Hero {
    icon: string;
    header: string;
    description: string;
    footer: footerObject[];
}

export const HeroSectionDetails: Hero[] = [
    {
        icon: 'truck',
        header: 'Smart Dispatching',
        description: 'Assign hauls to drivers instantly. Track live GPS locations and route completion in real‑time.',
        footer: [
            {
                text: 'Live Tracking',
                color: '#047857', // text-emerald-700
                backgroundColor: '#ecfdf5' // bg-emerald-100
            },
            {
                text: 'Route History',
                color: '#1d4ed8', // text-blue-700
                backgroundColor: '#dbeafe' // bg-blue-100
            }
        ]
    },
    {
        icon: 'file-invoice-dollar',
        header: 'Digital Receipts',
        description: 'Generate professional waste disposal receipts and invoices immediately after every pickup. Send instantly via SMS or email.',
        footer: [
            {
                text: 'PDF Receipts',
                color: '#b45309', // text-amber-700
                backgroundColor: '#fffbeb' // bg-amber-100
            },
            {
                text: 'Auto‑Invoicing',
                color: '#b45309', // text-amber-700
                backgroundColor: '#fffbeb' // bg-amber-100
            }
        ]
    },
    {
        icon: 'clipboard-check',
        header: 'Manifest Management',
        description: 'Automate compliance paperwork. Keep digital logs of all hazardous and bulk hauls – audit‑ready anytime.',
        footer: [
            {
                text: 'Compliance Logs',
                color: '#334155', // text-slate-700
                backgroundColor: '#f1f5f9' // bg-slate-100
            },
            {
                text: 'Audit Ready',
                color: '#334155', // text-slate-700
                backgroundColor: '#f1f5f9' // bg-slate-100
            }
        ]
    }
];