const { Account } = require('../src/models');

async function updateCurrency() {
  try {
    const [updatedCount] = await Account.update(
      { currency: 'EUR' },
      { where: { currency: 'USD' } }
    );

    console.log(`Updated ${updatedCount} accounts to currency 'EUR'.`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating currency:', error);
    process.exit(1);
  }
}

updateCurrency();
