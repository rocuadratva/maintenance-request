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

  /* ── Preferred Days Control ──────────────────────────────────── */
  function initDaysControl() {
    const btns = document.querySelectorAll('.day-btn');
    const hiddenInput = document.getElementById('preferredDays');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const pressed = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', pressed ? 'false' : 'true');

        const selected = Array.from(btns)
          .filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })
          .map(function (b) { return b.dataset.value; });
        hiddenInput.value = selected.join(', ');
      });
    });
  }

  /* ── Validation ───────────────────────────────────────────────── */
  const REQUIRED_FIELDS = [
    { id: 'property',          errorId: 'property-error' },
    { id: 'problemType',       errorId: 'problemType-error' },
    { id: 'locationInUnit',    errorId: 'locationInUnit-error' },
    { id: 'description',       errorId: 'description-error' },
    { id: 'tenantName',        errorId: 'tenantName-error' },
    { id: 'tenantEmail',       errorId: 'tenantEmail-error' },
    { id: 'tenantPhone',       errorId: 'tenantPhone-error' },
    { id: 'permissionToEnter', errorId: 'permissionToEnter-error' },
    { id: 'bestTime',          errorId: 'bestTime-error' },
  ];

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateForm() {
    var errors = [];

    var tenantSectionHidden = (document.getElementById('tenantInfoSection') || {}).hidden;
    var propertyFieldHidden = (document.getElementById('propertyField') || {}).hidden;

    REQUIRED_FIELDS.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (!el) return;

      // Skip fields auto-filled from access code
      if (tenantSectionHidden && (f.id === 'tenantName' || f.id === 'tenantEmail' || f.id === 'tenantPhone')) return;
      if (propertyFieldHidden && f.id === 'property') return;

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

    fd.append('referenceNumber',   REF_NUMBER);
    fd.append('accessCode',        verifiedCode);
    fd.append('submittedAt',       new Date().toISOString());
    fd.append('property',          document.getElementById('property').value);
    fd.append('urgency',           document.getElementById('urgency').value);
    fd.append('problemType',       document.getElementById('problemType').value);
    fd.append('locationInUnit',    document.getElementById('locationInUnit').value);
    fd.append('description',       document.getElementById('description').value.trim());
    fd.append('tenantName',        document.getElementById('tenantName').value.trim());
    fd.append('tenantEmail',       document.getElementById('tenantEmail').value.trim());
    fd.append('tenantPhone',       document.getElementById('tenantPhone').value.trim());
    fd.append('permissionToEnter', document.getElementById('permissionToEnter').value);
    fd.append('bestTime',          document.getElementById('bestTime').value);
    fd.append('preferredDays',     document.getElementById('preferredDays').value);

    return fd;
  }

  async function submitForm(fd) {
    var response = await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      body: fd,
    });

    if (!response.ok) {
      throw new Error('Server returned ' + response.status + '. Please try again.');
    }

    try {
      var data = await response.json();
      if (Array.isArray(data)) data = data[0];
      return data || {};
    } catch (_) {
      return {};
    }
  }

  /* ── UI State Helpers ─────────────────────────────────────────── */
  function setLoading(on) {
    var btn   = document.getElementById('submitBtn');
    var label = document.getElementById('submitLabel');
    var dots  = document.getElementById('dotPulse');

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

  function showSuccess(driveUrl) {
    var form        = document.getElementById('maintenanceForm');
    var footer      = document.getElementById('formFooter');
    var successState = document.getElementById('successState');

    form.style.animation = 'fadeSlideOut 300ms ease forwards';

    setTimeout(function () {
      form.hidden = true;
      if (footer) footer.hidden = true;

      document.getElementById('successRef').textContent = REF_NUMBER;

      var details = [
        ['Property', document.getElementById('property').value],
        ['Urgency',  document.getElementById('urgency').value],
        ['Problem',  document.getElementById('problemType').value],
        ['Tenant',   document.getElementById('tenantName').value.trim()],
        ['Contact',  document.getElementById('tenantEmail').value.trim()],
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

      var driveBlock = document.getElementById('driveUpload');
      var driveLink  = document.getElementById('driveUploadLink');
      if (driveUrl && driveBlock && driveLink) {
        driveLink.href = driveUrl;
        driveBlock.hidden = false;
      } else if (driveBlock) {
        driveBlock.hidden = true;
      }

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

  function goToScreen1() {
    // Clear session
    verifiedCode = '';
    try { sessionStorage.removeItem('tenantSession'); } catch (e) {}

    // Reset access gate UI
    var inputRow    = document.getElementById('accessGateInputRow');
    var badge       = document.getElementById('verifiedBadge');
    var gate        = document.getElementById('accessGate');
    var accessInput = document.getElementById('accessCode');
    if (inputRow)    inputRow.hidden = false;
    if (badge)       badge.hidden = true;
    if (gate)        gate.classList.remove('access-gate--verified');
    if (accessInput) accessInput.value = '';

    // Switch screens
    document.getElementById('screen2').hidden = true;
    document.getElementById('screen1').hidden = false;
    window.scrollTo(0, 0);
  }

  function resetForm() {
    var form        = document.getElementById('maintenanceForm');
    var footer      = document.getElementById('formFooter');
    var successState = document.getElementById('successState');

    successState.hidden = true;
    form.hidden = false;
    form.style.animation = '';
    if (footer) footer.hidden = false;
    form.reset();
    clearValidationErrors();
    clearErrorBanner();

    // Reset urgency toggle
    document.querySelectorAll('.urgency-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.value === 'normal' ? 'true' : 'false');
    });
    var slider = document.getElementById('urgencySlider');
    if (slider) slider.className = 'urgency-control__slider urgency-control__slider--normal';
    document.getElementById('urgency').value = 'normal';

    // Reset preferred days
    document.querySelectorAll('.day-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    document.getElementById('preferredDays').value = '';

    // Reset drive upload block
    var driveBlock = document.getElementById('driveUpload');
    if (driveBlock) driveBlock.hidden = true;

    // Reset tenant card and hidden sections
    document.getElementById('tenantCard').hidden = true;
    document.getElementById('tenantInfoSection').hidden = false;
    document.getElementById('propertyField').hidden = false;

    // Reset section 1 label
    var sec1Title = document.querySelector('#section1 .section-title');
    if (sec1Title) sec1Title.textContent = 'Property & Priority';

    // Restore section numbers
    document.querySelectorAll('#formBody .section-num').forEach(function (el, idx) {
      el.textContent = idx + 1;
    });

    // Go back to screen 1
    goToScreen1();
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
        setLoading(true);
        setTimeout(function () {
          setLoading(false);
          showSuccess('https://drive.google.com/drive/folders/demo-folder-id');
        }, 1200);
        return;
      }

      setLoading(true);
      try {
        var fd = buildFormData();
        var result = await submitForm(fd);
        setLoading(false);
        showSuccess(result && result.driveFolderUrl ? result.driveFolderUrl : null);
      } catch (err) {
        setLoading(false);
        showErrorBanner(err.message || 'Submission failed. Please try again or contact us directly.');
      }
    });

    document.getElementById('newRequestBtn').addEventListener('click', function () {
      resetForm();
    });

    var backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', function () { goToScreen1(); });
  }

  /* ── Access Code Gate ─────────────────────────────────────────── */
  var verifiedCode = '';

  function applyTenantData(tenantData) {
    var hasFullProfile = tenantData &&
      tenantData.tenantName && tenantData.tenantEmail &&
      tenantData.tenantPhone && tenantData.property;

    if (hasFullProfile) {
      document.getElementById('tenantName').value  = tenantData.tenantName;
      document.getElementById('tenantEmail').value = tenantData.tenantEmail;
      document.getElementById('tenantPhone').value = tenantData.tenantPhone;

      var sel = document.getElementById('property');
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === tenantData.property) { sel.selectedIndex = i; break; }
      }

      document.getElementById('tcName').textContent  = tenantData.tenantName;
      document.getElementById('tcUnit').textContent  = tenantData.property;
      document.getElementById('tcEmail').textContent = tenantData.tenantEmail;
      document.getElementById('tcPhone').textContent = tenantData.tenantPhone;
      document.getElementById('tenantCard').hidden = false;

      document.getElementById('tenantInfoSection').hidden = true;
      document.getElementById('propertyField').hidden = true;

      var sec1Title = document.querySelector('#section1 .section-title');
      if (sec1Title) sec1Title.textContent = 'Priority';

      document.querySelectorAll('#formBody .form-section:not([hidden])').forEach(function (sec, idx) {
        var num = sec.querySelector('.section-num');
        if (num) num.textContent = idx + 1;
      });
    } else if (tenantData) {
      if (tenantData.tenantName)  document.getElementById('tenantName').value  = tenantData.tenantName;
      if (tenantData.tenantEmail) document.getElementById('tenantEmail').value = tenantData.tenantEmail;
      if (tenantData.tenantPhone) document.getElementById('tenantPhone').value = tenantData.tenantPhone;
      if (tenantData.property) {
        var sel2 = document.getElementById('property');
        for (var j = 0; j < sel2.options.length; j++) {
          if (sel2.options[j].value === tenantData.property) { sel2.selectedIndex = j; break; }
        }
      }
    }
  }

  function onVerified(code, tenantData, instant) {
    verifiedCode = code;

    // Persist session so a page refresh lands on screen 2
    try {
      sessionStorage.setItem('tenantSession', JSON.stringify({
        code: code,
        tenantData: tenantData || null
      }));
    } catch (e) {}

    function switchToScreen2() {
      document.getElementById('screen1').hidden = true;
      var s2 = document.getElementById('screen2');
      s2.hidden = false;
      window.scrollTo(0, 0);
    }

    if (instant) {
      switchToScreen2();
    } else {
      // Show verified badge briefly before transitioning
      var inputRow = document.getElementById('accessGateInputRow');
      var badge    = document.getElementById('verifiedBadge');
      var gate     = document.getElementById('accessGate');
      if (inputRow) inputRow.hidden = true;
      if (badge)    badge.hidden = false;
      if (gate)     gate.classList.add('access-gate--verified');
      setTimeout(switchToScreen2, 500);
    }

    applyTenantData(tenantData);
  }

  function tryRestoreSession() {
    try {
      var stored = sessionStorage.getItem('tenantSession');
      if (!stored) return;
      var session = JSON.parse(stored);
      if (session && session.code) {
        onVerified(session.code, session.tenantData || null, true);
      }
    } catch (e) {
      try { sessionStorage.removeItem('tenantSession'); } catch (_) {}
    }
  }

  function initAccessCodeGate() {
    var input    = document.getElementById('accessCode');
    var btn      = document.getElementById('verifyBtn');
    var btnLabel = document.getElementById('verifyBtnLabel');
    var btnDots  = document.getElementById('verifyDotPulse');
    var errorEl  = document.getElementById('accessCode-error');

    function setVerifying(on) {
      btn.disabled = on;
      btnLabel.style.opacity = on ? '0' : '1';
      btnDots.classList.toggle('access-gate__dots--visible', on);
      input.disabled = on;
    }

    async function verify() {
      var code = input.value.trim();
      if (!code) {
        errorEl.textContent = 'Please enter your access code.';
        errorEl.classList.add('field__error--visible');
        return;
      }
      errorEl.classList.remove('field__error--visible');

      // Dev mode — simulate valid when webhook not configured
      if (!CONFIG.verifyWebhookUrl || CONFIG.verifyWebhookUrl === 'YOUR_N8N_VERIFY_WEBHOOK_URL') {
        setVerifying(true);
        setTimeout(function () {
          setVerifying(false);
          onVerified(code, null, false);
        }, 800);
        return;
      }

      setVerifying(true);
      try {
        var response = await fetch(CONFIG.verifyWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code }),
        });

        var data = await response.json();
        if (Array.isArray(data)) data = data[0];

        if (data && data.valid === true) {
          onVerified(code, data, false);
        } else {
          errorEl.textContent = 'Invalid access code. Please check with your property manager.';
          errorEl.classList.add('field__error--visible');
        }
      } catch (err) {
        errorEl.textContent = 'Unable to verify code. Please try again.';
        errorEl.classList.add('field__error--visible');
      } finally {
        setVerifying(false);
      }
    }

    btn.addEventListener('click', verify);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); verify(); }
    });
    input.addEventListener('input', function () {
      errorEl.classList.remove('field__error--visible');
    });

    // Testing bypass — remove before going live
    var skipBtn = document.getElementById('testSkipBtn');
    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        onVerified('TEST', {
          tenantName:  'Jane Smith',
          tenantEmail: 'jane@example.com',
          tenantPhone: '(555) 012-3456',
          property:    'Sunrise Apartments - Unit 101'
        }, false);
        skipBtn.style.display = 'none';
      });
    }
  }

  // Testing — fill form and go to success screen — remove before going live
  function initTestFillBtn() {
    var btn = document.getElementById('testFillBtn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      // Property (only if visible)
      var propertyField = document.getElementById('propertyField');
      if (!propertyField || !propertyField.hidden) {
        var propertySel = document.getElementById('property');
        for (var i = 0; i < propertySel.options.length; i++) {
          if (propertySel.options[i].value === 'Sunrise Apartments - Unit 101') {
            propertySel.selectedIndex = i; break;
          }
        }
      }

      // Urgency
      document.getElementById('urgency').value = 'urgent';
      document.querySelectorAll('.urgency-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.value === 'urgent' ? 'true' : 'false');
      });
      var slider = document.getElementById('urgencySlider');
      if (slider) slider.className = 'urgency-control__slider urgency-control__slider--urgent';

      // Problem details
      var ptSel = document.getElementById('problemType');
      for (var j = 0; j < ptSel.options.length; j++) {
        if (ptSel.options[j].value === 'Plumbing – Leak or drip') { ptSel.selectedIndex = j; break; }
      }
      var locSel = document.getElementById('locationInUnit');
      for (var k = 0; k < locSel.options.length; k++) {
        if (locSel.options[k].value === 'Kitchen') { locSel.selectedIndex = k; break; }
      }

      // Description
      document.getElementById('description').value =
        'There is a leak under the kitchen sink that has been dripping for two days. ' +
        'The cabinet below is getting wet and there is water damage starting on the floor.';

      // Tenant info (only if visible)
      var tenantSection = document.getElementById('tenantInfoSection');
      if (!tenantSection || !tenantSection.hidden) {
        document.getElementById('tenantName').value  = 'Jane Smith';
        document.getElementById('tenantEmail').value = 'jane@example.com';
        document.getElementById('tenantPhone').value = '(555) 012-3456';
      }

      // Access & availability
      document.getElementById('permissionToEnter').value = 'Yes';
      document.getElementById('bestTime').value = 'Morning';

      // Preferred days
      var dayValues = ['Mon', 'Wed', 'Fri'];
      document.querySelectorAll('.day-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', dayValues.indexOf(b.dataset.value) !== -1 ? 'true' : 'false');
      });
      document.getElementById('preferredDays').value = dayValues.join(', ');

      // Short delay then show success
      btn.disabled = true;
      btn.textContent = 'Submitting…';
      setTimeout(function () {
        showSuccess('https://drive.google.com/drive/folders/demo-folder-id');
        btn.disabled = false;
        btn.textContent = '⚡ Fill & Submit (testing)';
      }, 900);
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
      document.getElementById('statusCardSubmitted').textContent    = submitted;
      document.getElementById('statusCardProperty').textContent     = data.property    || '—';
      document.getElementById('statusCardProblemType').textContent  = data.problemType || '—';
      document.getElementById('statusCardTenant').textContent       = data.tenantName  || '—';

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
    initAccessCodeGate();
    initUrgencyControl();
    initDaysControl();
    initForm();
    initTestFillBtn();
    initStatusChecker();
    tryRestoreSession();
  });
})();
