#!/usr/bin/env node

/**
 * 🔍 Debug Database - Verifica dati e relazioni
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'data/nexus.db');
console.log('🔍 Debug database NEXUS CRM\n');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Verifica struttura tabella clients
  console.log('📋 1. STRUTTURA TABELLA CLIENTS:');
  db.all("PRAGMA table_info(clients)", (err, columns) => {
    if (err) {
      console.error('❌ Errore:', err);
      return;
    }
    
    columns.forEach(col => {
      console.log(`   ${col.name} (${col.type})`);
    });
    
    const hasConsultantId = columns.some(c => c.name === 'consultant_id');
    console.log(`\n🔑 Campo 'consultant_id': ${hasConsultantId ? '✅ PRESENTE' : '❌ MANCANTE'}`);
    
    // 2. Verifica dati clients
    console.log('\n📊 2. DATI CLIENTS:');
    db.all("SELECT id, name, surname, company, consultant_id FROM clients", (err, clients) => {
      if (err) {
        console.error('❌ Errore:', err);
        return;
      }
      
      console.log(`   Totale clienti: ${clients.length}`);
      
      clients.forEach(client => {
        const clientName = client.name || client.company || 'N/A';
        console.log(`   - ID:${client.id} | ${clientName} | Consulente: ${client.consultant_id || 'NON ASSEGNATO'}`);
      });
      
      // 3. Verifica utenti (consulenti)
      console.log('\n👥 3. UTENTI/CONSULENTI:');
      db.all("SELECT id, username, role, name FROM users", (err, users) => {
        if (err) {
          console.error('❌ Errore:', err);
          return;
        }
        
        users.forEach(user => {
          console.log(`   - ID:${user.id} | ${user.username} (${user.role}) | ${user.name}`);
        });
        
        // 4. Verifica electricity_utilities
        console.log('\n⚡ 4. UTENZE ELETTRICHE:');
        db.all("SELECT id, client_id, pod_code, utility_name FROM electricity_utilities WHERE is_active = 1", (err, utilities) => {
          if (err) {
            console.error('❌ Errore:', err);
            return;
          }
          
          console.log(`   Totale utenze elettriche: ${utilities.length}`);
          utilities.forEach(util => {
            console.log(`   - ID:${util.id} | Cliente:${util.client_id} | POD:${util.pod_code} | ${util.utility_name || 'N/A'}`);
          });
          
          // 5. Verifica gas_utilities  
          console.log('\n🔥 5. UTENZE GAS:');
          db.all("SELECT id, client_id, pdr_code, utility_name FROM gas_utilities WHERE is_active = 1", (err, gasUtils) => {
            if (err) {
              console.error('❌ Errore:', err);
              return;
            }
            
            console.log(`   Totale utenze gas: ${gasUtils.length}`);
            gasUtils.forEach(util => {
              console.log(`   - ID:${util.id} | Cliente:${util.client_id} | PDR:${util.pdr_code} | ${util.utility_name || 'N/A'}`);
            });
            
            // 6. JOIN per vedere relazioni complete
            console.log('\n🔗 6. RELAZIONI CLIENTE-UTENZE-CONSULENTE:');
            db.all(`
              SELECT 
                c.id as client_id, 
                c.name, 
                c.surname, 
                c.company,
                c.consultant_id,
                u.username as consulente,
                eu.id as electric_id,
                eu.pod_code,
                gu.id as gas_id,
                gu.pdr_code
              FROM clients c
              LEFT JOIN users u ON c.consultant_id = u.id
              LEFT JOIN electricity_utilities eu ON c.id = eu.client_id AND eu.is_active = 1
              LEFT JOIN gas_utilities gu ON c.id = gu.client_id AND gu.is_active = 1
              ORDER BY c.id
            `, (err, relations) => {
              if (err) {
                console.error('❌ Errore:', err);
                return;
              }
              
              relations.forEach(rel => {
                const clientName = rel.name || rel.company || 'N/A';
                const consultantName = rel.consulente || 'NON ASSEGNATO';
                console.log(`   Cliente: ${clientName} (ID:${rel.client_id}) | Consulente: ${consultantName}`);
                if (rel.electric_id) {
                  console.log(`     ⚡ Elettrica: ${rel.pod_code} (ID:${rel.electric_id})`);
                }
                if (rel.gas_id) {
                  console.log(`     🔥 Gas: ${rel.pdr_code} (ID:${rel.gas_id})`);
                }
              });
              
              // 7. Analisi problema
              console.log('\n🚨 7. ANALISI PROBLEMA:');
              
              const consultants = users.filter(u => u.role === 'consultant');
              const clientsWithoutConsultant = clients.filter(c => !c.consultant_id);
              const utilitiesWithoutConsultant = [];
              
              // Controlla ogni utenza se appartiene a cliente senza consulente
              [...utilities, ...gasUtils].forEach(util => {
                const client = clients.find(c => c.id === util.client_id);
                if (!client || !client.consultant_id) {
                  utilitiesWithoutConsultant.push({
                    type: util.pod_code ? 'elettrica' : 'gas',
                    code: util.pod_code || util.pdr_code,
                    client_id: util.client_id,
                    client_name: client ? (client.name || client.company) : 'CLIENTE NON TROVATO'
                  });
                }
              });
              
              console.log(`   👥 Consulenti totali: ${consultants.length}`);
              console.log(`   📋 Clienti senza consulente: ${clientsWithoutConsultant.length}`);
              console.log(`   ⚡ Utenze senza consulente: ${utilitiesWithoutConsultant.length}`);
              
              if (utilitiesWithoutConsultant.length > 0) {
                console.log('   \n🔴 UTENZE PROBLEMATICHE (visibili a tutti):');
                utilitiesWithoutConsultant.forEach(util => {
                  console.log(`     - ${util.type}: ${util.code} | Cliente: ${util.client_name} (ID:${util.client_id})`);
                });
              }
              
              console.log('\n💡 SOLUZIONE:');
              console.log('   1. Assegnare consulenti ai clienti senza assegnazione');
              console.log('   2. Oppure eliminare le utenze orfane');
              console.log('   3. Verificare che il filtro consulente funzioni correttamente');
              
              db.close();
            });
          });
        });
      });
    });
  });
});
