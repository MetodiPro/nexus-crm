const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');

// Dashboard principale con analytics
router.get('/', async (req, res) => {
  try {
    const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
    const isAdmin = req.session.user.role === 'administrator';
    
    // Carica tutti i dati analytics in parallelo
    const promises = [
      AnalyticsService.getDashboardKPIs(consultantId),
      AnalyticsService.getMonthlyTrends(consultantId),
      AnalyticsService.getUpcomingItems(consultantId)
    ];
    
    // Per consulenti aggiungi performance, per admin aggiungi analytics prodotti
    if (consultantId) {
      promises.push(AnalyticsService.getMonthlyPerformance(consultantId));
    } else {
      promises.push(AnalyticsService.getProductsAnalytics());
    }
    
    const results = await Promise.all(promises);
    const [kpis, trends, upcoming, extraData] = results;
    
    res.render('dashboard/analytics', {
      title: 'Dashboard Analytics',
      kpis,
      trends,
      upcoming,
      performance: consultantId ? extraData : null,
      productsAnalytics: isAdmin ? extraData : null,
      isAdmin
    });
    
  } catch (error) {
    console.error('Errore caricamento dashboard analytics:', error);
    res.render('dashboard/basic', {
      title: 'Dashboard',
      error: 'Errore nel caricamento delle statistiche'
    });
  }
});

// API endpoint per aggiornamento dati in tempo reale
router.get('/api/kpis', async (req, res) => {
  try {
    const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
    const kpis = await AnalyticsService.getDashboardKPIs(consultantId);
    res.json(kpis);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento KPI' });
  }
});

// API endpoint per analytics prodotti (solo admin)
router.get('/api/products-analytics', async (req, res) => {
  try {
    if (req.session.user.role !== 'administrator') {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    
    const analytics = await AnalyticsService.getProductsAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento analytics prodotti' });
  }
});

module.exports = router;
