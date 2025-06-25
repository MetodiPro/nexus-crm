/**
 * 🧪 Test Parser ENEL - Script di verifica con bolletta reale
 * 
 * Script per testare il funzionamento del parser ENEL
 * con testo reale di bolletta ENEL
 */

const EnelBillParser = require('../services/enelBillParser');
const SimpleBillParser = require('../services/simpleBillParser');

// Testo reale estratto dalla bolletta ENEL
const realEnelText = `
Enel Energia - Mercato libero dell'energia
Da inoltrare al Centro di Verifica di riferimento
Codice Fiscale
NGLDIA74A56I293T
Partita IVA
04494920616
N° Cliente
111206508
Codice POD
IT001E81073372 ENERGIA
ELETTRICA
Gentile IDA ANGELINO,
La fornitura di energia elettrica è in:
Via Duomo 215 80138 Napoli NA 
Tipologia cliente: Altri usi

IDA ANGELINO
VIA DUOMO 215 
80138 NAPOLI NA

Consumo
5.170kWh
consumi rilevati

ENEL ENERGIA SpA
`;

console.log('🧪 Test Parser ENEL con Bolletta Reale');
console.log('=====================================');

// Test 1: Verifica riconoscimento ENEL
console.log('\n1. Test riconoscimento ENEL:');
const isEnel = EnelBillParser.isEnelBill(realEnelText);
console.log(`   Bolletta ENEL rilevata: ${isEnel ? '✅ SI' : '❌ NO'}`);

// Test 2: Estrazione dati con parser principale (che dovrebbe usare ENEL)
console.log('\n2. Test estrazione dati:');
const extractedData = SimpleBillParser.parseFromText(realEnelText);
console.log('   Dati estratti:', JSON.stringify(extractedData, null, 2));

// Test 3: Test diretto parser ENEL
console.log('\n3. Test parser ENEL diretto:');
const enelDirectData = EnelBillParser.parseFromText(realEnelText);
console.log('   Dati parser ENEL:', JSON.stringify(enelDirectData, null, 2));

// Test 4: Calcolo confidenza
console.log('\n4. Test calcolo confidenza:');
const confidence = EnelBillParser.calculateConfidence(enelDirectData);
console.log(`   Punteggio confidenza: ${confidence}%`);

// Test 5: Validazione campi chiave
console.log('\n5. Test validazione campi:');
const expectedFields = ['firstName', 'lastName', 'fiscalCode', 'vatNumber', 'pod', 'customerNumber', 'address', 'city', 'postalCode'];
const foundFields = expectedFields.filter(field => enelDirectData[field]);

console.log(`   📊 Campi trovati: ${foundFields.length}/${expectedFields.length}`);

expectedFields.forEach(field => {
  const found = enelDirectData[field] ? '✅' : '❌';
  const value = enelDirectData[field] || 'Non trovato';
  console.log(`   ${found} ${field}: ${value}`);
});

// Test 6: Confronto con i dati attesi dalla bolletta
console.log('\n6. Verifica dati corretti:');
const expectedData = {
  firstName: 'IDA',
  lastName: 'ANGELINO',
  fiscalCode: 'NGLDIA74A56I293T',
  vatNumber: '04494920616',
  pod: 'IT001E81073372',
  customerNumber: '111206508',
  electricConsumption: 5170,
  city: 'NAPOLI',
  postalCode: '80138'
};

Object.entries(expectedData).forEach(([field, expected]) => {
  const actual = enelDirectData[field];
  const match = actual === expected ? '✅' : '❌';
  console.log(`   ${match} ${field}: atteso="${expected}" trovato="${actual}"`);
});

console.log('\n🎯 Test completato!');
console.log(`\n📈 Risultato finale: Confidenza ${confidence}% - ${confidence > 70 ? 'OTTIMO' : confidence > 50 ? 'BUONO' : 'DA MIGLIORARE'}`);

if (confidence < 70) {
  console.log('\n⚠️ Suggerimenti per migliorare:');
  if (!enelDirectData.fiscalCode) console.log('   - Migliorare pattern Codice Fiscale');
  if (!enelDirectData.pod) console.log('   - Migliorare pattern POD');
  if (!enelDirectData.address) console.log('   - Migliorare pattern Indirizzo');
}

module.exports = {
  runTests: () => {
    console.log('Test eseguiti con successo');
    return {
      isEnel,
      extractedData: enelDirectData,
      confidence
    };
  }
};