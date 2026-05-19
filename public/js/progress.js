/**
 * IWC Data 360 Workshop - Progress Tracking
 *
 * Handles interactive checkboxes, progress bars, module completion tracking,
 * and celebration effects.
 */
(function () {
  'use strict';

  var STORAGE_KEY_PROGRESS = 'iwc-workshop-progress';
  var CONFETTI_DURATION = 2000;

  function storageGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // 1. Checkbox Persistence
  // ---------------------------------------------------------------------------
  function restoreCheckboxes() {
    var saved = storageGet(STORAGE_KEY_PROGRESS, {});
    var checkboxes = document.querySelectorAll('.step-checkbox');

    checkboxes.forEach(function (cb) {
      var stepId = cb.getAttribute('data-step');
      if (stepId && saved[stepId] === true) {
        cb.checked = true;
      }
    });

    window.dispatchEvent(new Event('progress-restored'));
  }

  function handleCheckboxChange(event) {
    var cb = event.target;
    if (!cb.classList.contains('step-checkbox')) return;

    var stepId = cb.getAttribute('data-step');
    if (!stepId) return;

    var saved = storageGet(STORAGE_KEY_PROGRESS, {});
    saved[stepId] = cb.checked;
    storageSet(STORAGE_KEY_PROGRESS, saved);

    // Persist to server
    try {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: stepId, checked: cb.checked })
      }).catch(function () {});
    } catch (_) {}

    var moduleSection = cb.closest('.module-v2');
    if (moduleSection) {
      updateModuleProgress(moduleSection);
    }

    updateOverallProgress();
  }

  // ---------------------------------------------------------------------------
  // 2. Module Progress
  // ---------------------------------------------------------------------------
  function updateModuleProgress(moduleSection) {
    var checkboxes = moduleSection.querySelectorAll('.step-checkbox');
    var total = checkboxes.length;
    var checked = 0;

    checkboxes.forEach(function (cb) {
      if (cb.checked) checked++;
    });

    var pct = total > 0 ? Math.round((checked / total) * 100) : 0;

    // Update step count text
    var stepCount = moduleSection.querySelector('.module-v2__step-count');
    if (stepCount) {
      stepCount.textContent = checked + ' / ' + total;
    }

    // Update progress ring if present
    var ringFill = moduleSection.querySelector('.ring-fill');
    if (ringFill) {
      var circumference = 97.4;
      var offset = circumference - (pct / 100) * circumference;
      ringFill.style.strokeDashoffset = offset;
    }

    // Completion celebration
    var wasComplete = moduleSection.classList.contains('module-complete');
    if (pct === 100 && total > 0) {
      moduleSection.classList.add('module-complete');
      if (!wasComplete) celebrateModule(moduleSection);
    } else {
      moduleSection.classList.remove('module-complete');
    }

    return { checked: checked, total: total };
  }

  // ---------------------------------------------------------------------------
  // 3. Overall Progress
  // ---------------------------------------------------------------------------
  function updateOverallProgress() {
    var modules = document.querySelectorAll('.module-v2');
    var totalChecked = 0;
    var totalSteps = 0;

    modules.forEach(function (mod) {
      var checkboxes = mod.querySelectorAll('.step-checkbox');
      checkboxes.forEach(function (cb) {
        totalSteps++;
        if (cb.checked) totalChecked++;
      });
    });

    var pct = totalSteps > 0 ? Math.round((totalChecked / totalSteps) * 100) : 0;

    var overallBar = document.getElementById('overall-progress-fill');
    if (overallBar) {
      overallBar.style.width = pct + '%';
      overallBar.style.transition = 'width 0.5s ease';
    }

    var overallBarMain = document.getElementById('overall-progress-main');
    if (overallBarMain) {
      overallBarMain.style.width = pct + '%';
      overallBarMain.style.transition = 'width 0.5s ease';
    }

    var overallText = document.getElementById('overall-progress-text');
    if (overallText) {
      overallText.textContent = pct + '% complete (' + totalChecked + '/' + totalSteps + ' steps)';
    }

    if (pct === 100 && totalSteps > 0) {
      showCompletionMessage();
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Celebration Effects
  // ---------------------------------------------------------------------------
  function celebrateModule(moduleSection) {
    if (moduleSection.querySelector('.confetti-container')) return;

    var container = document.createElement('div');
    container.className = 'confetti-container';
    container.setAttribute('aria-hidden', 'true');

    var colors = ['#C4A962', '#E8D5A0', '#0176D3', '#ffffff', '#A68B4B', '#4BC0C0'];
    for (var i = 0; i < 30; i++) {
      var particle = document.createElement('span');
      particle.className = 'confetti-particle';
      particle.style.backgroundColor = colors[i % colors.length];
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 0.5 + 's';
      particle.style.animationDuration = (1 + Math.random()) + 's';
      container.appendChild(particle);
    }

    moduleSection.style.position = moduleSection.style.position || 'relative';
    moduleSection.appendChild(container);

    setTimeout(function () {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, CONFETTI_DURATION);
  }

  function showCompletionMessage() {
    if (document.getElementById('completion-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'completion-overlay';
    overlay.className = 'completion-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'completion-dialog';

    var title = document.createElement('h2');
    title.className = 'completion-title';
    title.textContent = 'Workshop Complete!';

    var text = document.createElement('p');
    text.className = 'completion-text';
    text.textContent = 'Congratulations! You have completed all modules in the Data 360 Track.';

    var btn = document.createElement('button');
    btn.className = 'completion-dismiss';
    btn.type = 'button';
    btn.textContent = 'Continue';

    dialog.appendChild(title);
    dialog.appendChild(text);
    dialog.appendChild(btn);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      overlay.classList.add('visible');
    });

    btn.addEventListener('click', function () {
      overlay.classList.remove('visible');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 400);
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  function initProgress() {
    restoreCheckboxes();

    // Merge from server
    try {
      fetch('/api/progress')
        .then(function (res) { return res.ok ? res.json() : {}; })
        .then(function (serverData) {
          if (!serverData || typeof serverData !== 'object') return;
          var local = storageGet(STORAGE_KEY_PROGRESS, {});
          var merged = false;
          var checkboxes = document.querySelectorAll('.step-checkbox');
          checkboxes.forEach(function (cb) {
            var stepId = cb.getAttribute('data-step');
            if (stepId && serverData[stepId] === true && !cb.checked) {
              cb.checked = true;
              local[stepId] = true;
              merged = true;
            }
          });
          if (merged) {
            storageSet(STORAGE_KEY_PROGRESS, local);
            window.dispatchEvent(new Event('progress-restored'));
          }
          // Recalculate after merge
          var modules = document.querySelectorAll('.module-v2');
          modules.forEach(function (mod) { updateModuleProgress(mod); });
          updateOverallProgress();
        })
        .catch(function () {});
    } catch (_) {}

    document.addEventListener('change', handleCheckboxChange);

    var modules = document.querySelectorAll('.module-v2');
    modules.forEach(function (mod) { updateModuleProgress(mod); });
    updateOverallProgress();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initProgress();
  });
})();
