/**
 * Data Cloud Incubation Workshop - IWC Schaffhausen
 * Shared App Logic
 *
 * Handles: header scroll effects, mobile nav drawer, dropdown menus,
 * scroll animations, copy-to-clipboard, back-to-top, collapsible modules,
 * glossary search, and smooth scroll.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Header scroll effect
  // ---------------------------------------------------------------------------
  var header = document.querySelector('.header');

  function onScroll() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (header) {
      if (scrollY > 20) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------------------
  // 2. Mobile navigation (slide-out drawer)
  // ---------------------------------------------------------------------------
  var hamburger = document.getElementById('mobile-menu-toggle');
  var mobileDrawer = document.querySelector('.header__mobile-drawer');
  var mobileOverlay = document.querySelector('.header__mobile-drawer-overlay');
  var mobileClose = document.getElementById('mobile-drawer-close');

  function openMobileDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('open');
    if (hamburger) hamburger.classList.add('header__hamburger--active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('open');
    if (hamburger) hamburger.classList.remove('header__hamburger--active');
    document.body.style.overflow = '';
  }

  function toggleMobileDrawer() {
    if (!mobileDrawer) return;
    if (mobileDrawer.classList.contains('open')) {
      closeMobileDrawer();
    } else {
      openMobileDrawer();
    }
  }

  if (hamburger) hamburger.addEventListener('click', toggleMobileDrawer);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileDrawer);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileDrawer);
  if (mobileDrawer) {
    mobileDrawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileDrawer);
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Dropdown menus
  // ---------------------------------------------------------------------------
  var dropdownTriggers = document.querySelectorAll('.header__nav-link--dropdown-trigger');
  dropdownTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var item = trigger.closest('.header__nav-item--dropdown');
      if (!item) return;
      var dropdown = item.querySelector('.header__dropdown');
      if (dropdown) dropdown.classList.toggle('header__dropdown--visible');
    });
  });

  var userTrigger = document.querySelector('.header__user-trigger');
  if (userTrigger) {
    userTrigger.addEventListener('click', function () {
      var menu = userTrigger.closest('.header__user').querySelector('.header__user-menu');
      if (menu) menu.classList.toggle('header__user-menu--visible');
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Scroll-triggered animations
  // ---------------------------------------------------------------------------
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = parseInt(entry.target.getAttribute('data-delay') || '0', 10);
            setTimeout(function () {
              entry.target.classList.add('animated');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

      elements.forEach(function (el) { observer.observe(el); });
    } else {
      elements.forEach(function (el) { el.classList.add('animated'); });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Copy to clipboard
  // ---------------------------------------------------------------------------
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;
    var block = btn.closest('.prompt-block');
    if (!block) return;
    var textEl = block.querySelector('.prompt-text');
    if (!textEl) return;
    var content = textEl.textContent.trim();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).then(function () {
        showCopyFeedback(btn);
      });
    } else {
      var textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); showCopyFeedback(btn); } catch (_) {}
      document.body.removeChild(textarea);
    }
  });

  function showCopyFeedback(btn) {
    var original = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copy-btn--success');
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('copy-btn--success');
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // 6. Back to top button
  // ---------------------------------------------------------------------------
  var backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Smooth scroll for anchor links
  // ---------------------------------------------------------------------------
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var targetId = link.getAttribute('href').substring(1);
    if (!targetId) return;
    var target = document.getElementById(targetId);
    if (!target) return;
    e.preventDefault();
    var headerHeight = header ? header.offsetHeight : 80;
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });

  // ---------------------------------------------------------------------------
  // 8. Module collapsible sections
  // ---------------------------------------------------------------------------
  function initCollapsible() {
    var moduleHeaders = document.querySelectorAll('.module-v2__header');
    moduleHeaders.forEach(function (mh) {
      mh.addEventListener('click', function () {
        var moduleCard = mh.closest('.module-v2__card');
        var content = moduleCard ? moduleCard.querySelector('.module-v2__content') : null;
        if (!content) return;

        var isExpanded = content.classList.toggle('module-v2__content--expanded');
        mh.setAttribute('aria-expanded', String(isExpanded));

        var chevron = mh.querySelector('.module-v2__chevron');
        if (chevron) {
          chevron.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 9. Glossary search/filter
  // ---------------------------------------------------------------------------
  function initGlossarySearch() {
    var searchInput = document.getElementById('glossary-filter');
    if (!searchInput) return;

    var items = document.querySelectorAll('.glossary-item');
    var countEl = document.getElementById('glossary-count');

    searchInput.addEventListener('input', function () {
      var query = searchInput.value.toLowerCase().trim();
      var visible = 0;
      items.forEach(function (item) {
        var term = (item.querySelector('.glossary-item__term') || {}).textContent || '';
        var def = (item.querySelector('.glossary-item__definition') || {}).textContent || '';
        var match = !query || term.toLowerCase().indexOf(query) !== -1 || def.toLowerCase().indexOf(query) !== -1;
        item.classList.toggle('glossary-item--hidden', !match);
        if (match) visible++;
      });
      if (countEl) {
        countEl.textContent = query ? 'Showing ' + visible + ' of ' + items.length + ' terms' : 'Showing all ' + items.length + ' terms';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    initScrollAnimations();
    initCollapsible();
    initGlossarySearch();
  });

})();
