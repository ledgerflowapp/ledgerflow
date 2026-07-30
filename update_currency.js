const fs = require('fs');
const files = [
    'src/app/dashboard/friends/[contactId]/page.tsx',
    'src/app/dashboard/ledger/[contactId]/page.tsx',
    'src/components/groups/GroupTransactionList.tsx',
    'src/components/personal/PeopleList.tsx',
    'src/components/ledger/BusinessSummary.tsx',
    'src/components/finance/AccountsList.tsx',
    'src/components/finance/BudgetCard.tsx',
    'src/components/finance/GoalCard.tsx',
    'src/components/finance/PersonalTransactionList.tsx',
    'src/components/finance/EditBudgetsDrawer.tsx',
    'src/components/finance/SharedBalancesCard.tsx',
    'src/components/finance/RecurringTransactionsList.tsx',
    'src/components/finance/TransactionDetailsDrawer.tsx',
    'src/components/finance/AnalyticsDashboard.tsx',
    'src/components/business/BusinessContactList.tsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Add import if not exists
    if (!content.includes('paiseToRupees') && content.includes('toLocaleString')) {
        // Find last import
        const imports = content.match(/^import.*$/gm);
        if (imports) {
            const lastImport = imports[imports.length - 1];
            content = content.replace(lastImport, lastImport + '\nimport { paiseToRupees } from "@/lib/currency";');
        } else {
            content = 'import { paiseToRupees } from "@/lib/currency";\n' + content;
        }
    }

    // specific replacements
    content = content.replace(/₹\{Math\.abs\(([^)]+)\)\.toLocaleString\(([^)]*)\)\}/g, "₹{paiseToRupees(Math.abs($1)).toNumber().toLocaleString($2)}");
    content = content.replace(/₹\$\{Math\.abs\(([^)]+)\)\.toLocaleString\(([^)]*)\)\}/g, "₹${paiseToRupees(Math.abs($1)).toNumber().toLocaleString($2)}");
    content = content.replace(/₹\{([^}]+)\.toLocaleString\(([^)]*)\)\}/g, (match, p1, p2) => {
        if (p1.includes('paiseToRupees') || p1 === 'current' || p1 === 'target' || p1 === 'spent' || p1.includes('youWillGet') || p1.includes('youWillGive') || p1.includes('totalOwe')) {
            // These might be raw values or not. Wait, the prompt says:
            // "Ensure balance in AccountsList, spent and budget_limit in BudgetCard/EditBudgetsDrawer, and target_amount/current_amount in GoalCard are also wrapped."
            // "₹{youWillGet.toLocaleString()}"
        }
        return `₹{paiseToRupees(${p1}).toNumber().toLocaleString(${p2})}`;
    });

    content = content.replace(/₹\$\{([^}]+)\.toLocaleString\(([^)]*)\)\}/g, (match, p1, p2) => {
        if (p1.includes('paiseToRupees')) return match;
        return `₹\${paiseToRupees(${p1}).toNumber().toLocaleString(${p2})}`;
    });

    // Special cases for AnalyticsDashboard (Number(value))
    content = content.replace(/`₹\$\{Number\(([^)]+)\)\.toLocaleString\(\)\}`/g, "`₹${paiseToRupees(Number($1)).toNumber().toLocaleString()}`");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
}
