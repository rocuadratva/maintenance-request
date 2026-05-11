// DEV: Test fill buttons — remove before going live
(function () {
  var TEST_CASES = [
    {
      urgency:          'urgent',
      problemType:      'Plumbing – Leak or drip',
      locationInUnit:   'Kitchen',
      description:      'Burst pipe under the kitchen sink is actively leaking. Water is pooling on the cabinet floor and starting to spread. Needs immediate attention before more damage occurs.',
      tenantName:       'John Tenant',
      tenantEmail:      'john@test.com',
      tenantPhone:      '(555) 111-2222',
      recurringIssue:   'no',
      entryInstructions:'',
      permissionToEnter:'Yes',
      bestTime:         'Morning',
      preferredDays:    ['Mon', 'Tue'],
    },
    {
      urgency:          'normal',
      problemType:      'Electrical – Outlet not working',
      locationInUnit:   'Master bedroom',
      description:      'The wall outlet next to the bed stopped working. Tried resetting nearby GFCIs but the breaker keeps tripping whenever I plug in a lamp. Affects two outlets on that wall.',
      tenantName:       'Maria Garcia',
      tenantEmail:      'maria@test.com',
      tenantPhone:      '(555) 333-4444',
      recurringIssue:   'yes',
      entryInstructions:'Please call 30 min before arrival.',
      permissionToEnter:'Only with notice',
      bestTime:         'Afternoon',
      preferredDays:    ['Wed', 'Thu'],
    },
    {
      urgency:          'normal',
      problemType:      'HVAC – No cooling / AC',
      locationInUnit:   'Living room',
      description:      'AC unit runs continuously but the apartment stays at 82°F even when the thermostat is set to 72°F. Filter was replaced last month. Issue started three days ago.',
      tenantName:       'Bob Chen',
      tenantEmail:      'bob@test.com',
      tenantPhone:      '(555) 555-6666',
      recurringIssue:   'no',
      entryInstructions:'Only allowed entry after 5 pm.',
      permissionToEnter:'No',
      bestTime:         'Evening',
      preferredDays:    ['Fri', 'Sat'],
    },
  ];

  function setSelect(id, value) {
    var sel = document.getElementById(id);
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === value) { sel.selectedIndex = i; return; }
    }
  }

  function fillForm(tc) {
    // Urgency
    document.getElementById('urgency').value = tc.urgency;
    document.querySelectorAll('.urgency-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.value === tc.urgency ? 'true' : 'false');
    });
    var urgencySlider = document.getElementById('urgencySlider');
    if (urgencySlider) {
      urgencySlider.className = 'urgency-control__slider' +
        (tc.urgency === 'urgent' ? ' urgency-control__slider--urgent' : '');
    }

    // Problem details
    setSelect('problemType', tc.problemType);
    setSelect('locationInUnit', tc.locationInUnit);

    // Description
    document.getElementById('description').value = tc.description;

    // Tenant info (only if section is visible)
    var tenantSection = document.getElementById('tenantInfoSection');
    if (!tenantSection || !tenantSection.hidden) {
      document.getElementById('tenantName').value  = tc.tenantName;
      document.getElementById('tenantEmail').value = tc.tenantEmail;
      document.getElementById('tenantPhone').value = tc.tenantPhone;
    }

    // Recurring issue
    document.getElementById('recurringIssue').value = tc.recurringIssue;
    document.querySelectorAll('[data-recurring]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.recurring === tc.recurringIssue ? 'true' : 'false');
    });

    // Entry instructions
    document.getElementById('entryInstructions').value = tc.entryInstructions;

    // Access & availability
    setSelect('permissionToEnter', tc.permissionToEnter);
    setSelect('bestTime', tc.bestTime);

    // Preferred days
    document.querySelectorAll('.day-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', tc.preferredDays.indexOf(b.dataset.value) !== -1 ? 'true' : 'false');
    });
    document.getElementById('preferredDays').value = tc.preferredDays.join(', ');
  }

  document.addEventListener('DOMContentLoaded', function () {
    [1, 2, 3].forEach(function (n) {
      var btn = document.getElementById('testFill' + n);
      if (btn) {
        btn.addEventListener('click', function () { fillForm(TEST_CASES[n - 1]); });
      }
    });
  });
})();
