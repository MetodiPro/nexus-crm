const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const Client = require('../models/client');

// Lista attività
router.get('/', (req, res) => {
  // Se l'utente è admin, mostra tutte le attività, altrimenti filtra per consulente
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  Activity.getAll(consultantId, (err, activities) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    res.render('activities/index', { activities });
  });
});

// Form per nuova attività
router.get('/new', (req, res) => {
  const clientId = req.query.client_id || '';
  
  // Ottieni la lista dei clienti per il dropdown
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  Client.getAll(consultantId, (err, clients) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    
    res.render('activities/form', { 
      activity: { client_id: clientId, activity_date: new Date().toISOString().split('T')[0] }, 
      clients,
      action: '/activities/new' 
    });
  });
});

// Crea nuova attività
router.post('/new', (req, res) => {
  const activityData = {
    client_id: req.body.client_id,
    title: req.body.title,
    description: req.body.description,
    activity_date: req.body.activity_date,
    status: req.body.status,
    consultant_id: req.session.user.id
  };
  
  Activity.create(activityData, (err, activityId) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nella creazione dell\'attività' });
    }
    
    // Reindirizza alla pagina del cliente se specificato
    if (req.body.redirect_to_client) {
      return res.redirect(`/clients/view/${req.body.client_id}`);
    }
    
    res.redirect('/activities');
  });
});

// Visualizza dettagli attività
router.get('/view/:id', (req, res) => {
  Activity.getById(req.params.id, (err, activity) => {
    if (err || !activity) {
      return res.status(404).render('error', { message: 'Attività non trovata' });
    }
    res.render('activities/view', { activity });
  });
});

// Form per modifica attività
router.get('/edit/:id', (req, res) => {
  Activity.getById(req.params.id, (err, activity) => {
    if (err || !activity) {
      return res.status(404).render('error', { message: 'Attività non trovata' });
    }
    
    // Ottieni la lista dei clienti per il dropdown
    const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
    
    Client.getAll(consultantId, (err, clients) => {
      if (err) {
        return res.status(500).render('error', { message: 'Errore del server' });
      }
      
      res.render('activities/form', { 
        activity, 
        clients,
        action: `/activities/edit/${activity.id}` 
      });
    });
  });
});

// Aggiorna attività
router.post('/edit/:id', (req, res) => {
  const activityData = {
    client_id: req.body.client_id,
    title: req.body.title,
    description: req.body.description,
    activity_date: req.body.activity_date,
    status: req.body.status
  };
  
  Activity.update(req.params.id, activityData, (err) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore nell\'aggiornamento dell\'attività' });
    }
    
    // Reindirizza alla pagina del cliente se specificato
    if (req.body.redirect_to_client) {
      return res.redirect(`/clients/view/${req.body.client_id}`);
    }
    
    res.redirect('/activities');
  });
});

// Elimina attività
router.get('/delete/:id', (req, res) => {
  Activity.getById(req.params.id, (err, activity) => {
    if (err || !activity) {
      return res.status(404).render('error', { message: 'Attività non trovata' });
    }
    
    const clientId = activity.client_id;
    
    Activity.delete(req.params.id, (err) => {
      if (err) {
        return res.status(500).render('error', { message: 'Errore nell\'eliminazione dell\'attività' });
      }
      
      // Reindirizza alla pagina del cliente se viene da lì
      if (req.query.from_client) {
        return res.redirect(`/clients/view/${clientId}`);
      }
      
      res.redirect('/activities');
    });
  });
});

// Calendario attività
router.get('/calendar', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.redirect(`/activities/date/${today}`);
});

// Attività per data
router.get('/date/:date', (req, res) => {
  const date = req.params.date;
  const consultantId = req.session.user.role === 'administrator' ? null : req.session.user.id;
  
  Activity.getByDate(date, consultantId, (err, activities) => {
    if (err) {
      return res.status(500).render('error', { message: 'Errore del server' });
    }
    
    // Ottieni date precedente e successiva
    const currentDate = new Date(date);
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    res.render('activities/calendar', { 
      activities, 
      date,
      prevDate: prevDate.toISOString().split('T')[0],
      nextDate: nextDate.toISOString().split('T')[0]
    });
  });
});

module.exports = router;