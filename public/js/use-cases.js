/**
 * IWC Data Cloud Workshop — Use Cases Page
 * Handles filtering, searching, expanding/collapsing use case cards
 */
(function () {
  'use strict';

  var searchInput = document.getElementById('uc-search');
  var counterEl = document.getElementById('uc-counter');
  var clusterBtns = document.querySelectorAll('.uc-filters__cluster-btn');
  var techBtns = document.querySelectorAll('.uc-filters__tech-btn');
  var cards = document.querySelectorAll('.uc-card');
  var clusters = document.querySelectorAll('.uc-cluster');
  var expandAllBtn = document.getElementById('uc-expand-toggle');
  var noResults = document.querySelector('.uc-no-results');
  var totalCards = cards.length;

  var activeCluster = 'all';
  var activeTechs = [];
  var searchQuery = '';
  var allExpanded = false;

  // ---------------------------------------------------------------------------
  // Cluster filter
  // ---------------------------------------------------------------------------
  clusterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      clusterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeCluster = btn.getAttribute('data-cluster');
      applyFilters();
    });
  });

  // ---------------------------------------------------------------------------
  // Technology filter (toggle with "All Tech" reset)
  // ---------------------------------------------------------------------------
  techBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tech = btn.getAttribute('data-tech');

      if (tech === 'all') {
        activeTechs = [];
        techBtns.forEach(function (b) {
          if (b.getAttribute('data-tech') === 'all') {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
      } else {
        techBtns.forEach(function (b) {
          if (b.getAttribute('data-tech') === 'all') b.classList.remove('active');
        });

        btn.classList.toggle('active');
        var idx = activeTechs.indexOf(tech);
        if (idx === -1) {
          activeTechs.push(tech);
        } else {
          activeTechs.splice(idx, 1);
        }

        if (activeTechs.length === 0) {
          techBtns.forEach(function (b) {
            if (b.getAttribute('data-tech') === 'all') b.classList.add('active');
          });
        }
      }

      applyFilters();
    });
  });

  // ---------------------------------------------------------------------------
  // Search filter
  // ---------------------------------------------------------------------------
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchQuery = searchInput.value.toLowerCase().trim();
      applyFilters();
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchQuery = '';
        applyFilters();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Expand / Collapse all
  // ---------------------------------------------------------------------------
  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', function () {
      allExpanded = !allExpanded;
      cards.forEach(function (card) {
        if (!card.classList.contains('uc-card--hidden')) {
          if (allExpanded) {
            card.classList.add('expanded');
          } else {
            card.classList.remove('expanded');
          }
        }
      });
      var label = expandAllBtn.querySelector('span');
      var icon = expandAllBtn.querySelector('i');
      if (label) label.textContent = allExpanded ? 'Collapse All' : 'Expand All';
      if (icon) {
        icon.className = allExpanded ? 'ph ph-arrows-in-simple' : 'ph ph-arrows-out-simple';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Card expand/collapse (header click)
  // ---------------------------------------------------------------------------
  cards.forEach(function (card) {
    var header = card.querySelector('.uc-card__header');
    if (header) {
      header.addEventListener('click', function () {
        card.classList.toggle('expanded');
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Apply all filters
  // ---------------------------------------------------------------------------
  function applyFilters() {
    var visibleCount = 0;

    cards.forEach(function (card) {
      var cardCluster = card.getAttribute('data-cluster');
      var cardTechs = (card.getAttribute('data-technologies') || '').split(',');

      var titleEl = card.querySelector('.uc-card__title');
      var cardTitle = titleEl ? titleEl.textContent.toLowerCase() : '';

      var briefEl = card.querySelector('.uc-card__brief');
      var cardBrief = briefEl ? briefEl.textContent.toLowerCase() : '';

      var detailsEl = card.querySelector('.uc-card__details');
      var cardDetails = detailsEl ? detailsEl.textContent.toLowerCase() : '';

      var matchCluster = activeCluster === 'all' || cardCluster === activeCluster;
      var matchTech = activeTechs.length === 0 || activeTechs.some(function (t) {
        return cardTechs.indexOf(t) !== -1;
      });
      var matchSearch = !searchQuery
        || cardTitle.indexOf(searchQuery) !== -1
        || cardBrief.indexOf(searchQuery) !== -1
        || cardDetails.indexOf(searchQuery) !== -1;

      if (matchCluster && matchTech && matchSearch) {
        card.classList.remove('uc-card--hidden');
        visibleCount++;
      } else {
        card.classList.add('uc-card--hidden');
        card.classList.remove('expanded');
      }
    });

    clusters.forEach(function (cluster) {
      var clusterCards = cluster.querySelectorAll('.uc-card:not(.uc-card--hidden)');
      if (clusterCards.length === 0) {
        cluster.classList.add('uc-cluster--hidden');
      } else {
        cluster.classList.remove('uc-cluster--hidden');
      }
    });

    if (counterEl) {
      counterEl.innerHTML = 'Showing <strong>' + visibleCount + '</strong> of <strong>' + totalCards + '</strong> use cases';
    }

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  // ---------------------------------------------------------------------------
  // Staggered entrance animation on scroll
  // ---------------------------------------------------------------------------
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('uc-card--visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

    cards.forEach(function (card, index) {
      card.style.transitionDelay = (index % 6) * 0.05 + 's';
      observer.observe(card);
    });
  } else {
    cards.forEach(function (card) {
      card.classList.add('uc-card--visible');
    });
  }

  applyFilters();

})();
