/**
 * ELECTORATE STV - Preferential Electoral & Audit Platform
 * =========================================================
 * Features:
 * - Candidate Department Affiliations & Real-Time Details Editing
 * - Digital Preferential Ballot Paper Entry with Numeric Preference Ranking
 * - Serialized Ballot Box Registry with Search & Audit Verification Slips
 * - Inclusive Gregory Fractional STV Engine with Droop Quota
 */

import { STVElection, Ballot, CandidateStatus } from './stv.js';

// Curated Professional Slate Colors
const SLATE_COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6', '#ef4444',
  '#6366f1', '#84cc16'
];

// Presets using Academic & Institutional Departments
const PRESETS = {
  faculty_senate: {
    name: "University Senate (3 Vacancies · 5 Candidates · 100 Ballots)",
    seats: 3,
    quotaType: "droop",
    candidates: [
      { id: "c1", name: "Dr. Eleanor Vance", dept: "Computer Science", color: SLATE_COLORS[0] },
      { id: "c2", name: "Prof. Robert Martinez", dept: "Physics", color: SLATE_COLORS[1] },
      { id: "c3", name: "Dr. Charlotte Hayes", dept: "Economics", color: SLATE_COLORS[2] },
      { id: "c4", name: "Prof. Diana Chen", dept: "Medicine", color: SLATE_COLORS[3] },
      { id: "c5", name: "Dr. Evan Wright", dept: "Mechanical Eng.", color: SLATE_COLORS[4] },
    ],
    ballotEntries: [
      { serial: "BAL-0001..0024", count: 24, prefs: ["Dr. Eleanor Vance", "Prof. Robert Martinez", "Prof. Diana Chen"] },
      { serial: "BAL-0025..0036", count: 12, prefs: ["Dr. Eleanor Vance", "Prof. Diana Chen", "Prof. Robert Martinez"] },
      { serial: "BAL-0037..0056", count: 20, prefs: ["Prof. Robert Martinez", "Dr. Eleanor Vance", "Prof. Diana Chen"] },
      { serial: "BAL-0057..0074", count: 18, prefs: ["Dr. Charlotte Hayes", "Dr. Evan Wright", "Prof. Diana Chen"] },
      { serial: "BAL-0075..0090", count: 16, prefs: ["Prof. Diana Chen", "Prof. Robert Martinez", "Dr. Charlotte Hayes"] },
      { serial: "BAL-0091..0100", count: 10, prefs: ["Dr. Evan Wright", "Prof. Diana Chen", "Dr. Charlotte Hayes"] },
    ]
  },
  dept_council: {
    name: "Department Council (2 Vacancies · 4 Candidates · 50 Ballots)",
    seats: 2,
    quotaType: "droop",
    candidates: [
      { id: "c1", name: "Dr. Maya Patel", dept: "Data Science", color: SLATE_COLORS[0] },
      { id: "c2", name: "Prof. Liam O'Connor", dept: "Mathematics", color: SLATE_COLORS[1] },
      { id: "c3", name: "Dr. Noah Kim", dept: "Statistics", color: SLATE_COLORS[2] },
      { id: "c4", name: "Prof. Olivia Davis", dept: "Artificial Intelligence", color: SLATE_COLORS[3] },
    ],
    ballotEntries: [
      { serial: "BAL-0001..0018", count: 18, prefs: ["Dr. Maya Patel", "Prof. Liam O'Connor", "Dr. Noah Kim"] },
      { serial: "BAL-0019..0032", count: 14, prefs: ["Prof. Liam O'Connor", "Dr. Maya Patel", "Prof. Olivia Davis"] },
      { serial: "BAL-0033..0042", count: 10, prefs: ["Dr. Noah Kim", "Prof. Liam O'Connor", "Dr. Maya Patel"] },
      { serial: "BAL-0043..0050", count: 8, prefs: ["Prof. Olivia Davis", "Dr. Maya Patel", "Dr. Noah Kim"] },
    ]
  },
  deans_election: {
    name: "Dean Selection (1 Vacancy · 4 Candidates · 45 Ballots - IRV)",
    seats: 1,
    quotaType: "droop",
    candidates: [
      { id: "c1", name: "Dr. Sophia Adams", dept: "College of Science", color: SLATE_COLORS[0] },
      { id: "c2", name: "Prof. Jackson Brooks", dept: "College of Engineering", color: SLATE_COLORS[1] },
      { id: "c3", name: "Dr. Aiden Scott", dept: "College of Business", color: SLATE_COLORS[2] },
      { id: "c4", name: "Prof. Lucas Gray", dept: "School of Law", color: SLATE_COLORS[3] },
    ],
    ballotEntries: [
      { serial: "BAL-0001..0016", count: 16, prefs: ["Dr. Sophia Adams", "Prof. Jackson Brooks", "Dr. Aiden Scott"] },
      { serial: "BAL-0017..0030", count: 14, prefs: ["Prof. Jackson Brooks", "Dr. Sophia Adams", "Prof. Lucas Gray"] },
      { serial: "BAL-0031..0039", count: 9, prefs: ["Dr. Aiden Scott", "Prof. Jackson Brooks", "Dr. Sophia Adams"] },
      { serial: "BAL-0040..0045", count: 6, prefs: ["Prof. Lucas Gray", "Dr. Aiden Scott", "Prof. Jackson Brooks"] },
    ]
  }
};

class STVApp {
  constructor() {
    this.currentPresetKey = 'faculty_senate';
    this.candidates = [];
    this.seats = 3;
    this.quotaType = 'droop';
    this.ballotEntries = [];
    this.compiledBallots = [];

    // Next auto serial number counter
    this.serialCounter = 101;

    // Simulation state
    this.electionResult = null;
    this.currentRoundIdx = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.speedMs = 1500;

    this.cacheDom();
    this.bindEvents();
    this.loadPreset('faculty_senate');
  }

  cacheDom() {
    // Navigation
    this.tabBtnSim = document.getElementById('tab-btn-sim');
    this.tabBtnBallots = document.getElementById('tab-btn-ballots');
    this.tabBtnPrimer = document.getElementById('tab-btn-primer');
    this.viewSim = document.getElementById('view-simulation');
    this.viewBallots = document.getElementById('view-ballots');
    this.viewPrimer = document.getElementById('view-primer');

    this.selectPreset = document.getElementById('select-preset');

    // KPI Displays
    this.kpiTotalVotes = document.getElementById('kpi-total-votes');
    this.kpiTotalBallots = document.getElementById('kpi-total-ballots-count');
    this.kpiQuota = document.getElementById('kpi-quota');
    this.kpiQuotaType = document.getElementById('kpi-quota-type');
    this.kpiSeatsStatus = document.getElementById('kpi-seats-status');
    this.kpiSeatsSubtext = document.getElementById('kpi-seats-subtext');
    this.kpiRoundNum = document.getElementById('kpi-round-num');
    this.kpiTotalRounds = document.getElementById('kpi-total-rounds');

    // Stepper Controls
    this.btnPrev = document.getElementById('btn-prev-round');
    this.btnNext = document.getElementById('btn-next-round');
    this.btnFirst = document.getElementById('btn-first-round');
    this.btnLast = document.getElementById('btn-last-round');
    this.btnPlayPause = document.getElementById('btn-play-pause');
    this.playPauseIcon = document.getElementById('play-pause-icon');
    this.playPauseText = document.getElementById('play-pause-text');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedVal = document.getElementById('speed-val');
    this.btnReset = document.getElementById('btn-reset-election');
    this.roundIndicator = document.getElementById('round-indicator');

    // Visualization elements
    this.candidatesContainer = document.getElementById('candidates-container');
    this.quotaBadgePill = document.getElementById('quota-badge-pill');
    this.exhaustedVotesCount = document.getElementById('exhausted-votes-count');

    // Audit Panel
    this.auditRoundChip = document.getElementById('audit-round-chip');
    this.auditActionTitle = document.getElementById('audit-action-title');
    this.auditActionDesc = document.getElementById('audit-action-desc');
    this.auditActionBanner = document.getElementById('audit-action-banner');
    this.timelineFeed = document.getElementById('timeline-feed');

    // Setup: Vacancy Stepper
    this.inputSeats = document.getElementById('input-seats');
    this.btnSeatMinus = document.getElementById('btn-seat-minus');
    this.btnSeatPlus = document.getElementById('btn-seat-plus');
    this.inputQuotaType = document.getElementById('input-quota-type');

    // Setup: Add Candidate
    this.inputNewCandName = document.getElementById('new-candidate-name');
    this.inputNewCandDept = document.getElementById('new-candidate-dept');
    this.btnAddCandidate = document.getElementById('btn-add-candidate');
    this.candidateRosterList = document.getElementById('candidate-roster-list');
    this.rosterCountLabel = document.getElementById('roster-count-label');
    this.btnSortAz = document.getElementById('btn-sort-az');
    this.btnSortDept = document.getElementById('btn-sort-dept');
    this.btnReverseOrder = document.getElementById('btn-reverse-order');

    // Setup: Digital Ballot Paper Entry
    this.inputBallotSerial = document.getElementById('input-ballot-serial');
    this.btnSerialLabel = document.getElementById('btn-serial-label');
    this.ballotCandidateInputs = document.getElementById('ballot-candidate-inputs');
    this.btnClearBallotForm = document.getElementById('btn-clear-ballot-form');
    this.btnRecordBallot = document.getElementById('btn-record-ballot');
    this.ballotValidationWarning = document.getElementById('ballot-validation-warning');
    this.ballotValidationWarningText = document.getElementById('ballot-validation-warning-text');

    // Setup: Serialized Registry Table & Search
    this.searchBallotInput = document.getElementById('search-ballot-input');
    this.btnClearSearch = document.getElementById('btn-clear-search');
    this.ballotTableBody = document.getElementById('ballot-table-body');
    this.ballotBoxTotalPill = document.getElementById('ballot-box-total-pill');
    this.btnToggleRawEditor = document.getElementById('btn-toggle-raw-editor');
    this.rawEditorContainer = document.getElementById('raw-editor-container');
    this.textareaBallots = document.getElementById('textarea-ballots');
    this.btnApplyRaw = document.getElementById('btn-apply-raw');
    this.btnExportJson = document.getElementById('btn-export-json');

    // Edit Candidate Modal
    this.modalEditCandidate = document.getElementById('modal-edit-candidate');
    this.editCandidateId = document.getElementById('edit-candidate-id');
    this.editCandidateName = document.getElementById('edit-candidate-name');
    this.editCandidateDept = document.getElementById('edit-candidate-dept');
    this.btnCloseEditModal = document.getElementById('btn-close-edit-modal');
    this.btnCancelEditCandidate = document.getElementById('btn-cancel-edit-candidate');
    this.btnSaveEditCandidate = document.getElementById('btn-save-edit-candidate');

    // Audit Ballot Slip Modal
    this.modalAuditBallot = document.getElementById('modal-audit-ballot');
    this.ballotAuditSlipContent = document.getElementById('ballot-audit-slip-content');
    this.btnCloseAuditModal = document.getElementById('btn-close-audit-modal');

    // Main Actions & Theme
    this.btnRunCustom = document.getElementById('btn-run-custom-election');
    this.btnClearAllBallots = document.getElementById('btn-clear-all-ballots');
    this.btnLoadSample = document.getElementById('btn-load-sample');
    this.btnToggleTheme = document.getElementById('btn-toggle-theme');
    this.themeIcon = document.getElementById('theme-icon');
    this.appToast = document.getElementById('app-toast');
  }

  bindEvents() {
    // Navigation Tabs
    this.tabBtnSim.addEventListener('click', () => this.switchTab('sim'));
    this.tabBtnBallots.addEventListener('click', () => this.switchTab('ballots'));
    this.tabBtnPrimer.addEventListener('click', () => this.switchTab('primer'));

    document.getElementById('link-footer-sim')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab('sim');
    });
    document.getElementById('link-footer-ballots')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab('ballots');
    });
    document.getElementById('link-footer-primer')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab('primer');
    });

    // Preset selector
    this.selectPreset.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'custom') {
        this.switchTab('ballots');
      } else {
        this.loadPreset(val);
      }
    });

    // Stepper Controls
    this.btnPrev.addEventListener('click', () => this.stepRound(-1));
    this.btnNext.addEventListener('click', () => this.stepRound(1));
    this.btnFirst.addEventListener('click', () => this.jumpToRound(0));
    this.btnLast.addEventListener('click', () => this.jumpToRound(this.electionResult.rounds.length - 1));
    this.btnReset.addEventListener('click', () => this.jumpToRound(0));

    // Auto Play / Pause
    this.btnPlayPause.addEventListener('click', () => this.togglePlay());

    // Speed Slider
    this.speedSlider.addEventListener('input', (e) => {
      this.speedMs = Number(e.target.value);
      this.speedVal.textContent = `${(this.speedMs / 1000).toFixed(1)}s`;
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });

    // Vacancy Stepper
    this.btnSeatMinus.addEventListener('click', () => this.adjustSeats(-1));
    this.btnSeatPlus.addEventListener('click', () => this.adjustSeats(1));
    this.inputQuotaType.addEventListener('change', (e) => {
      this.quotaType = e.target.value;
    });

    // Candidate Add
    this.btnAddCandidate.addEventListener('click', () => this.addCandidateFromInputs());
    this.inputNewCandName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addCandidateFromInputs();
    });
    this.inputNewCandDept.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addCandidateFromInputs();
    });

    // Candidate Sequence Sorting Controls
    this.btnSortAz?.addEventListener('click', () => this.sortCandidatesAlphabetical());
    this.btnSortDept?.addEventListener('click', () => this.sortCandidatesByDepartment());
    this.btnReverseOrder?.addEventListener('click', () => this.reverseCandidateOrder());

    // Candidate Edit Modal Actions
    this.btnCloseEditModal.addEventListener('click', () => this.closeEditCandidateModal());
    this.btnCancelEditCandidate.addEventListener('click', () => this.closeEditCandidateModal());
    this.btnSaveEditCandidate.addEventListener('click', () => this.saveCandidateEdits());

    // Digital Ballot Paper Actions
    this.btnClearBallotForm.addEventListener('click', () => this.clearBallotPaperForm());
    this.btnRecordBallot.addEventListener('click', () => this.recordBallotFromPaper());
    this.inputBallotSerial.addEventListener('input', () => this.updateSerialButtonLabel());

    // Ballot Search & Registry Filter
    this.searchBallotInput.addEventListener('input', () => this.renderBallotTable());
    this.btnClearSearch.addEventListener('click', () => {
      this.searchBallotInput.value = '';
      this.renderBallotTable();
    });

    // Audit Slip Modal Close
    this.btnCloseAuditModal.addEventListener('click', () => this.closeAuditModal());
    this.modalAuditBallot.addEventListener('click', (e) => {
      if (e.target === this.modalAuditBallot) this.closeAuditModal();
    });

    // Raw text editor toggle
    this.btnToggleRawEditor.addEventListener('click', () => {
      const isHidden = this.rawEditorContainer.style.display === 'none';
      this.rawEditorContainer.style.display = isHidden ? 'block' : 'none';
      this.btnToggleRawEditor.textContent = isHidden ? 'Hide Raw Export & Import' : 'Show / Hide Raw Export & Import';
    });
    this.btnApplyRaw.addEventListener('click', () => this.parseRawTextarea());
    this.btnExportJson.addEventListener('click', () => this.exportJson());

    // Run, Clear, & Load Sample Actions
    this.btnRunCustom.addEventListener('click', () => this.runTallyFromCurrentSetup());
    this.btnClearAllBallots?.addEventListener('click', () => this.clearAllBallots());
    this.btnLoadSample?.addEventListener('click', () => this.loadSampleData());

    // Theme Toggle
    this.btnToggleTheme.addEventListener('click', () => this.toggleTheme());
  }

  switchTab(tab) {
    this.tabBtnSim.classList.toggle('active', tab === 'sim');
    this.tabBtnBallots.classList.toggle('active', tab === 'ballots');
    this.tabBtnPrimer.classList.toggle('active', tab === 'primer');

    this.viewSim.style.display = tab === 'sim' ? 'block' : 'none';
    this.viewBallots.style.display = tab === 'ballots' ? 'block' : 'none';
    this.viewPrimer.style.display = tab === 'primer' ? 'block' : 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadPreset(presetKey) {
    let preset = PRESETS[presetKey];
    if (!preset) {
      presetKey = 'faculty_senate';
      preset = PRESETS[presetKey];
    }
    this.currentPresetKey = presetKey;
    this.selectPreset.value = presetKey;

    this.seats = preset.seats;
    this.quotaType = preset.quotaType;
    this.candidates = preset.candidates.map(c => ({ ...c }));

    let sIdx = 1;
    this.ballotEntries = [];
    preset.ballotEntries.forEach(be => {
      for (let i = 0; i < be.count; i++) {
        const serial = `BAL-${String(sIdx).padStart(4, '0')}`;
        this.ballotEntries.push({
          serial,
          count: 1,
          prefs: [...be.prefs],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        sIdx++;
      }
    });

    this.inputSeats.value = this.seats;
    this.inputQuotaType.value = this.quotaType;
    this.serialCounter = sIdx;
    this.inputBallotSerial.value = `BAL-${String(this.serialCounter).padStart(4, '0')}`;
    this.updateSerialButtonLabel();

    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.renderBallotTable();
    this.syncRawTextarea();
    this.runTallyFromCurrentSetup(false);
  }

  updateSerialButtonLabel() {
    if (this.btnSerialLabel) {
      this.btnSerialLabel.textContent = this.inputBallotSerial.value.trim() || `BAL-${String(this.serialCounter).padStart(4, '0')}`;
    }
  }

  adjustSeats(delta) {
    const nextVal = this.seats + delta;
    if (nextVal >= 1 && nextVal < this.candidates.length) {
      this.seats = nextVal;
      this.inputSeats.value = this.seats;
      this.selectPreset.value = 'custom';
    }
  }

  showToast(message, type = 'success') {
    const toast = this.appToast || document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `app-toast visible ${type}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  clearAllBallots() {
    if (this.ballotEntries.length === 0) {
      this.showToast("Ballot box is already empty.", "info");
      return;
    }
    this.ballotEntries = [];
    this.compiledBallots = [];
    this.serialCounter = 1;
    this.inputBallotSerial.value = "BAL-0001";
    this.updateSerialButtonLabel();
    this.clearBallotPaperForm();
    this.selectPreset.value = 'custom';
    this.renderBallotTable();
    this.syncRawTextarea();

    // Reset KPI displays
    this.kpiTotalVotes.textContent = "0.00";
    this.kpiTotalBallots.textContent = "0 verified ballots cast";
    this.kpiSeatsStatus.textContent = `0 / ${this.seats} Filled`;

    this.showToast("🗑️ All ballots cleared (0 ballots). Ready for new manual entry.", "info");

    const firstInput = this.ballotCandidateInputs.querySelector('.rank-box-input');
    if (firstInput) firstInput.focus();
  }

  // =========================================================================
  // CANDIDATE MANAGEMENT (NAME & DEPARTMENT WITH EDITING)
  // =========================================================================

  addCandidateFromInputs() {
    const name = this.inputNewCandName.value.trim();
    const dept = this.inputNewCandDept.value.trim();

    if (!name) {
      this.inputNewCandName.focus();
      return;
    }

    if (this.candidates.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert(`Candidate '${name}' is already registered in this election.`);
      return;
    }

    const nextColor = SLATE_COLORS[this.candidates.length % SLATE_COLORS.length];
    const newId = `c-${Date.now()}`;
    this.candidates.push({
      id: newId,
      name,
      dept: dept || "General Faculty",
      color: nextColor
    });

    this.inputNewCandName.value = '';
    this.inputNewCandDept.value = '';
    this.selectPreset.value = 'custom';

    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.inputNewCandName.focus();
  }

  openEditCandidateModal(candId) {
    const cand = this.candidates.find(c => c.id === candId);
    if (!cand) return;

    this.editCandidateId.value = cand.id;
    this.editCandidateName.value = cand.name;
    this.editCandidateDept.value = cand.dept;
    this.modalEditCandidate.classList.add('open');
    this.editCandidateName.focus();
  }

  closeEditCandidateModal() {
    this.modalEditCandidate.classList.remove('open');
  }

  saveCandidateEdits() {
    const candId = this.editCandidateId.value;
    const newName = this.editCandidateName.value.trim();
    const newDept = this.editCandidateDept.value.trim();

    if (!newName) {
      alert("Candidate name cannot be blank.");
      return;
    }

    const cand = this.candidates.find(c => c.id === candId);
    if (!cand) return;

    const oldName = cand.name;
    cand.name = newName;
    cand.dept = newDept || "General Faculty";

    // Update references in all active ballot entries
    if (oldName !== newName) {
      this.ballotEntries.forEach(entry => {
        entry.prefs = entry.prefs.map(p => p === oldName ? newName : p);
      });
    }

    this.closeEditCandidateModal();
    this.selectPreset.value = 'custom';

    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.renderBallotTable();
    this.syncRawTextarea();
  }

  removeCandidate(candId) {
    if (this.candidates.length <= 2) {
      alert("At least 2 candidates are required for preferential STV election.");
      return;
    }

    const cand = this.candidates.find(c => c.id === candId);
    if (!cand) return;

    const removedName = cand.name;
    this.candidates = this.candidates.filter(c => c.id !== candId);

    // If vacancies exceeds candidates count, adjust vacancies
    if (this.seats >= this.candidates.length) {
      this.seats = Math.max(1, this.candidates.length - 1);
      this.inputSeats.value = this.seats;
    }

    // Remove candidate from all registered ballots
    this.ballotEntries = this.ballotEntries.map(entry => ({
      ...entry,
      prefs: entry.prefs.filter(p => p !== removedName)
    })).filter(entry => entry.prefs.length > 0);

    this.selectPreset.value = 'custom';
    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.renderBallotTable();
    this.syncRawTextarea();
  }

  moveCandidate(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.candidates.length) return;

    const cand = this.candidates[index];
    const [moved] = this.candidates.splice(index, 1);
    this.candidates.splice(targetIndex, 0, moved);

    this.selectPreset.value = 'custom';
    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.showToast(`↕️ Moved "${cand.name}" to ballot line #${targetIndex + 1}.`, 'info');

    // Auto-focus the moved candidate's input for seamless data entry
    const inputs = this.ballotCandidateInputs.querySelectorAll('.rank-box-input');
    if (inputs[targetIndex]) {
      inputs[targetIndex].focus();
      inputs[targetIndex].select();
    }
  }

  sortCandidatesAlphabetical() {
    this.candidates.sort((a, b) => a.name.localeCompare(b.name));
    this.selectPreset.value = 'custom';
    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.showToast('🔤 Candidates sorted alphabetically (A → Z) on ballot paper.', 'success');

    const firstInput = this.ballotCandidateInputs.querySelector('.rank-box-input');
    firstInput?.focus();
    firstInput?.select();
  }

  sortCandidatesByDepartment() {
    this.candidates.sort((a, b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name));
    this.selectPreset.value = 'custom';
    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.showToast('🏛️ Candidates sorted by Department on ballot paper.', 'success');

    const firstInput = this.ballotCandidateInputs.querySelector('.rank-box-input');
    firstInput?.focus();
    firstInput?.select();
  }

  reverseCandidateOrder() {
    this.candidates.reverse();
    this.selectPreset.value = 'custom';
    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.showToast('🔄 Ballot candidate sequence reversed.', 'info');

    const firstInput = this.ballotCandidateInputs.querySelector('.rank-box-input');
    firstInput?.focus();
    firstInput?.select();
  }

  renderCandidateRoster() {
    this.candidateRosterList.innerHTML = '';
    this.rosterCountLabel.textContent = `${this.candidates.length} Candidates Registered`;

    this.candidates.forEach((cand, idx) => {
      const item = document.createElement('div');
      item.className = 'roster-item';
      item.setAttribute('role', 'listitem');

      item.innerHTML = `
        <div class="roster-item-meta">
          <span class="roster-order-badge" title="Ballot Position #${idx + 1}">#${idx + 1}</span>
          <div class="roster-avatar" style="background: ${cand.color};">
            ${cand.name.charAt(0)}
          </div>
          <div>
            <span class="roster-name">${cand.name}</span>
            <span class="roster-dept">${cand.dept}</span>
          </div>
        </div>
        <div class="roster-actions">
          <button type="button" class="btn-roster-action reorder move-up" title="Move Up (Slot #${idx})" aria-label="Move ${cand.name} up" ${idx === 0 ? 'disabled' : ''}>
            ▲
          </button>
          <button type="button" class="btn-roster-action reorder move-down" title="Move Down (Slot #${idx + 2})" aria-label="Move ${cand.name} down" ${idx === this.candidates.length - 1 ? 'disabled' : ''}>
            ▼
          </button>
          <button type="button" class="btn-roster-action edit" title="Edit Candidate Details" aria-label="Edit ${cand.name}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button type="button" class="btn-roster-action delete" title="Remove Candidate" aria-label="Remove ${cand.name}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      `;

      item.querySelector('.move-up')?.addEventListener('click', () => this.moveCandidate(idx, -1));
      item.querySelector('.move-down')?.addEventListener('click', () => this.moveCandidate(idx, 1));
      item.querySelector('.edit').addEventListener('click', () => this.openEditCandidateModal(cand.id));
      item.querySelector('.delete').addEventListener('click', () => this.removeCandidate(cand.id));

      this.candidateRosterList.appendChild(item);
    });
  }

  // =========================================================================
  // DIGITAL PREFERENTIAL BALLOT PAPER ENTRY FORM (NAME 1ST, PREFERENCE RIGHT)
  // =========================================================================

  renderBallotPaperRows() {
    // Preserve any preference marks currently typed by candidate name
    const currentPrefs = new Map();
    if (this.ballotCandidateInputs) {
      this.ballotCandidateInputs.querySelectorAll('.rank-box-input').forEach(inp => {
        const cand = inp.dataset.candidate;
        if (cand && inp.value.trim()) {
          currentPrefs.set(cand, inp.value.trim());
        }
      });
    }

    this.ballotCandidateInputs.innerHTML = '';

    this.candidates.forEach((cand, idx) => {
      const row = document.createElement('div');
      row.className = 'ballot-paper-row';

      const existingVal = currentPrefs.get(cand.name) || '';
      if (existingVal) {
        row.classList.add('marked');
      }

      // Slot number + Up/Down quick shift + Name & Dept on LEFT, Preference Input on RIGHT
      row.innerHTML = `
        <div class="ballot-candidate-info">
          <span class="ballot-cand-order-num" title="Ballot Position #${idx + 1}">${idx + 1}</span>
          <div class="ballot-paper-reorder-btns" aria-label="Reorder candidate position">
            <button type="button" class="btn-ballot-shift shift-up" title="Move ${cand.name} up to slot #${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button type="button" class="btn-ballot-shift shift-down" title="Move ${cand.name} down to slot #${idx + 2}" ${idx === this.candidates.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
          <div class="roster-avatar" style="background: ${cand.color}; width: 32px; height: 32px; font-size: 0.825rem;">
            ${cand.name.charAt(0)}
          </div>
          <div>
            <div class="ballot-cand-name">${cand.name}</div>
            <div class="ballot-cand-dept">${cand.dept}</div>
          </div>
        </div>
        <div class="ballot-rank-input-wrap">
          <input 
            type="number" 
            class="rank-box-input" 
            min="1" 
            max="${this.candidates.length}" 
            placeholder="—" 
            value="${existingVal}"
            data-candidate="${cand.name}" 
            tabindex="${idx + 1}" 
            aria-label="Preference number for ${cand.name} (Ballot position ${idx + 1})"
          >
        </div>
      `;

      row.querySelector('.shift-up')?.addEventListener('click', () => this.moveCandidate(idx, -1));
      row.querySelector('.shift-down')?.addEventListener('click', () => this.moveCandidate(idx, 1));

      const input = row.querySelector('.rank-box-input');

      // Auto-select value on focus for instant overwrite / speed tabbing
      input.addEventListener('focus', () => {
        input.select();
      });

      // Press Enter to instantly submit and cycle to next ballot
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.recordBallotFromPaper();
        }
      });

      // Real-time validation for duplicate preference numbers
      input.addEventListener('input', () => {
        row.classList.toggle('marked', Boolean(input.value.trim()));
        this.validatePreferencesRealtime();
      });

      this.ballotCandidateInputs.appendChild(row);
    });

    this.validatePreferencesRealtime();
  }

  validatePreferencesRealtime() {
    const inputs = Array.from(this.ballotCandidateInputs.querySelectorAll('.rank-box-input'));
    const rankMap = new Map(); // rank -> array of inputs

    inputs.forEach(inp => {
      inp.classList.remove('has-duplicate');
      inp.closest('.ballot-paper-row')?.classList.remove('has-duplicate-row');
      const val = inp.value.trim();
      if (val) {
        const rank = parseInt(val, 10);
        if (!isNaN(rank)) {
          if (!rankMap.has(rank)) rankMap.set(rank, []);
          rankMap.get(rank).push(inp);
        }
      }
    });

    const duplicates = [];
    rankMap.forEach((inputList, rank) => {
      if (inputList.length > 1) {
        duplicates.push(rank);
        inputList.forEach(inp => {
          inp.classList.add('has-duplicate');
          inp.closest('.ballot-paper-row')?.classList.add('has-duplicate-row');
        });
      }
    });

    if (duplicates.length > 0) {
      if (this.ballotValidationWarningText && this.ballotValidationWarning) {
        this.ballotValidationWarningText.textContent = 
          `Duplicate preference number '${duplicates.join(', ')}' detected! Each candidate must have a unique preference number.`;
        this.ballotValidationWarning.style.display = 'flex';
        this.ballotValidationWarning.classList.add('visible');
      }
      return false;
    } else {
      if (this.ballotValidationWarning) {
        this.ballotValidationWarning.style.display = 'none';
        this.ballotValidationWarning.classList.remove('visible');
      }
      return true;
    }
  }

  clearBallotPaperForm() {
    const inputs = this.ballotCandidateInputs.querySelectorAll('.rank-box-input');
    inputs.forEach(inp => {
      inp.value = '';
      inp.classList.remove('has-duplicate');
    });
    const rows = this.ballotCandidateInputs.querySelectorAll('.ballot-paper-row');
    rows.forEach(r => {
      r.classList.remove('marked');
      r.classList.remove('has-duplicate-row');
    });
    if (this.ballotValidationWarning) {
      this.ballotValidationWarning.style.display = 'none';
      this.ballotValidationWarning.classList.remove('visible');
    }
  }

  recordBallotFromPaper() {
    // 1. Validate for duplicates first
    const isValid = this.validatePreferencesRealtime();
    if (!isValid) {
      alert("Error: Duplicate preference numbers detected on this ballot paper! Each candidate must have a unique rank (no repeats allowed).");
      return;
    }

    const inputs = Array.from(this.ballotCandidateInputs.querySelectorAll('.rank-box-input'));
    const marked = [];

    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) {
        const rank = parseInt(val, 10);
        const candName = inp.getAttribute('data-candidate');
        if (!isNaN(rank) && rank > 0) {
          marked.push({ rank, candName });
        }
      }
    });

    if (marked.length === 0) {
      alert("Please mark at least one candidate preference number (1, 2, 3...) in the ballot paper boxes.");
      const firstInput = this.ballotCandidateInputs.querySelector('.rank-box-input');
      if (firstInput) firstInput.focus();
      return;
    }

    // Sort by marked preference order (1st, 2nd, 3rd...)
    marked.sort((a, b) => a.rank - b.rank);
    const orderedPrefs = marked.map(m => m.candName);

    // Each entry is exactly ONE physical ballot slip
    let serial = this.inputBallotSerial.value.trim();
    if (!serial) {
      serial = `BAL-${String(this.serialCounter).padStart(4, '0')}`;
    }

    // Add entry to registry
    this.ballotEntries.push({
      serial,
      count: 1,
      prefs: orderedPrefs,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    // Auto increment serial counter for next slip
    this.serialCounter++;
    this.inputBallotSerial.value = `BAL-${String(this.serialCounter).padStart(4, '0')}`;
    this.updateSerialButtonLabel();

    this.clearBallotPaperForm();
    this.selectPreset.value = 'custom';
    this.renderBallotTable();
    this.syncRawTextarea();

    // Confirmation feedback
    this.showQuickFeedback(`Ballot ${serial} recorded`);

    // Auto-focus first candidate's input for high-speed sequential data entry
    const firstInput = this.ballotCandidateInputs.querySelector('.rank-box-input');
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
    }
  }

  showQuickFeedback(msg) {
    const pill = this.ballotBoxTotalPill;
    const oldBg = pill.style.backgroundColor;
    pill.textContent = `✓ ${msg}`;
    pill.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
    setTimeout(() => {
      this.renderBallotTable();
      pill.style.backgroundColor = oldBg;
    }, 1800);
  }

  // =========================================================================
  // SERIALIZED BALLOT REGISTRY TABLE & AUDIT SLIP
  // =========================================================================

  renderBallotTable() {
    this.ballotTableBody.innerHTML = '';
    const query = this.searchBallotInput.value.trim().toLowerCase();
    let totalBallots = 0;

    if (this.ballotEntries.length === 0) {
      this.ballotBoxTotalPill.textContent = '0 Total Ballots';
      const emptyTr = document.createElement('tr');
      emptyTr.innerHTML = `
        <td colspan="3" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🗳️</div>
          <div style="font-weight: 600; color: var(--text-secondary); font-size: 1rem; margin-bottom: 0.25rem;">Ballot Box is Empty (0 Ballots)</div>
          <div style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1rem;">Mark physical rankings in the Ballot Paper form above, or load sample election data below.</div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-empty-load-sample" style="display: inline-flex; align-items: center; gap: 0.4rem; margin: 0 auto;">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Load Sample Election (100 Ballots)
          </button>
        </td>
      `;
      emptyTr.querySelector('#btn-empty-load-sample')?.addEventListener('click', () => {
        this.loadSampleData();
      });
      this.ballotTableBody.appendChild(emptyTr);
      return;
    }

    this.ballotEntries.forEach((entry, idx) => {
      totalBallots += entry.count;

      // Filter by search query (checks serial or candidate names)
      if (query) {
        const matchesSerial = entry.serial.toLowerCase().includes(query);
        const matchesCandidate = entry.prefs.some(p => p.toLowerCase().includes(query));
        if (!matchesSerial && !matchesCandidate) return;
      }

      const tr = document.createElement('tr');

      const prefChainHtml = entry.prefs
        .map((p, i) => `<strong>${i + 1}.</strong> ${p}`)
        .join(' <span style="color: var(--text-muted);">&rarr;</span> ');

      tr.innerHTML = `
        <td><span class="serial-tag">${entry.serial}</span></td>
        <td>${prefChainHtml}</td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-secondary btn-sm btn-audit-row" style="padding: 0.25rem 0.55rem; font-size: 0.75rem;" title="Audit Verification Slip">
            Verify
          </button>
          <button type="button" class="btn-roster-action delete btn-delete-row" title="Delete ballot entry" aria-label="Delete entry" style="display: inline-flex; vertical-align: middle; margin-left: 0.25rem;">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </td>
      `;

      tr.querySelector('.btn-audit-row').addEventListener('click', () => {
        this.openAuditSlipModal(entry);
      });

      tr.querySelector('.btn-delete-row').addEventListener('click', () => {
        this.ballotEntries.splice(idx, 1);
        this.selectPreset.value = 'custom';
        this.renderBallotTable();
        this.syncRawTextarea();
      });

      this.ballotTableBody.appendChild(tr);
    });

    this.ballotBoxTotalPill.textContent = `${totalBallots} Total Ballots`;
  }

  openAuditSlipModal(entry) {
    this.ballotAuditSlipContent.innerHTML = `
      <div class="audit-slip-box">
        <div class="audit-slip-header">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Ballot Identifier</div>
            <div class="audit-slip-serial">${entry.serial}</div>
          </div>
          <div style="text-align: right;">
            <span class="status-tag hopeful">Verified Entry</span>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Time: ${entry.timestamp || 'Recorded'}</div>
          </div>
        </div>

        <div style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-secondary);">
          <strong>Voter Slip Count:</strong> ${entry.count} ballot(s) registered with this exact marked preference order.
        </div>

        <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.4rem;">
          Physical Preference Marks Entered:
        </div>

        <div class="audit-pref-list">
          ${entry.prefs.map((candName, idx) => {
            const candObj = this.candidates.find(c => c.name === candName);
            const dept = candObj ? candObj.dept : "Department";
            return `
              <div class="audit-pref-item">
                <div class="audit-rank-number">${idx + 1}</div>
                <div style="flex: 1;">
                  <strong style="color: var(--text-primary); font-size: 0.9rem;">${candName}</strong>
                  <span style="font-size: 0.75rem; color: var(--accent-cyan); margin-left: 0.4rem;">(${dept})</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-xs); border: 1px solid var(--border-subtle); font-size: 0.78rem; color: var(--text-muted); margin-top: 1rem;">
          <strong>Scrutineer Verification Note:</strong> This record matches physical ballot slip <code>${entry.serial}</code>. During the preferential count, this ballot's weight transfers sequentially to each remaining active candidate listed above.
        </div>
      </div>
    `;

    this.modalAuditBallot.classList.add('open');
  }

  closeAuditModal() {
    this.modalAuditBallot.classList.remove('open');
  }

  syncRawTextarea() {
    const lines = this.ballotEntries.map(b => `${b.count} : ${b.prefs.join(' > ')}`);
    this.textareaBallots.value = lines.join('\n');
  }

  parseRawTextarea() {
    const text = this.textareaBallots.value;
    const lines = text.split('\n');
    const newEntries = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        const count = parseInt(parts[0].trim(), 10) || 1;
        const prefs = parts[1].split('>').map(s => s.trim()).filter(Boolean);
        if (prefs.length > 0) {
          newEntries.push({
            serial: `RAW-${String(idx + 1).padStart(4, '0')}`,
            count,
            prefs,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
    });

    if (newEntries.length === 0) {
      alert("No valid ballots found in raw text.");
      return;
    }

    this.ballotEntries = newEntries;
    this.selectPreset.value = 'custom';
    this.renderBallotTable();
    alert("Raw ballot data applied successfully to registry.");
  }

  // =========================================================================
  // EXECUTE ELECTION & TALLY COUNT
  // =========================================================================

  runTallyFromCurrentSetup(switchToSim = true) {
    if (this.candidates.length < 2) {
      if (switchToSim) {
        this.showToast("At least 2 candidates are required to conduct an election.", "warning");
      }
      return;
    }
    if (this.seats < 1 || this.seats >= this.candidates.length) {
      if (switchToSim) {
        this.showToast(`Vacancies (${this.seats}) must be between 1 and ${this.candidates.length - 1}.`, "warning");
      }
      return;
    }
    if (this.ballotEntries.length === 0) {
      if (switchToSim) {
        this.showToast("Ballot box is empty. Enter physical ballots above or click 'Load Sample Data'.", "warning");
      }
      return;
    }

    // Compile into Ballot instances with serial tracking
    const ballots = [];
    this.ballotEntries.forEach((entry, eIdx) => {
      for (let i = 0; i < entry.count; i++) {
        const slipId = entry.count === 1 ? entry.serial : `${entry.serial}#${i + 1}`;
        ballots.push(new Ballot(entry.prefs, 1.0, slipId));
      }
    });

    this.compiledBallots = ballots;

    try {
      const candNames = this.candidates.map(c => c.name);
      const stv = new STVElection(candNames, this.seats, this.quotaType);
      this.electionResult = stv.count(this.compiledBallots);
      this.currentRoundIdx = 0;
      this.pause();
      this.render();

      if (switchToSim) {
        this.switchTab('sim');
      }
    } catch (err) {
      alert(`Election count error: ${err.message}`);
    }
  }

  // =========================================================================
  // SIMULATION RENDERING & STEPPER
  // =========================================================================

  stepRound(delta) {
    if (!this.electionResult) return;
    const maxIdx = this.electionResult.rounds.length - 1;
    const nextIdx = this.currentRoundIdx + delta;
    if (nextIdx >= 0 && nextIdx <= maxIdx) {
      this.currentRoundIdx = nextIdx;
      this.render();
    }
  }

  jumpToRound(idx) {
    if (!this.electionResult) return;
    this.currentRoundIdx = Math.max(0, Math.min(idx, this.electionResult.rounds.length - 1));
    this.render();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    this.playPauseIcon.textContent = '⏸';
    this.playPauseText.textContent = 'Pause';
    this.playTimer = setInterval(() => {
      const maxIdx = this.electionResult.rounds.length - 1;
      if (this.currentRoundIdx < maxIdx) {
        this.currentRoundIdx++;
        this.render();
      } else {
        this.pause();
      }
    }, this.speedMs);
  }

  pause() {
    this.isPlaying = false;
    this.playPauseIcon.textContent = '▶';
    this.playPauseText.textContent = 'Auto Play';
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  render() {
    if (!this.electionResult) return;

    const round = this.electionResult.rounds[this.currentRoundIdx];
    const totalRounds = this.electionResult.rounds.length;
    const quota = this.electionResult.quota;
    const totalVotes = this.electionResult.totalValidVotes;

    // KPI Metrics
    this.kpiTotalVotes.textContent = totalVotes.toFixed(2);
    this.kpiTotalBallots.textContent = `${this.compiledBallots.length} verified ballots cast`;
    this.kpiQuota.textContent = quota.toFixed(2);
    this.kpiQuotaType.textContent = this.quotaType === 'droop' 
      ? `Droop Quota: ⌊Votes / (${this.seats} + 1)⌋ + 1` 
      : `Hare Quota: Votes / ${this.seats}`;

    const currentlyElected = Object.entries(round.candidateStatus)
      .filter(([_, st]) => st === CandidateStatus.ELECTED)
      .map(([cand]) => cand);

    this.kpiSeatsStatus.textContent = `${currentlyElected.length} / ${this.seats} Filled`;
    this.kpiSeatsSubtext = `${this.seats - currentlyElected.length} vacancies remaining`;

    this.kpiRoundNum.textContent = `Round ${round.roundNumber}`;
    this.kpiTotalRounds.textContent = `of ${totalRounds} total count rounds`;

    // Stepper Controls
    this.roundIndicator.textContent = `Round ${round.roundNumber} of ${totalRounds}`;
    this.btnPrev.disabled = this.currentRoundIdx === 0;
    this.btnFirst.disabled = this.currentRoundIdx === 0;
    this.btnNext.disabled = this.currentRoundIdx === totalRounds - 1;
    this.btnLast.disabled = this.currentRoundIdx === totalRounds - 1;

    this.quotaBadgePill.textContent = `★ Winning Quota: ${quota.toFixed(4)} Votes`;

    // Candidate Standings Cards
    this.renderCandidateCards(round, quota);

    // Exhausted Box
    const exhaustedPct = totalVotes > 0 ? (round.exhaustedVotes / totalVotes) * 100 : 0;
    this.exhaustedVotesCount.textContent = `${round.exhaustedVotes.toFixed(4)} votes (${exhaustedPct.toFixed(1)}%)`;

    // Audit narrative & timeline
    this.renderAuditPanel(round);
    this.renderTimeline();
  }

  renderCandidateCards(round, quota) {
    this.candidatesContainer.innerHTML = '';

    const sorted = [...this.candidates].sort((a, b) => {
      const stA = round.candidateStatus[a.name];
      const stB = round.candidateStatus[b.name];
      const vA = round.tallies[a.name] || 0;
      const vB = round.tallies[b.name] || 0;

      if (stA === CandidateStatus.ELECTED && stB !== CandidateStatus.ELECTED) return -1;
      if (stB === CandidateStatus.ELECTED && stA !== CandidateStatus.ELECTED) return 1;
      if (stA === CandidateStatus.ELIMINATED && stB !== CandidateStatus.ELIMINATED) return 1;
      if (stB === CandidateStatus.ELIMINATED && stA !== CandidateStatus.ELIMINATED) return -1;
      return vB - vA;
    });

    const maxVal = Math.max(quota * 1.3, ...Object.values(round.tallies));

    sorted.forEach(cand => {
      const status = round.candidateStatus[cand.name];
      const votes = round.tallies[cand.name] || 0;
      const pctOfQuota = quota > 0 ? (votes / quota) * 100 : 0;
      const barWidthPct = Math.min(100, Math.max(0, (votes / maxVal) * 100));
      const quotaMarkerPct = Math.min(100, (quota / maxVal) * 100);

      const card = document.createElement('div');
      card.className = `candidate-card status-${status.toLowerCase()}`;
      card.setAttribute('role', 'listitem');

      let statusBadgeClass = 'hopeful';
      let statusBadgeText = 'Hopeful';
      if (status === CandidateStatus.ELECTED) {
        statusBadgeClass = 'elected';
        const seatNum = this.electionResult.electedCandidates.indexOf(cand.name) + 1;
        statusBadgeText = `✓ Elected (Seat #${seatNum})`;
      } else if (status === CandidateStatus.ELIMINATED) {
        statusBadgeClass = 'eliminated';
        statusBadgeText = '✗ Eliminated';
      }

      card.innerHTML = `
        <div class="candidate-header">
          <div class="candidate-meta">
            <div class="candidate-avatar" style="background: ${cand.color};">
              ${cand.name.charAt(0)}
            </div>
            <div>
              <div class="candidate-name">${cand.name}</div>
              <div class="candidate-dept-label">Dept: ${cand.dept}</div>
            </div>
          </div>
          <span class="status-tag ${statusBadgeClass}">${statusBadgeText}</span>
        </div>

        <div class="tally-bar-wrapper">
          <div class="tally-quota-line" style="left: ${quotaMarkerPct}%;" title="Winning Quota (${quota.toFixed(2)})"></div>
          <div class="tally-bar-fill" style="width: ${barWidthPct}%; background: ${status === CandidateStatus.ELECTED ? '' : cand.color};"></div>
        </div>

        <div class="candidate-stats">
          <div>
            <span class="vote-count-highlight">${votes.toFixed(4)}</span> votes
          </div>
          <div>
            <span>${pctOfQuota.toFixed(1)}%</span> of Quota
          </div>
        </div>
      `;

      this.candidatesContainer.appendChild(card);
    });
  }

  renderAuditPanel(round) {
    this.auditRoundChip.textContent = `Round ${round.roundNumber}`;
    this.auditActionBanner.className = 'audit-action-banner';

    if (round.actionType === 'ELECT_SURPLUS') {
      this.auditActionBanner.classList.add('elected');
      this.auditActionTitle.textContent = `🎉 Candidate Elected with Surplus`;
    } else if (round.actionType === 'ELECT_NO_SURPLUS' || round.actionType === 'AUTO_ELECT') {
      this.auditActionBanner.classList.add('elected');
      this.auditActionTitle.textContent = `✓ Vacancy Filled`;
    } else if (round.actionType === 'ELIMINATE') {
      this.auditActionBanner.classList.add('eliminated');
      this.auditActionTitle.textContent = `✗ Candidate Eliminated`;
    } else {
      this.auditActionTitle.textContent = `Round ${round.roundNumber} Summary`;
    }

    this.auditActionDesc.textContent = round.actionDescription;
  }

  renderTimeline() {
    this.timelineFeed.innerHTML = '';
    this.electionResult.rounds.forEach((r, idx) => {
      const item = document.createElement('div');
      item.className = `timeline-item ${idx === this.currentRoundIdx ? 'active' : ''}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      let icon = 'ℹ️';
      if (r.actionType.includes('ELECT')) icon = '🎉';
      if (r.actionType === 'ELIMINATE') icon = '✗';

      item.innerHTML = `
        <div class="timeline-item-header">
          <span class="timeline-round-tag">${icon} Round ${r.roundNumber}</span>
          <small style="color: var(--text-muted);">${r.actionType.replace('_', ' ')}</small>
        </div>
        <div class="timeline-item-desc">${r.actionDescription}</div>
      `;

      item.addEventListener('click', () => {
        this.currentRoundIdx = idx;
        this.render();
      });

      this.timelineFeed.appendChild(item);
    });
  }

  clearAllBallots() {
    this.ballotEntries = [];
    this.serialCounter = 1;
    this.inputBallotSerial.value = `BAL-${String(this.serialCounter).padStart(4, '0')}`;
    this.updateSerialButtonLabel();
    this.clearBallotPaperForm();
    this.renderBallotTable();
    this.syncRawTextarea();

    // Reset simulation metrics & compiled state
    this.compiledBallots = [];
    this.electionResult = null;
    this.kpiTotalVotes.textContent = '0.00';
    this.kpiTotalBallots.textContent = '0 verified ballots cast';
    this.kpiSeatsStatus.textContent = `0 / ${this.seats} Filled`;
    this.kpiRoundNum.textContent = 'Round 0';
    this.kpiTotalRounds.textContent = 'Awaiting ballot entry';
    this.roundIndicator.textContent = 'No Tally Computed';
    this.ballotBoxTotalPill.textContent = '0 Total Ballots';

    if (this.candidatesContainer) {
      this.candidatesContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🗳️</div>
          <div style="font-weight: 700; color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 0.35rem;">Ballot Box Reset to 0 Ballots</div>
          <div style="font-size: 0.85rem; max-width: 400px; margin: 0 auto 1.25rem;">The ballot box is currently empty. Record physical paper ballots in the Ballot Entry tab, or load sample election data below.</div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-sim-load-sample" style="display: inline-flex; align-items: center; gap: 0.4rem; margin: 0 auto;">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Load Sample Election (100 Ballots)
          </button>
        </div>
      `;
      this.candidatesContainer.querySelector('#btn-sim-load-sample')?.addEventListener('click', () => {
        this.loadSampleData();
      });
    }

    this.showToast('🗑️ Ballot box emptied. All ballots reset to 0. Serial number reset to BAL-0001.', 'info');
  }

  loadSampleData(presetKey = 'faculty_senate') {
    this.loadPreset(presetKey);
    this.showToast(`📋 Sample election data loaded (${this.ballotEntries.length} ballots, ${this.candidates.length} candidates).`, 'success');
  }

  showToast(message, type = 'info') {
    if (!this.appToast) {
      this.appToast = document.getElementById('app-toast');
    }
    if (!this.appToast) return;

    this.appToast.textContent = message;
    this.appToast.className = `app-toast visible ${type}`;

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.appToast.className = 'app-toast';
    }, 3800);
  }

  exportJson() {
    if (!this.electionResult) return;
    const data = {
      timestamp: new Date().toISOString(),
      candidates: this.candidates,
      seats: this.seats,
      quotaType: this.quotaType,
      quota: this.electionResult.quota,
      totalValidVotes: this.electionResult.totalValidVotes,
      ballotEntries: this.ballotEntries,
      electedCandidates: this.electionResult.electedCandidates,
      rounds: this.electionResult.rounds,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stv_election_registry_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  toggleTheme() {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    this.themeIcon.textContent = nextTheme === 'dark' ? '🌙' : '☀️';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new STVApp();
});
