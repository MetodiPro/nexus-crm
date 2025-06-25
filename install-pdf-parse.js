#!/usr/bin/env node

console.log('📦 Installazione pdf-parse per parsing reale PDF...\n');

const { spawn } = require('child_process');

const install = spawn('npm', ['install', 'pdf-parse@1.1.1'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

install.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ pdf-parse installato con successo!');
    console.log('\n🔧 Ora riavvia l\'app con: npm start');
    console.log('\n🎯 Il sistema ora estrarrà dati REALI dai PDF!');
  } else {
    console.error('\n❌ Errore nell\'installazione');
  }
});
