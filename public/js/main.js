// Script principale per NEXUS CRM

document.addEventListener('DOMContentLoaded', function() {
  // Sidebar mobile toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (mobileMenuButton && sidebar && sidebarOverlay) {
    mobileMenuButton.addEventListener('click', function() {
      sidebar.classList.toggle('-translate-x-full');
      sidebarOverlay.classList.toggle('hidden');
      document.body.classList.toggle('overflow-hidden');
    });
    
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.add('-translate-x-full');
      sidebarOverlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
  }
  
  // Evidenzia la voce di menu attiva
  highlightActiveMenuItem();
  
  // Inizializza le funzioni di ricerca
  initializeSearch();
  
  // Conferma eliminazione
  initializeDeleteConfirmation();
});

// Funzione per evidenziare la voce di menu attiva
function highlightActiveMenuItem() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.sidebar-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Controlla se l'URL corrente inizia con l'href del link
    if (href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
    } else if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    }
  });
}

// Funzione per inizializzare il campo di ricerca
function initializeSearch() {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', function(e) {
      if (searchInput.value.trim() === '') {
        e.preventDefault();
        return false;
      }
    });
  }
}

// Funzione per inizializzare la conferma di eliminazione
function initializeDeleteConfirmation() {
  const deleteButtons = document.querySelectorAll('.delete-btn');
  
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (!confirm('Sei sicuro di voler eliminare questo elemento?')) {
        e.preventDefault();
      }
    });
  });
}

// Funzione per la validazione dei form
function validateForm(formId) {
  const form = document.getElementById(formId);
  
  if (!form) return true;
  
  let isValid = true;
  const requiredInputs = form.querySelectorAll('[required]');
  
  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add('border-red-500', 'ring-1', 'ring-red-500');
      
      // Aggiungi messaggio di errore se non esiste
      let errorMessage = input.nextElementSibling;
      if (!errorMessage || !errorMessage.classList.contains('error-message')) {
        errorMessage = document.createElement('p');
        errorMessage.className = 'text-red-500 text-xs mt-1 error-message';
        errorMessage.innerText = 'Questo campo è obbligatorio';
        input.parentNode.insertBefore(errorMessage, input.nextSibling);
      }
    } else {
      input.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
      
      // Rimuovi messaggi di errore
      const errorMessage = input.nextElementSibling;
      if (errorMessage && errorMessage.classList.contains('error-message')) {
        errorMessage.remove();
      }
    }
  });
  
  return isValid;
}