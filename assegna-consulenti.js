#!/usr/bin/env node

/**
 * 🔧 Script per assegnare consulenti ai clienti
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/nexus.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Assegnazione Consulenti ai Clienti\n');

// Mostra situazione attuale
db.all(`
  SELECT 
    c.id, 
    c.name, 
    c.surname, 
    c.company,
    c.consultant_id,
    u.username as consulente_username,
    u.name as consulente_nome
  FROM clients c
  LEFT JOIN users u ON c.consultant_id = u.id
  ORDER BY c.id
`, (err, clients) => {
  if (err) {
    console.error('❌ Errore:', err);
    return;
  }
  
  console.log('📋 SITUAZIONE ATTUALE CLIENTI:');
  console.log('');
  
  clients.forEach(client => {
    const clientName = client.name ? `${client.name} ${client.surname || ''}`.trim() : client.company;
    const consultantInfo = client.consulente_username ? 
      `${client.consulente_username} (${client.consulente_nome})` : 
      'NESSUN CONSULENTE';
    
    console.log(`ID ${client.id}: ${clientName} → ${consultantInfo}`);
  });
  
  console.log('');
  
  // Mostra consulenti disponibili
  db.all("SELECT id, username, name, role FROM users WHERE role = 'consultant'", (err, consultants) => {
    if (err) {
      console.error('❌ Errore:', err);
      return;
    }
    
    console.log('👥 CONSULENTI DISPONIBILI:');
    console.log('');
    consultants.forEach(cons => {
      console.log(`ID ${cons.id}: ${cons.username} (${cons.name})`);
    });
    
    console.log('');
    console.log('🔧 PER ASSEGNARE UN CONSULENTE:');
    console.log('');
    console.log('Esempio per assegnare cliente ID 1 al consulente ID 2:');
    console.log('');
    console.log('sqlite3 data/nexus.db');
    console.log('UPDATE clients SET consultant_id = 2 WHERE id = 1;');
    console.log('.quit');
    console.log('');
    
    console.log('🎯 O esegui direttamente:');
    console.log('');
    
    // Esempio di assegnazione automatica se c'è solo un consulente
    if (consultants.length === 1) {
      const consultant = consultants[0];
      const clientsWithoutConsultant = clients.filter(c => !c.consultant_id);
      
      if (clientsWithoutConsultant.length > 0) {
        console.log(`💡 ASSEGNAZIONE AUTOMATICA SUGGERITA:`);
        console.log(`Assegna tutti i clienti senza consulente a "${consultant.username}"`);
        console.log('');
        console.log('Vuoi procedere? Modifica questo script e decomenta:');
        console.log('');
        console.log('// DECOMMENTA QUESTE RIGHE PER ASSEGNAZIONE AUTOMATICA:');
        console.log('/*');
        console.log(`db.run("UPDATE clients SET consultant_id = ${consultant.id} WHERE consultant_id IS NULL", (err) => {`);
        console.log('  if (err) {');
        console.log('    console.error("❌ Errore:", err);');
        console.log('  } else {');
        console.log(`    console.log("✅ Clienti assegnati al consulente ${consultant.username}");`);
        console.log('  }');
        console.log('  db.close();');
        console.log('});');
        console.log('*/');
      }
    }
    
    db.close();
  });
});
