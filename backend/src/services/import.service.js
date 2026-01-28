const SantanderXLSAdapter = require('./importers/SantanderXLSAdapter');

class ImportService {
    /**
     * 
     * @param {string} adapterType - 'SANTANDER' | 'CSV_GENERIC'
     * @returns {ImportAdapter}
     */
    getAdapter(adapterType) {
        switch (adapterType) {
            case 'SANTANDER':
                return new SantanderXLSAdapter();
            default:
                throw new Error(`Adapter type ${adapterType} not supported`);
        }
    }

    async importFile(fileBuffer, adapterType, _entityId, _accountId) {
        const adapter = this.getAdapter(adapterType);
        const rawTransactions = await adapter.parse(fileBuffer);
        
        // Return raw transactions for preview or save logic controller
        // Ideally, we might want to saving logic here, but keeping it simple:
        // Service parses -> Controller saves.
        return rawTransactions;
    }
}

module.exports = new ImportService();
