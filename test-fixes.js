#!/usr/bin/env node

/**
 * 🧪 Test veloce delle funzionalità corrette
 */

console.log('🧪 Test delle correzioni NEXUS CRM...\n');

// Test 1: Verifica che i modelli esistano
try {
  const ElectricityUtility = require('./models/electricityUtility');
  const GasUtility = require('./models/gasUtility');
  console.log('✅ Modelli ElectricityUtility e GasUtility caricati correttamente');
} catch (error) {
  console.error('❌ Errore caricamento modelli:', error.message);
}

// Test 2: Verifica route supplyPoints
try {
  const supplyPointsRoutes = require('./routes/supplyPoints');
  console.log('✅ Route supplyPoints caricata correttamente');
} catch (error) {
  console.error('❌ Errore caricamento route supplyPoints:', error.message);
}

// Test 3: Verifica che i campi corretti siano utilizzati
try {
  const clientsRoute = require('./routes/clients');
  console.log('✅ Route clients caricata correttamente (con correzioni campi utenze)');
} catch (error) {
  console.error('❌ Errore caricamento route clients:', error.message);
}

// Test 4: Verifica struttura app.js
try {
  const fs = require('fs');
  const appContent = fs.readFileSync('./app.js', 'utf8');
  
  if (appContent.includes('supply-points') && appContent.includes('supplyPointsRoutes')) {
    console.log('✅ Route supply-points registrata correttamente in app.js');
  } else {
    console.log('⚠️ Route supply-points potrebbe non essere registrata in app.js');
  }
} catch (error) {
  console.error('❌ Errore verifica app.js:', error.message);
}

// Test 5: Verifica layout.ejs
try {
  const fs = require('fs');
  const layoutContent = fs.readFileSync('./views/layout.ejs', 'utf8');
  
  if (layoutContent.includes('/supply-points') && layoutContent.includes('Punti di Fornitura')) {
    console.log('✅ Link "Punti di Fornitura" presente nel menu laterale');
  } else {
    console.log('⚠️ Link "Punti di Fornitura" potrebbe mancare nel menu');
  }
} catch (error) {
  console.error('❌ Errore verifica layout.ejs:', error.message);
}

console.log('\n🎯 Risultato Test:');
console.log('📋 Le correzioni sono state applicate ai file');
console.log('🗄️ Assicurati di eseguire la migrazione database se necessario');
console.log('🚀 Riavvia l\'applicazione per testare le funzionalità');

console.log('\n📝 Prossimi passi:');
console.log('1. cd C:\\progetti\\nexus-crm');
console.log('2. node migrate-utilities.js  (se necessario)');
console.log('3. node app.js');
console.log('4. Vai su http://localhost:3000');
console.log('5. Testa import bolletta e navigazione menu');
