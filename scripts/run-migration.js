#!/usr/bin/env node

/**
 * Script per eseguire la migrazione del database clienti
 * Esegui con: node run-migration.js
 */

console.log('🚀 Avvio migrazione database clienti...\n');

async function runMigration() {
  try {
    // Importa e esegui la migrazione
    const { migrateClientsTable } = require('./migrate-clients-extended');
    
    console.log('📋 Esecuzione migrazione tabella clients...');
    const result = await migrateClientsTable();
    
    console.log(`✅ ${result}`);
    console.log('\n🎉 Migrazione completata con successo!');
    console.log('\n📝 Cosa è stato fatto:');
    console.log('   - Aggiunta colonna fiscal_code per codice fiscale');
    console.log('   - Aggiunta colonna company_fiscal_code per CF azienda');
    console.log('   - Aggiunta colonna company_legal_form per forma giuridica');
    console.log('   - Aggiunte colonne per sede legale (legal_*)');
    console.log('   - Aggiunte colonne per indirizzo fatturazione (billing_*)');
    console.log('   - Aggiunta colonna pec_email per email PEC');
    console.log('   - Aggiunte colonne per dati nascita (birth_date, birth_place)');
    console.log('   - Aggiunta colonna gender per genere');
    console.log('   - Aggiunte colonne contatore elettrico (electricity_*)');
    console.log('   - Aggiunte colonne contatore gas (gas_*)');
    console.log('   - Aggiunte colonne gestione cliente (client_status, acquisition_date, etc.)');
    console.log('   - Aggiunte colonne per note specifiche (notes_electricity, notes_gas)');
    console.log('\n🔄 Ora riavvia l\'applicazione per utilizzare le nuove funzionalità');
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error.message);
    console.error('\n🔧 Possibili soluzioni:');
    console.error('   1. Verifica che il database nexus.db esista');
    console.error('   2. Controlla i permessi di scrittura sulla cartella data/');
    console.error('   3. Assicurati che l\'applicazione non sia in esecuzione');
    process.exit(1);
  }
}

runMigration();