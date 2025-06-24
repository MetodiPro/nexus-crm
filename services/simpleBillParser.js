/**
 * 🔍 Parser Bollette Semplificato - NEXUS CRM
 * 
 * Estrae i dati base da bollette energetiche italiane
 */

class SimpleBillParser {
  
  /**
   * Estrae dati da testo bolletta usando pattern regex
   */
  static parseFromText(text) {
    const data = {};
    const normalizedText = text.toLowerCase();

    // Pattern per dati anagrafici
    const patterns = {
      clientName: /(?:intestatario|cliente)[:\s]+([A-Z\s]{2,50})/i,
      fiscalCode: /(?:codice\s*fiscale|cod\.?\s*fisc\.?|c\.f\.?)[:\s]+([A-Z0-9]{16})/i,
      vatNumber: /(?:partita\s*iva|p\.?\s*iva)[:\s]+([0-9]{11})/i,
      
      // Indirizzo fornitura
      address: /(?:indirizzo\s*(?:di\s*)?fornitura|fornitura)[:\s]+(.+?)(?:\n|[0-9]{5})/i,
      postalCode: /([0-9]{5})\s+([A-Z\s]+)\s+\(([A-Z]{2})\)/i,
      
      // Codici utenze
      pod: /pod[:\s]+([A-Z0-9]{14,15})/i,
      pdr: /pdr[:\s]+([0-9]{14})/i,
      
      // Consumi
      electricConsumption: /(?:consumo|energia\s*attiva)[:\s]+([0-9,\.]+)\s*kwh/i,
      gasConsumption: /consumo[:\s]+([0-9,\.]+)\s*(?:smc|m3)/i,
      
      // Fornitore
      supplier: /(?:fornitore|venditore)[:\s]+(.+?)(?:\n|via)/i
    };

    // Applica pattern
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        if (key === 'postalCode' && match.length >= 4) {
          data.postalCode = match[1];
          data.city = match[2].trim();
          data.province = match[3];
        } else if (match[1]) {
          data[key] = match[1].trim();
        }
      }
    }

    // Post-processing
    if (data.clientName) {
      const parts = data.clientName.split(/\s+/);
      if (parts.length >= 2) {
        data.firstName = parts[0];
        data.lastName = parts.slice(1).join(' ');
      }
    }

    // Identifica fornitore
    data.provider = this.identifyProvider(normalizedText);
    
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
