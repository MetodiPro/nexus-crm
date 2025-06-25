/**
 * 🔍 Parser Bollette Semplificato - NEXUS CRM
 * 
 * Estrae i dati base da bollette energetiche italiane
 * Utilizza parser specifici per ogni fornitore quando disponibili
 */

const EnelBillParser = require('./enelBillParser');

class SimpleBillParser {
  
  /**
   * Estrae dati da testo bolletta usando pattern regex
   * Utilizza parser specifici quando il fornitore è riconosciuto
   */
  static parseFromText(text) {
    const normalizedText = text.toLowerCase();
    
    console.log('🔍 Analisi testo bolletta...');
    console.log('📄 Prime 500 caratteri:', text.substring(0, 500));
    
    // Verifica se è una bolletta ENEL e usa il parser specifico
    if (EnelBillParser.isEnelBill(text)) {
      console.log('📋 Bolletta ENEL rilevata - usando parser specifico');
      return EnelBillParser.parseFromText(text);
    }
    
    console.log('📋 Bolletta generica - usando parser base');
    
    const data = {};

    // Pattern migliorati per ENEL e altri fornitori
    const patterns = {
      // Nome completo - pattern più specifici
      clientName: [
        /gentile\s+([A-Z\s]{2,50})[,\n]/i,
        /intestatario[:\s]+([A-Z\s]{2,50})[\n,]/i,
        /sig\.?\s*([A-Z]+\s+[A-Z]+)/i,
        /cliente[:\s]+([A-Z\s]{2,50})[\n,]/i
      ],
      
      // Codice fiscale - molto specifico
      fiscalCode: [
        /codice\s*fiscale[:\s]+([A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z])/i,
        /([A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z])(?=\s)/g
      ],
      
      // POD - specifico per energia elettrica
      pod: [
        /pod[:\s]*([A-Z]{2}[0-9]{3}[A-Z][0-9]{8})/i,
        /codice\s*pod[:\s]*([A-Z]{2}[0-9]{3}[A-Z][0-9]{8})/i
      ],
      
      // Indirizzo - pattern per ENEL
      address: [
        /fornitura\s*(?:di\s*energia\s*elettrica\s*)?(?:è\s*)?(?:in|:)\s*([^\n]{10,100})/i,
        /via\s+([^\n]{5,80})\s+[0-9]{5}/i,
        /indirizzo[:\s]+([^\n]{10,100})/i
      ],
      
      // CAP e Città
      postalCode: [
        /([0-9]{5})\s+([A-Z\s]{2,30})\s+([A-Z]{2})(?=\s|$)/i
      ],
      
      // PDR per gas
      pdr: [
        /pdr[:\s]*([0-9]{14})/i
      ],
      
      // Fornitore
      supplier: [
        /enel\s*energia/i,
        /eni\s*gas/i,
        /edison/i,
        /a2a/i
      ]
    };

    // Applica tutti i pattern
    for (const [key, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        const match = text.match(pattern);
        if (match && match[1]) {
          console.log(`✅ Trovato ${key}:`, match[1]);
          data[key] = match[1].trim();
          break; // Prende il primo match valido
        }
      }
    }
    
    // Post-processing specifico
    if (data.postalCode) {
      const cityMatch = text.match(/([0-9]{5})\s+([A-Z\s]{2,30})\s+([A-Z]{2})/i);
      if (cityMatch) {
        data.postalCode = cityMatch[1];
        data.city = cityMatch[2].trim();
        data.province = cityMatch[3];
        console.log(`📍 Estratto indirizzo completo: ${data.postalCode} ${data.city} (${data.province})`);
      }
    }
    
    // Estrazione nome e cognome da clientName
    if (data.clientName) {
      // Pulisci il nome da caratteri extra
      let cleanName = data.clientName
        .replace(/[,\.]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const nameParts = cleanName.split(/\s+/);
      if (nameParts.length >= 2) {
        data.firstName = nameParts[0];
        data.lastName = nameParts.slice(1).join(' ');
        console.log(`👤 Nome: ${data.firstName}, Cognome: ${data.lastName}`);
      }
    }

    // Identifica fornitore
    data.provider = this.identifyProvider(normalizedText);
    
    console.log('📋 Dati finali estratti:', data);
    return this.validateData(data);
  }

  /**
   * Identifica il fornitore dalla bolletta
   */
  static identifyProvider(text) {
    const providers = ['enel', 'eni', 'edison', 'a2a', 'sorgenia', 'acea', 'iren', 'hera'];
    
    for (const provider of providers) {
      if (text.includes(provider)) {
        return provider.toUpperCase();
      }
    }
    return 'SCONOSCIUTO';
  }

  /**
   * Valida e pulisce i dati estratti
   */
  static validateData(data) {
    const cleaned = {};
    
    // Validazioni specifiche
    if (data.fiscalCode && /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(data.fiscalCode)) {
      cleaned.fiscalCode = data.fiscalCode.toUpperCase();
    }
    
    if (data.vatNumber && /^[0-9]{11}$/.test(data.vatNumber)) {
      cleaned.vatNumber = data.vatNumber;
    }
    
    if (data.pod && /^IT[0-9]{3}[A-Z][0-9]{8}$/.test(data.pod)) {
      cleaned.pod = data.pod.toUpperCase();
    }
    
    if (data.pdr && /^[0-9]{14}$/.test(data.pdr)) {
      cleaned.pdr = data.pdr;
    }

    // Copia campi semplici
    ['firstName', 'lastName', 'clientName', 'address', 'city', 'province', 'postalCode', 'supplier', 'provider'].forEach(field => {
      if (data[field]) {
        cleaned[field] = data[field];
      }
    });

    // Consumi numerici
    if (data.electricConsumption) {
      const num = parseInt(data.electricConsumption.replace(/[,\.]/g, ''));
      if (!isNaN(num)) cleaned.electricConsumption = num;
    }
    
    if (data.gasConsumption) {
      const num = parseInt(data.gasConsumption.replace(/[,\.]/g, ''));
      if (!isNaN(num)) cleaned.gasConsumption = num;
    }

    return cleaned;
  }

  /**
   * Calcola punteggio di confidenza
   */
  static calculateConfidence(data) {
    let score = 0;
    const weights = {
      fiscalCode: 25, pod: 20, pdr: 20, clientName: 15, 
      address: 10, city: 5, province: 5
    };

    for (const [key, weight] of Object.entries(weights)) {
      if (data[key]) score += weight;
    }

    return Math.min(score, 100);
  }
}

module.exports = SimpleBillParser;