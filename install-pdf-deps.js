#!/usr/bin/env node

/**
 * Script per installare le dipendenze OCR per l'import bollette
 */

console.log('📦 Installazione dipendenze per import bollette PDF...\n');

const { spawn } = require('child_process');

const dependencies = [
  'multer@1.4.5-lts.1',
  'pdf-parse@1.1.1'
];

console.log('Installazione:', dependencies.join(', '));

const install = spawn('npm', ['install', ...dependencies], {
  stdio: 'inherit',
  shell: true
});

install.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Dipendenze installate con successo!');
    console.log('\n🚀 Ora puoi usare l\'import automatico da bollette PDF');
  } else {
    console.error('\n❌ Errore nell\'installazione delle dipendenze');
  }
});
