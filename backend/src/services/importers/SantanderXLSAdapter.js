const ImportAdapter = require('./ImportAdapter');
const XLSX = require('xlsx');

class SantanderXLSAdapter extends ImportAdapter {
    async parse(fileBuffer) {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON, assuming header is on recent rows
        // Santander exports usually have some metadata rows before the actual table.
        // We will convert to array of arrays to find the header.
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const transactions = [];
        let headerFound = false;
        let colIndex = {
            date: -1,
            description: -1,
            amount: -1,
            balance: -1
        };

        // Santander typical headers (Spanish): 
        // "Fecha operación", "Fecha valor", "Concepto", "Importe", "Saldo"
        // Or sometimes just "FECHA", "CONCEPTO", "IMPORTE", "SALDO"
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!headerFound) {
                // Try to detect header row
                const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
                if (rowStr.includes('fecha') && rowStr.includes('concepto') && rowStr.includes('importe')) {
                    headerFound = true;
                    // Map indices
                    row.forEach((cell, idx) => {
                        const val = String(cell).toLowerCase();
                        if (val.includes('fecha operación') || val === 'fecha') colIndex.date = idx;
                        else if (val.includes('concepto')) colIndex.description = idx;
                        else if (val.includes('importe')) colIndex.amount = idx;
                        else if (val.includes('saldo')) colIndex.balance = idx;
                    });
                    continue;
                }
            } else {
                // Process data row
                if (!row[colIndex.date] || !row[colIndex.amount]) continue;

                // Parse Date (DD/MM/YYYY)
                const dateStr = row[colIndex.date]; 
                let date;
                // Check if Excel serial date or string
                if (typeof dateStr === 'number') {
                    date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
                } else {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    }
                }
                
                // Parse Amount
                // Santander XLS uses formats like "1.200,50" or "-15,00" depending on locale
                // If XLSX reads it as number, great. If string, need clean up.
                let amount = row[colIndex.amount];
                if (typeof amount === 'string') {
                    // Remove thousands separator (.), replace decimal (,) with (.)
                    // BE CAREFUL: Locale dependent. Assuming generic Spanish locale '1.000,00'
                    // Or if it comes from English excel: '1,000.00'
                    // Let's try to detect decimal separator.
                    
                    // Simple heuristic: if contains ',' and '.' -> remove '.' replace ','
                    // if contains only ',' -> replace ','
                    amount = amount.replace(/\./g, '').replace(',', '.');
                    amount = parseFloat(amount);
                }

                // Parse Balance if available
                let balance = null;
                if (colIndex.balance !== -1) {
                     let balanceStr = row[colIndex.balance];
                     if (typeof balanceStr === 'string') {
                        balanceStr = balanceStr.replace(/\./g, '').replace(',', '.');
                        balance = parseFloat(balanceStr);
                     } else if (typeof balanceStr === 'number') {
                         balance = balanceStr;
                     }
                }

                if (date && !isNaN(amount)) {
                    transactions.push({
                        date,
                        amount, // Negative is expense, positive is income already in Santander
                        balance,
                        description: row[colIndex.description] || 'Sin concepto',
                        originalData: row
                    });
                }
            }
        }

        return transactions;
    }
}

module.exports = SantanderXLSAdapter;
