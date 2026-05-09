(function () {
  'use strict';

  /* ── Reference Number ─────────────────────────────────────────── */
  function generateReferenceNumber() {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `MR-${year}-${rand}`;
  }

  const REF_NUMBER = generateReferenceNumber();

  /* ── Populate Selects from CONFIG ─────────────────────────────── */
  function populateSelect(selectId, options) {
    const el = document.getElementById(selectId);
    if (!el) return;
    options.forEach(function (opt) {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      el.appendChild(option);
    });
  }

  function populateSelects() {
    populateSelect('property', CONFIG.properties);
    populateSelect('problemType', CONFIG.problemTypes);
    populateSelect('locationInUnit', CONFIG.locations);
  }

  /* ── Header Reference + Date ──────────────────────────────────── */
  function initHeader() {
    const chip = document.getElementById('refChip');
    if (chip) chip.textContent = REF_NUMBER;

    const dateEl = document.getElementById('headerDate');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  /* ── Urgency Segmented Control ────────────────────────────────── */
  function initUrgencyControl() {
    const btns = document.querySelectorAll('.urgency-btn');
    const slider = document.getElementById('urgencySlider');
    const hiddenInput = document.getElementById('urgency');

    const positions = { urgent: 0, normal: 1, minor: 2 };

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const val = btn.dataset.value;

        btns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');

        hiddenInput.value = val;

        slider.className = 'urgency-control__slider urgency-control__slider--' + val;
      });
    });
  }

  /* ── File Drop Zone ───────────────────────────────────────────── */
  function initDropZone() {
    const zone = document.getElementById('dropZone');
    const input = document.getElementById('photo');
    const preview = document.getElementById('photoPreview');
    const nameEl = document.getElementById('photoName');
    const removeBtn = document.getElementById('photoRemove');

    if (!zone || !input) return;

    function showPreview(file) {
      nameEl.textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
      preview.classList.add('drop-zone__preview--visible');
    }

    function clearPreview() {
      input.value = '';
      nameEl.textContent = '';
      preview.classList.remove('drop-zone__preview--visible');
    }

    input.addEventListener('change', function () {
      if (input.files[0]) showPreview(input.files[0]);
    });

    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      clearPreview();
    });

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drop-zone--dragover');
    });

    zone.addEventListener('dragleave', function () {
      zone.classList.remove('drop-zone--dragover');
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drop-zone--dragover');
      const file = e.dataTransfer.files[0];
      if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        showPreview(file);
      }
    });
  }

  /* ── Validation ───────────────────────────────────────────────── */
  const REQUIRED_FIELDS = [
    { id: 'property',        errorId: 'property-error' },
    { id: 'problemType',     errorId: 'problemType-error' },
    { id: 'locationInUnit',  errorId: 'locationInUnit-error' },
    { id: 'description',     errorId: 'description-error' },
    { id: 'tenantName',      errorId: 'tenantName-error' },
    { id: 'tenantEmail',     errorId: 'tenantEmail-error' },
    { id: 'tenantPhone',     errorId: 'tenantPhone-error' },
    { id: 'permissionToEnter', errorId: 'permissionToEnter-error' },
    { id: 'bestTime',        errorId: 'bestTime-error' },
  ];

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateForm() {
    var errors = [];

    REQUIRED_FIELDS.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (!el) return;
      var val = el.value.trim();

      var invalid = !val;
      if (f.id === 'tenantEmail' && val && !EMAIL_RE.test(val)) invalid = true;

      if (invalid) {
        el.setAttribute('aria-invalid', 'true');
        var errEl = document.getElementById(f.errorId);
        if (errEl) errEl.classList.add('field__error--visible');
        errors.push(f.id);
      } else {
        el.setAttribute('aria-invalid', 'false');
        var errEl2 = document.getElementById(f.errorId);
        if (errEl2) errEl2.classList.remove('field__error--visible');
      }
    });

    return errors;
  }

  function clearValidationErrors() {
    REQUIRED_FIELDS.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (el) el.removeAttribute('aria-invalid');
      var errEl = document.getElementById(f.errorId);
      if (errEl) errEl.classList.remove('field__error--visible');
    });
  }

  /* ── Submission ───────────────────────────────────────────────── */
  function buildFormData() {
    var fd = new FormData();

    fd.append('referenceNumber',  REF_NUMBER);
    fd.append('submittedAt',      new Date().toISOString());
    fd.append('property',         document.getElementById('property').value);
    fd.append('urgency',          document.getElementById('urgency').value);
    fd.append('problemType',      document.getElementById('problemType').value);
    fd.append('locationInUnit',   document.getElementById('locationInUnit').value);
    fd.append('description',      document.getElementById('description').value.trim());
    fd.append('tenantName',       document.getElementById('tenantName').value.trim());
    fd.append('tenantEmail',      document.getElementById('tenantEmail').value.trim());
    fd.append('tenantPhone',      document.getElementById('tenantPhone').value.trim());
    fd.append('permissionToEnter',document.getElementById('permissionToEnter').value);
    fd.append('bestTime',         document.getElementById('bestTime').value);

    var photoInput = document.getElementById('photo');
    if (photoInput.files[0]) {
      fd.append('photo', photoInput.files[0], photoInput.files[0].name);
    }

    return fd;
  }

  async function submitForm(fd) {
    var response = await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      body: fd,
      // No Content-Type header — browser sets multipart boundary automatically
    });

    if (!response.ok) {
      throw new Error('Server returned ' + response.status + '. Please try again.');
    }

    return response;
  }

  /* ── UI State Helpers ─────────────────────────────────────────── */
  function setLoading(on) {
    var btn = document.getElementById('submitBtn');
    var label = document.getElementById('submitLabel');
    var dots = document.getElementById('dotPulse');

    btn.disabled = on;
    label.style.opacity = on ? '0' : '1';
    dots.classList.toggle('dot-pulse--visible', on);
  }

  function showErrorBanner(msg) {
    var banner = document.getElementById('errorBanner');
    banner.textContent = msg;
    banner.classList.add('error-banner--visible');
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearErrorBanner() {
    var banner = document.getElementById('errorBanner');
    banner.textContent = '';
    banner.classList.remove('error-banner--visible');
  }

  function showSuccess() {
    var form = document.getElementById('maintenanceForm');
    var successState = document.getElementById('successState');

    form.style.animation = 'fadeSlideOut 300ms ease forwards';

    setTimeout(function () {
      form.hidden = true;

      // Populate success card
      document.getElementById('successRef').textContent = REF_NUMBER;

      var details = [
        ['Property',    document.getElementById('property').value],
        ['Urgency',     document.getElementById('urgency').value],
        ['Problem',     document.getElementById('problemType').value],
        ['Tenant',      document.getElementById('tenantName').value.trim()],
        ['Contact',     document.getElementById('tenantEmail').value.trim()],
      ];

      var detailsContainer = document.getElementById('successDetails');
      detailsContainer.innerHTML = '';
      details.forEach(function (d) {
        var row = document.createElement('div');
        row.className = 'success-detail';
        row.innerHTML =
          '<span class="success-detail__key">' + d[0] + '</span>' +
          '<span class="success-detail__val">' + escapeHtml(d[1]) + '</span>';
        detailsContainer.appendChild(row);
      });

      successState.hidden = false;
    }, 320);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resetForm() {
    var form = document.getElementById('maintenanceForm');
    var successState = document.getElementById('successState');

    successState.hidden = true;
    form.hidden = false;
    form.style.animation = '';
    form.reset();
    clearValidationErrors();
    clearErrorBanner();

    // Reset urgency toggle back to Normal
    document.querySelectorAll('.urgency-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.value === 'normal' ? 'true' : 'false');
    });
    var slider = document.getElementById('urgencySlider');
    if (slider) slider.className = 'urgency-control__slider urgency-control__slider--normal';
    document.getElementById('urgency').value = 'normal';

    // Clear photo preview
    document.getElementById('photoPreview').classList.remove('drop-zone__preview--visible');
  }

  /* ── Form Submit Handler ──────────────────────────────────────── */
  function initForm() {
    var form = document.getElementById('maintenanceForm');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearErrorBanner();

      var errors = validateForm();
      if (errors.length > 0) {
        var firstErrorEl = document.getElementById(errors[0]);
        if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showErrorBanner('Please complete all required fields before submitting.');
        return;
      }

      if (CONFIG.webhookUrl === 'YOUR_N8N_WEBHOOK_URL') {
        // Dev mode: simulate success without a real network call
        setLoading(true);
        setTimeout(function () {
          setLoading(false);
          showSuccess();
        }, 1200);
        return;
      }

      setLoading(true);
      try {
        var fd = buildFormData();
        await submitForm(fd);
        setLoading(false);
        showSuccess();
      } catch (err) {
        setLoading(false);
        showErrorBanner(err.message || 'Submission failed. Please try again or contact us directly.');
      }
    });

    document.getElementById('newRequestBtn').addEventListener('click', function () {
      resetForm();
    });
  }

  /* ── Status Checker ───────────────────────────────────────────── */
  function initStatusChecker() {
    var input    = document.getElementById('statusRefInput');
    var btn      = document.getElementById('statusCheckBtn');
    var btnLabel = document.getElementById('statusBtnLabel');
    var btnDots  = document.getElementById('statusDotPulse');
    var hint     = document.getElementById('statusInputHint');
    var result   = document.getElementById('statusResult');
    var notFound = document.getElementById('statusNotFound');
    var card     = document.getElementById('statusCard');

    var BADGE_CLASS = {
      'submitted':   'status-badge--submitted',
      'in progress': 'status-badge--in-progress',
      'scheduled':   'status-badge--scheduled',
      'resolved':    'status-badge--resolved',
    };

    function setChecking(on) {
      btn.disabled = on;
      btnLabel.style.opacity = on ? '0' : '1';
      btnDots.classList.toggle('status-checker__btn-dots--visible', on);
    }

    function clearResult() {
      result.hidden   = true;
      notFound.hidden = true;
      card.hidden     = true;
    }

    function reAnimate() {
      result.style.animation = 'none';
      result.offsetHeight;
      result.style.animation = '';
    }

    function showNotFound() {
      clearResult();
      notFound.hidden = false;
      result.hidden   = false;
      reAnimate();
    }

    function showCard(data) {
      clearResult();

      document.getElementById('statusCardRef').textContent = data.referenceNumber || '';

      var badge = document.getElementById('statusBadge');
      var statusKey = (data.status || '').toLowerCase().trim();
      badge.textContent = data.status || '';
      badge.className = 'status-badge ' + (BADGE_CLASS[statusKey] || 'status-badge--submitted');

      var submitted = '';
      if (data.submittedAt) {
        try {
          submitted = 'Submitted ' + new Date(data.submittedAt).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
          });
        } catch (_) { submitted = data.submittedAt; }
      }
      document.getElementById('statusCardSubmitted').textContent = submitted;
      document.getElementById('statusCardProperty').textContent    = data.property    || '—';
      document.getElementById('statusCardProblemType').textContent = data.problemType || '—';
      document.getElementById('statusCardTenant').textContent      = data.tenantName  || '—';

      var notesWrap = document.getElementById('statusCardNotesWrap');
      var notesBody = document.getElementById('statusCardNotes');
      var notes = (data.notes || '').trim();
      if (notes) {
        notesBody.textContent = notes;
        notesWrap.hidden = false;
      } else {
        notesWrap.hidden = true;
      }

      card.hidden   = false;
      result.hidden = false;
      reAnimate();
    }

    function validateInput() {
      var val = input.value.trim().toUpperCase();
      if (!val) {
        hint.textContent = 'Please enter a reference number.';
        input.classList.add('status-checker__input--error');
        return null;
      }
      hint.textContent = '';
      input.classList.remove('status-checker__input--error');
      return val;
    }

    async function checkStatus() {
      var ref = validateInput();
      if (!ref) return;

      if (!CONFIG.statusWebhookUrl || CONFIG.statusWebhookUrl === 'YOUR_N8N_STATUS_WEBHOOK_URL') {
        setChecking(true);
        setTimeout(function () {
          setChecking(false);
          showCard({
            referenceNumber: ref,
            status: 'In Progress',
            submittedAt: new Date().toISOString(),
            property: 'Sunrise Apartments - Unit 101',
            problemType: 'Plumbing – Leak or drip',
            tenantName: 'Jane Smith',
            notes: 'A technician has been assigned and will contact you by Thursday.',
          });
        }, 900);
        return;
      }

      setChecking(true);
      clearResult();

      try {
        var response = await fetch(CONFIG.statusWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referenceNumber: ref }),
        });

        if (response.status === 404) { showNotFound(); return; }
        if (!response.ok) throw new Error('Server error ' + response.status);

        var data = await response.json();
        if (Array.isArray(data)) data = data[0];
        if (!data || !data.referenceNumber) { showNotFound(); return; }

        showCard(data);
      } catch (err) {
        hint.textContent = 'Unable to check status. Please try again shortly.';
      } finally {
        setChecking(false);
      }
    }

    btn.addEventListener('click', checkStatus);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); checkStatus(); }
    });

    input.addEventListener('input', function () {
      hint.textContent = '';
      input.classList.remove('status-checker__input--error');
    });
  }

  /* ── Init ─────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    populateSelects();
    initHeader();
    initUrgencyControl();
    initDropZone();
    initForm();
    initStatusChecker();
  });
})();
