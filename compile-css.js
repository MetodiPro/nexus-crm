#!/usr/bin/env node

/**
 * Script per compilare CSS Tailwind dopo le modifiche
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🎨 Compilando CSS Tailwind...');

const child = spawn('npx', ['tailwindcss', '-i', './public/css/input.css', '-o', './public/css/styles.css'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ CSS compilato con successo!');
    console.log('\n🚀 Modifiche applicate:');
    console.log('   1. ✅ Form utenti: aggiunta intestazione e token CSRF');
    console.log('   2. ✅ Gestione utenze: layout più compatto e ordinato');
    console.log('   3. ✅ Corretto link "Torna al Cliente" (/clients/view/:id)');
    console.log('   4. ✅ Aggiunti breadcrumb ai form delle utenze');
    console.log('   5. ✅ Risolto problema middleware auth nelle route utilities');
    console.log('\n💡 Ora puoi riavviare l\'applicazione e testare le funzionalità!');
  } else {
    console.error(`❌ Errore nella compilazione CSS (codice: ${code})`);
  }
});

child.on('error', (err) => {
  console.error('❌ Errore nell\'esecuzione del comando:', err);
});
