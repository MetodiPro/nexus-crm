const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');

// Dashboard principale con analytics
router.get('/', async (req, res) => {
  try {
    const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
    
    // Carica tutti i dati analytics in parallelo
    const [kpis, trends, upcoming, performance] = await Promise.all([
      AnalyticsService.getDashboardKPIs(consultantId),
      AnalyticsService.getMonthlyTrends(consultantId),
      AnalyticsService.getUpcomingItems(consultantId),
      consultantId ? AnalyticsService.getMonthlyPerformance(consultantId) : Promise.resolve(null)
    ]);
    
    res.render('dashboard/analytics', {
      title: 'Dashboard Analytics',
      kpis,
      trends,
      upcoming,
      performance,
      isAdmin: req.session.user.role === 'administrator'
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

module.exports = router;