#!/usr/bin/env node

/**
 * 🧪 Test Parser ENEL con bolletta reale
 */

const EnelBillParser = require('../services/enelBillParser');

// Testo estratto dalla bolletta reale caricata
const realBillText = `
Enel Energia - Mercato libero dell'energia
Da inoltrare al Centro di Verifica di riferimento
Codice Fiscale
NGLDIA74A56I293T
N° Cliente
105627590
Codice POD
IT001E83788734 ENERGIA
ELETTRICA
Gentile IDA ANGELINO,
La fornitura di energia elettrica è in:
Via Diaz Armando 100 81031 Aversa CE 
Tipologia cliente: Altri usi

IDA ANGELINO
VIA TORRE PACIFICO SN 
81030 LUSCIANO CE

Consumo
50.729kWh
consumi rilevati

Potenza contrattualmente impegnata: 10,0 kW (kilowatt)
`;

console.log('🧪 Test Parser ENEL con Bolletta Reale');
console.log('=====================================');

// Test parsing
const data = EnelBillParser.parseFromText(realBillText);

console.log('\n📋 Dati estratti:');
console.log('Nome:', data.firstName);
console.log('Cognome:', data.lastName);
console.log('Codice Fiscale:', data.fiscalCode);
console.log('POD:', data.pod);
console.log('Numero Cliente:', data.customerNumber);
console.log('Indirizzo:', data.address);
console.log('CAP:', data.postalCode);
console.log('Città:', data.city);
console.log('Provincia:', data.province);
console.log('Consumo:', data.electricConsumption);
console.log('Potenza:', data.powerCommitted);
console.log('Fornitore:', data.supplier);
console.log('Tipologia:', data.supplyType);

// Verifica correttezza
console.log('\n✅ Verifica dati corretti:');
const expectedData = {
  firstName: 'IDA',
  lastName: 'ANGELINO',
  fiscalCode: 'NGLDIA74A56I293T',
  pod: 'IT001E83788734',
  customerNumber: '105627590',
  address: 'Via Diaz Armando 100',
  postalCode: '81031',
  city: 'Aversa',
  province: 'CE',
  electricConsumption: 50729,
  powerCommitted: 10,
  supplier: 'ENEL ENERGIA',
  supplyType: 'Altri usi'
};

let correctCount = 0;
let totalFields = Object.keys(expectedData).length;

Object.entries(expectedData).forEach(([field, expected]) => {
  const actual = data[field];
  const isCorrect = actual === expected || (typeof expected === 'number' && parseInt(actual) === expected);
  const status = isCorrect ? '✅' : '❌';
  
  if (isCorrect) correctCount++;
  
  console.log(`${status} ${field}: ${actual} ${!isCorrect ? `(atteso: ${expected})` : ''}`);
});

console.log(`\n📊 Risultato: ${correctCount}/${totalFields} campi corretti (${Math.round(correctCount/totalFields*100)}%)`);

const confidence = EnelBillParser.calculateConfidence(data);
console.log(`🎯 Confidenza: ${confidence}%`);

if (correctCount >= totalFields * 0.8) {
  console.log('🎉 Test SUPERATO! Parser funziona correttamente');
} else {
  console.log('❌ Test FALLITO! Parser necessita correzioni');
}
