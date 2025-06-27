// Aggiungi alla fine di app.js prima delle route di fallback

// Route verifica sistema
app.get('/verify-system', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const systemStatus = {
    database: fs.existsSync(path.join(__dirname, 'data', 'nexus.db')),
    env: fs.existsSync(path.join(__dirname, '.env')),
    css: fs.existsSync(path.join(__dirname, 'public', 'css', 'styles.css')),
    nodeModules: fs.existsSync(path.join(__dirname, 'node_modules')),
    nodemailer: false,
    nodeCron: false
  };
  
  try {
    require('nodemailer');
    systemStatus.nodemailer = true;
  } catch (e) {}
  
  try {
    require('node-cron');
    systemStatus.nodeCron = true;
  } catch (e) {}
  
  res.json({
    status: 'OK',
    system: systemStatus,
    recommendations: getRecommendations(systemStatus),
    timestamp: new Date().toISOString()
  });
});

function getRecommendations(status) {
  const recommendations = [];
  
  if (!status.database) {
    recommendations.push('Esegui: node migrate-database.js');
  }
  
  if (!status.env) {
    recommendations.push('Crea file .env con configurazione SMTP');
  }
  
  if (!status.css) {
    recommendations.push('Esegui: npm run build:css');
  }
  
  if (!status.nodemailer || !status.nodeCron) {
    recommendations.push('Esegui: npm install nodemailer node-cron');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Sistema completamente funzionante! 🎉');
  }
  
  return recommendations;
}