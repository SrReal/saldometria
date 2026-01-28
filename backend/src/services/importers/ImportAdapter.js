/**
 * Base Interface for Import Adapters
 * Each adapter must implement a parse method that returns an array of normalized transactions.
 * 
 * Normalized Transaction Object:
 * {
 *   date: Date,
 *   amount: Number (negative for expense, positive for income),
 *   balance: Number (optional, snapshot of account balance),
 *   description: String,
 *   originalData: Object (optional, raw row data)
 * }
 */
class ImportAdapter {
    /**
     * @param {Buffer} fileBuffer 
     * @returns {Promise<Array>} Array of normalized transactions
     */
    async parse(_fileBuffer) {
        throw new Error('Method parse() must be implemented');
    }
}

module.exports = ImportAdapter;
