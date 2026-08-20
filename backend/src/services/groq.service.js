const { Transaction, Category, Sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Categorizes uncategorized transactions for an entity using Groq AI.
 */
exports.categorizeEntityTransactions = async (entityId) => {
    try {
        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_groq_api_key')) {
            logger.warn('GROQ_API_KEY not configured. AI categorization skipped.');
            return { success: false, message: 'API key not configured' };
        }

        const Groq = require('groq-sdk');
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        // 1. Fetch available categories for this entity
        const categories = await Category.findAll({
            where: { entityId },
            attributes: ['id', 'name', 'type']
        });

        if (categories.length === 0) return { success: false, message: 'No categories found' };

        // 2. Fetch uncategorized transactions from last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const transactions = await Transaction.findAll({
            where: {
                entityId,
                categoryId: null,
                date: { [Op.gte]: oneWeekAgo.toISOString().split('T')[0] }
            },
            attributes: ['id', 'description', 'amount', 'type'],
            limit: 20 // Process in small batches to stay within token limits and avoid timeouts
        });

        if (transactions.length === 0) return { success: true, count: 0 };

        logger.info(`AI Categorization: Processing ${transactions.length} transactions for entity ${entityId}`);

        // 3. Prepare Prompt
        const categoriesPrompt = categories.map(c => `ID:${c.id}, Nombre:${c.name}, Tipo:${c.type}`).join('\n');
        const transactionsPrompt = transactions.map(t => `ID:${t.id}, Desc:${t.description}, Tipo:${t.type}, Cantidad:${t.amount}`).join('\n');

        const prompt = `
            Eres un asistente financiero experto en España.
            Tu tarea es asignar una categoría a cada una de las transacciones bancarias listadas abajo.
            
            CATEGORÍAS DISPONIBLES (Usa solo estos IDs):
            ${categoriesPrompt}
            
            TRANSACCIONES A CLASIFICAR:
            ${transactionsPrompt}
            
            REGLAS:
            1. Solo usa IDs de la lista de categorías proporcionada.
            2. Si no estás seguro, no asocies ninguna categoría.
            3. Ten en cuenta que el Tipo (INCOME/EXPENSE) de la transacción debe coincidir con el Tipo de la categoría si es posible.
            4. Responde ÚNICAMENTE en formato JSON puro, sin texto adicional, siguiendo esta estructura exacta:
            [
                { "id": "ID_TRANSACCION", "categoryId": "ID_CATEGORIA", "reason": "Breve motivo" }
            ]
        `;

        // 4. Call Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' } // Groq supports JSON mode
        });

        let result;
        try {
             // JSON mode returns an object. If the prompt asks for an array, it might be wrapped in a key or directly as the object.
             // Usually, with json_object mode, we might need a top-level key like {"classifications": [...]} 
             // Let's refine the prompt and parsing.
             const content = chatCompletion.choices[0].message.content;
             result = JSON.parse(content);
             // If result is wrapped, unwrap. 
             if (result.classifications) result = result.classifications;
             else if (!Array.isArray(result) && Object.values(result).length > 0) {
                 // Sometime LLMs return { "1": { categoryId: 5 }, "2": ... }
                 // Or it might be an object with an array under some key.
             }
        } catch (e) {
            logger.error(`AI Categorization: Failed to parse AI response. Content: ${chatCompletion.choices[0].message.content}`);
            return { success: false, message: 'AI Parsing failed' };
        }

        // 5. Apply changes
        if (Array.isArray(result)) {
            let updatedCount = 0;
            for (const item of result) {
                const txId = parseInt(item.id);
                const catId = parseInt(item.categoryId);
                
                if (txId && catId) {
                    await Transaction.update({ categoryId: catId }, { where: { id: txId, entityId } });
                    updatedCount++;
                }
            }
            logger.info(`AI Categorization: Successfully updated ${updatedCount} transactions`);
            return { success: true, count: updatedCount };
        }

        return { success: false, message: 'Invalid AI response format' };

    } catch (error) {
        logger.error(`Error in AI Categorization: ${error.message}`);
        return { success: false, message: error.message };
    }
};
