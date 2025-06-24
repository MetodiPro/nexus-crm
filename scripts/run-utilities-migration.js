#!/usr/bin/env node

/**
 * Script per eseguire la migrazione del database con gestione utenze multiple
 * Esegui con: node run-utilities-migration.js
 */

console.log('🚀 Avvio migrazione database con gestione utenze multiple...\n');

async function runMigration() {
  try {
    // Importa e esegui la migrazione
    const { migrateClientsAndUtilities } = require('./migrate-clients-utilities');
    
    console.log('📋 Esecuzione migrazione completa...');
    const result = await migrateClientsAndUtilities();
    
    console.log(`✅ ${result}`);
    console.log('\n🎉 Migrazione completata con successo!');
    console.log('\n📝 Cosa è stato fatto:');
    console.log('   ✅ RIMOSSO campo fax (deprecato)');
    console.log('   ✅ Aggiornata tabella clients con nuovi campi anagrafici');
    console.log('   ✅ CREATA tabella electricity_utilities per gestire multiple utenze elettriche');
    console.log('   ✅ CREATA tabella gas_utilities per gestire multiple utenze gas');
    console.log('   ✅ Ogni utenza può avere:');
    console.log('       - Nome descrittivo (es: "Sede principale", "Magazzino")');
    console.log('       - Indirizzo specifico (se diverso dalla sede cliente)');
    console.log('       - Consumi annuali (kWh per elettrico, Smc per gas)');
    console.log('       - Anno di riferimento del consumo');
    console.log('       - Dati tecnici completi');
    console.log('       - Note specifiche per utenza');
    console.log('\n🔧 Nuove funzionalità disponibili:');
    console.log('   - Un cliente può avere MULTIPLE utenze elettriche e gas');
    console.log('   - Ogni utenza può essere in un indirizzo diverso');
    console.log('   - Tracciamento consumi annuali per utenza');
    console.log('   - Gestione separata stato attivo/disattivo per utenza');
    console.log('   - Ricerca avanzata per POD/PDR');
    console.log('\n🔄 Prossimi passi:');
    console.log('   1. Riavvia l\'applicazione per utilizzare le nuove funzionalità');
    console.log('   2. Crea le route per la gestione utenze (/clients/:id/utilities)');
    console.log('   3. Testa l\'inserimento di multiple utenze per cliente');
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error.message);
    console.error('\n🔧 Possibili soluzioni:');
    console.error('   1. Verifica che il database nexus.db esista');
    console.error('   2. Controlla i permessi di scrittura sulla cartella data/');
    console.error('   3. Assicurati che l\'applicazione non sia in esecuzione');
    console.error('   4. Verifica che non ci siano processi che utilizzano il database');
    process.exit(1);
  }
}

runMigration();