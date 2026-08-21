const { Transaction, Category, Rule, Sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const PALETTE = [
    '#ff8404', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#84cc16',
    '#06b6d4', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
];

function getRandomColor() {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

/**
 * Categoriza transacciones no clasificadas, genera nuevas reglas automáticas
 * y crea nuevas categorías si las transacciones lo requieren.
 */
exports.categorizeEntityTransactions = async (entityId) => {
    try {
        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_groq_api_key')) {
            logger.warn('GROQ_API_KEY no configurada. Categorización por IA omitida.');
            return { success: false, message: 'API key de Groq no configurada en .env' };
        }

        const Groq = require('groq-sdk');
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        // 1. Obtener categorías existentes
        const existingCategories = await Category.findAll({
            where: { entityId },
            attributes: ['id', 'name', 'type', 'color']
        });

        // 2. Obtener reglas existentes
        const existingRules = await Rule.findAll({
            where: { entityId },
            attributes: ['id', 'pattern', 'categoryId']
        });
        const existingPatterns = new Set(existingRules.map(r => r.pattern.toUpperCase().trim()));

        // Mapa de categorías por nombre en minúsculas y por ID
        const categoryMapByName = new Map();
        const categoryMapById = new Map();
        existingCategories.forEach(c => {
            categoryMapByName.set(c.name.toLowerCase().trim(), c);
            categoryMapById.set(c.id, c);
        });

        // 3. Obtener transacciones no categorizadas (sin límite de fecha de 7 días)
        const transactions = await Transaction.findAll({
            where: {
                entityId,
                categoryId: null
            },
            attributes: ['id', 'description', 'amount', 'type'],
            limit: 40 // Procesar hasta 40 por lote para respetar límites y latencia
        });

        if (transactions.length === 0) {
            return { success: true, count: 0, rulesCount: 0, categoriesCount: 0, message: 'No hay transacciones pendientes de categorizar' };
        }

        logger.info(`AI Categorization: Procesando ${transactions.length} transacciones para la entidad ${entityId}`);

        // 4. Preparar Prompts para el LLM
        const categoriesPrompt = existingCategories.map(c => `[ID:${c.id}] ${c.name} (${c.type})`).join('\n');
        const rulesPrompt = existingRules.length > 0
            ? existingRules.map(r => `Patrón: "${r.pattern}" -> CatID:${r.categoryId}`).join('\n')
            : 'Sin reglas previas';
        const transactionsPrompt = transactions.map(t => `ID:${t.id} | Desc:"${t.description}" | Tipo:${t.type} | Cantidad:${t.amount}`).join('\n');

        const systemMessage = `Eres un asistente financiero experto en España y clasificación contable inteligente.
Tu objetivo es:
1. Asignar la mejor categoría a cada transacción bancaria (usando las existentes o proponiendo nuevas si ninguna encaja).
2. Proponer NUEVAS CATEGORÍAS claras (ej. "Impuestos y Tasas", "Salud y Farmacia", "Suscripciones", "Ocio") si hay transacciones que no encajan en las existentes.
3. Proponer NUEVAS REGLAS reutilizables basadas en palabras clave/comercios claros (ej. "MERCADONA", "ALIEXPRESS", "REPSOL", "AMAZON", "EASYPARK", "PAYPAL", "SPOTIFY") asociadas a su nombre de categoría.

DEBES RESPONDER SIEMPRE EN FORMATO JSON VÁLIDO CON ESTA ESTRUCTURA EXACTA:
{
  "newCategories": [
    { "name": "Nombre de Categoría", "type": "EXPENSE", "color": "#f59e0b" }
  ],
  "newRules": [
    { "pattern": "PALABRA_CLAVE_COMERCIO", "categoryName": "Nombre de Categoría" }
  ],
  "classifications": [
    { "id": 123, "categoryName": "Nombre de Categoría", "reason": "Motivo breve" }
  ]
}`;

        const userPrompt = `CATEGORÍAS ACTUALES:
${categoriesPrompt || 'Ninguna'}

REGLAS ACTUALES YA EXISTENTES:
${rulesPrompt}

TRANSACCIONES PENDIENTES A CLASIFICAR:
${transactionsPrompt}

INSTRUCCIONES:
1. Revisa las transacciones y determina su categoría.
2. Si una transacción no encaja en las categorías actuales, añádela en "newCategories".
3. Si detectas nombres de comercios o patrones reutilizables que no estén en las reglas actuales, crea una regla en "newRules" con el patrón en mayúsculas limpio (ej. "MERCADONA", "ALIEXPRESS", "DECATHLON").
4. Llena "classifications" con el ID de la transacción y el nombre exacto de la categoría asignada.`;

        // 5. Llamada a Groq
        const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
        const isReasoningModel = model.toLowerCase().includes('qwen') || model.toLowerCase().includes('r1') || model.toLowerCase().includes('reason');

        const requestPayload = {
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userPrompt }
            ],
            model,
            temperature: 0.1,
            max_tokens: 4096
        };

        if (!isReasoningModel) {
            requestPayload.response_format = { type: 'json_object' };
        }

        const chatCompletion = await groq.chat.completions.create(requestPayload);

        // 6. Parseo de respuesta
        let responseData = {};
        try {
            let content = chatCompletion.choices[0]?.message?.content || '';
            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (jsonMatch) {
                content = jsonMatch[1].trim();
            } else {
                const firstBrace = content.indexOf('{');
                const lastBrace = content.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    content = content.substring(firstBrace, lastBrace + 1);
                }
            }

            responseData = JSON.parse(content);
        } catch (e) {
            logger.error(`AI Categorization: Fallo al parsear JSON de IA. Contenido: ${chatCompletion.choices[0]?.message?.content}`);
            return { success: false, message: 'Error de parseo de la respuesta de IA' };
        }

        let newCategoriesCount = 0;
        let newRulesCount = 0;
        let updatedTransactionsCount = 0;

        // 7. Crear Nuevas Categorías
        const rawNewCategories = Array.isArray(responseData.newCategories) ? responseData.newCategories : [];
        for (const newCat of rawNewCategories) {
            if (!newCat.name || !newCat.name.trim()) continue;
            const normalizedName = newCat.name.trim().toLowerCase();

            if (!categoryMapByName.has(normalizedName)) {
                try {
                    const createdCat = await Category.create({
                        name: newCat.name.trim(),
                        type: newCat.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                        color: newCat.color || getRandomColor(),
                        entityId
                    });
                    categoryMapByName.set(normalizedName, createdCat);
                    categoryMapById.set(createdCat.id, createdCat);
                    newCategoriesCount++;
                    logger.info(`AI: Creada nueva categoría "${createdCat.name}" (ID: ${createdCat.id})`);
                } catch (err) {
                    logger.warn(`AI: No se pudo crear categoría ${newCat.name}: ${err.message}`);
                }
            }
        }

        // Helper para resolver Category ID por nombre o ID numérico
        const resolveCategoryId = (val) => {
            if (!val) return null;
            if (typeof val === 'number' && categoryMapById.has(val)) return val;
            const strVal = String(val).trim().toLowerCase();
            if (categoryMapByName.has(strVal)) return categoryMapByName.get(strVal).id;
            return null;
        };

        // 8. Crear Nuevas Reglas
        const rawNewRules = Array.isArray(responseData.newRules) ? responseData.newRules : [];
        for (const newRule of rawNewRules) {
            if (!newRule.pattern || !newRule.pattern.trim()) continue;
            const patternUpper = newRule.pattern.toUpperCase().trim();
            const targetCatId = resolveCategoryId(newRule.categoryName || newRule.categoryId);

            if (targetCatId && !existingPatterns.has(patternUpper)) {
                try {
                    await Rule.create({
                        pattern: patternUpper,
                        categoryId: targetCatId,
                        entityId,
                        isActive: true
                    });
                    existingPatterns.add(patternUpper);
                    newRulesCount++;
                    logger.info(`AI: Creada nueva regla para patrón "${patternUpper}" -> CatID: ${targetCatId}`);
                } catch (err) {
                    logger.warn(`AI: No se pudo crear regla ${patternUpper}: ${err.message}`);
                }
            }
        }

        // 9. Actualizar transacciones clasificadas directamente
        const rawClassifications = Array.isArray(responseData.classifications)
            ? responseData.classifications
            : (Array.isArray(responseData) ? responseData : []);

        for (const item of rawClassifications) {
            const txId = parseInt(item.id);
            const catId = resolveCategoryId(item.categoryName || item.categoryId);

            if (txId && catId) {
                const [affected] = await Transaction.update(
                    { categoryId: catId },
                    { where: { id: txId, entityId } }
                );
                if (affected > 0) updatedTransactionsCount++;
            }
        }

        // 10. Aplicación retroactiva automática de todas las reglas activas a transacciones huérfanas
        const allActiveRules = await Rule.findAll({
            where: { entityId, isActive: true }
        });

        if (allActiveRules.length > 0) {
            const remainingUncategorized = await Transaction.findAll({
                where: { entityId, categoryId: null }
            });

            for (const tx of remainingUncategorized) {
                if (!tx.description) continue;
                const upperDesc = tx.description.toUpperCase();

                for (const r of allActiveRules) {
                    if (upperDesc.includes(r.pattern.toUpperCase())) {
                        tx.categoryId = r.categoryId;
                        await tx.save();
                        updatedTransactionsCount++;
                        break;
                    }
                }
            }
        }

        logger.info(`AI Categorization Completada: ${updatedTransactionsCount} transacciones actualizadas, ${newRulesCount} reglas creadas, ${newCategoriesCount} categorías creadas.`);

        return {
            success: true,
            count: updatedTransactionsCount,
            rulesCount: newRulesCount,
            categoriesCount: newCategoriesCount,
            message: `Categorizadas ${updatedTransactionsCount} transacciones (${newRulesCount} reglas y ${newCategoriesCount} categorías creadas)`
        };

    } catch (error) {
        logger.error(`Error en AI Categorization: ${error.message} ${error.response ? JSON.stringify(error.response.data) : ''}`);
        return { success: false, message: error.message };
    }
};
