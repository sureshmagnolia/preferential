/**
 * ELECTORATE STV - Preferential Electoral & Audit Platform
 * =========================================================
 * Integrated System:
 * - Returning Officer Password Protection & Role Separation
 * - Public Nominal Electoral Rolls Directory & CSV Management
 * - Candidate Statutory Nomination Portal & Printable Form Papers
 * - Inclusive Gregory Fractional STV Engine with Droop Quota
 * - Demonstrative Step-by-Step Live Observer Commentary & Speech Synthesizer
 * - Official Return of Election Declaration Certificate Generator
 */

import { STVElection, Ballot, CandidateStatus } from './stv.js';
import { AuthService } from './auth.js';
import { NominalRollService } from './nominal.js';
import { NominationService } from './nomination.js';

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
    // Services
    this.authService = new AuthService();
    this.nominalService = new NominalRollService();
    this.nominationService = new NominationService();

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
    this.currentSubstepIdx = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.speedMs = 1500;

    // Voice Announcer
    this.voiceEnabled = false;

    this.cacheDom();
    this.bindEvents();
    this.updateAuthUi();
    this.initNominalRollUi();
    this.initNominationUi();
    this.loadPreset('faculty_senate');
  }

  cacheDom() {
    // Navigation & Views
    this.tabBtnSim = document.getElementById('tab-btn-sim');
    this.tabBtnNominal = document.getElementById('tab-btn-nominal');
    this.tabBtnNomination = document.getElementById('tab-btn-nomination');
    this.tabBtnPrimer = document.getElementById('tab-btn-primer');
    this.tabBtnBallots = document.getElementById('tab-btn-ballots');
    this.tabLockIcon = document.getElementById('tab-lock-icon');

    this.viewSim = document.getElementById('view-simulation');
    this.viewNominal = document.getElementById('view-nominal');
    this.viewNomination = document.getElementById('view-nomination');
    this.viewPrimer = document.getElementById('view-primer');
    this.viewBallots = document.getElementById('view-ballots');

    // Role & Auth Elements
    this.roleBadge = document.getElementById('role-badge');
    this.roleBadgeText = document.getElementById('role-badge-text');
    this.btnAuthToggle = document.getElementById('btn-auth-toggle');
    this.authBtnIcon = document.getElementById('auth-btn-icon');
    this.authBtnLabel = document.getElementById('auth-btn-label');
    this.adminLockoutGate = document.getElementById('admin-lockout-gate');
    this.adminAuthenticatedContent = document.getElementById('admin-authenticated-content');
    this.gatePasscodeInput = document.getElementById('gate-passcode-input');
    this.btnGateUnlock = document.getElementById('btn-gate-unlock');

    // Modals
    this.modalAdminLogin = document.getElementById('modal-admin-login');
    this.loginPasscode = document.getElementById('login-passcode');
    this.btnSubmitLogin = document.getElementById('btn-submit-login');
    this.btnCancelLogin = document.getElementById('btn-cancel-login');
    this.btnCloseLoginModal = document.getElementById('btn-close-login-modal');

    this.modalChangePwd = document.getElementById('modal-change-password');
    this.btnChangePwd = document.getElementById('btn-change-pwd');
    this.pwdCurrent = document.getElementById('pwd-current');
    this.pwdNew = document.getElementById('pwd-new');
    this.btnSavePwd = document.getElementById('btn-save-pwd');
    this.btnCancelPwd = document.getElementById('btn-cancel-pwd');
    this.btnClosePwdModal = document.getElementById('btn-close-pwd-modal');

    this.modalNominationSlip = document.getElementById('modal-nomination-slip');
    this.nominationSlipRenderTarget = document.getElementById('nomination-slip-render-target');
    this.btnPrintNomSlip = document.getElementById('btn-print-nom-slip');
    this.btnCloseNomModal = document.getElementById('btn-close-nom-modal');

    this.modalElectionCertificate = document.getElementById('modal-election-certificate');
    this.certificateRenderTarget = document.getElementById('certificate-render-target');
    this.btnOpenCertificate = document.getElementById('btn-open-certificate');
    this.btnPrintElectionCertificate = document.getElementById('btn-print-election-certificate');
    this.btnCloseCertModal = document.getElementById('btn-close-cert-modal');

    this.modalImportCsv = document.getElementById('modal-import-csv');
    this.btnOpenImportCsv = document.getElementById('btn-open-import-csv');
    this.csvImportTextarea = document.getElementById('csv-import-textarea');
    this.btnSubmitCsvImport = document.getElementById('btn-submit-csv-import');
    this.btnCancelCsv = document.getElementById('btn-cancel-csv');
    this.btnCloseCsvModal = document.getElementById('btn-close-csv-modal');

    this.modalEditCandidate = document.getElementById('modal-edit-candidate');
    this.editCandidateId = document.getElementById('edit-candidate-id');
    this.editCandidateName = document.getElementById('edit-candidate-name');
    this.editCandidateDept = document.getElementById('edit-candidate-dept');
    this.btnSaveEditCandidate = document.getElementById('btn-save-edit-candidate');
    this.btnCancelEditCandidate = document.getElementById('btn-cancel-edit-candidate');
    this.btnCloseEditModal = document.getElementById('btn-close-edit-modal');

    this.modalAuditBallot = document.getElementById('modal-audit-ballot');
    this.ballotAuditSlipContent = document.getElementById('ballot-audit-slip-content');
    this.btnCloseAuditModal = document.getElementById('btn-close-audit-modal');

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

    // Stepper & Playback Controls
    this.btnPrev = document.getElementById('btn-prev-round');
    this.btnNext = document.getElementById('btn-next-round');
    this.btnFirst = document.getElementById('btn-first-round');
    this.btnLast = document.getElementById('btn-last-round');
    this.btnPrevSubstep = document.getElementById('btn-prev-substep');
    this.btnNextSubstep = document.getElementById('btn-next-substep');
    this.demoSubstepIndicator = document.getElementById('demo-substep-indicator');

    this.btnPlayPause = document.getElementById('btn-play-pause');
    this.playPauseIcon = document.getElementById('play-pause-icon');
    this.playPauseText = document.getElementById('play-pause-text');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedVal = document.getElementById('speed-val');
    this.btnReset = document.getElementById('btn-reset-election');
    this.roundIndicator = document.getElementById('round-indicator');

    // Voice Announcer
    this.btnToggleVoice = document.getElementById('btn-toggle-voice');
    this.voiceIcon = document.getElementById('voice-icon');
    this.voiceLabel = document.getElementById('voice-label');

    // Visualization elements
    this.candidatesContainer = document.getElementById('candidates-container');
    this.quotaBadgePill = document.getElementById('quota-badge-pill');
    this.exhaustedVotesCount = document.getElementById('exhausted-votes-count');

    // Demonstrative Commentary & Audit
    this.demoCommentaryBox = document.getElementById('demo-commentary-box');
    this.auditRoundChip = document.getElementById('audit-round-chip');
    this.auditActionTitle = document.getElementById('audit-action-title');
    this.auditActionDesc = document.getElementById('audit-action-desc');
    this.auditActionBanner = document.getElementById('audit-action-banner');
    this.timelineFeed = document.getElementById('timeline-feed');

    // Nominal Rolls elements
    this.inputNominalSearch = document.getElementById('input-nominal-search');
    this.selectNominalDept = document.getElementById('select-nominal-dept');
    this.nominalCountSummary = document.getElementById('nominal-count-summary');
    this.nominalTableBody = document.getElementById('nominal-table-body');
    this.btnExportNominalCsv = document.getElementById('btn-export-nominal-csv');

    // Candidate Nominations elements
    this.formNomination = document.getElementById('form-nomination');
    this.nominationsListContainer = document.getElementById('nominations-list-container');

    // Setup: Vacancy Stepper
    this.inputSeats = document.getElementById('input-seats');
    this.btnSeatMinus = document.getElementById('btn-seat-minus');
    this.btnSeatPlus = document.getElementById('btn-seat-plus');
    this.inputQuotaType = document.getElementById('input-quota-type');

    // Setup: Candidates
    this.inputNewCandName = document.getElementById('input-new-candidate-name');
    this.inputNewCandDept = document.getElementById('input-new-candidate-dept');
    this.btnAddCandidate = document.getElementById('btn-add-candidate');
    this.candidateRosterList = document.getElementById('candidate-roster-list');

    // Setup: Ballot Entry
    this.inputBallotSerial = document.getElementById('input-ballot-serial');
    this.inputBallotCount = document.getElementById('input-ballot-count');
    this.btnRecordBallot = document.getElementById('btn-record-ballot');
    this.ballotCandidateInputs = document.getElementById('ballot-candidate-inputs');
    this.duplicateRankAlert = document.getElementById('duplicate-rank-alert');
    this.duplicateRankNumber = document.getElementById('duplicate-rank-number');
    this.ballotTableBody = document.getElementById('ballot-table-body');
    this.ballotBoxTotalPill = document.getElementById('ballot-box-total-pill');

    // Setup: Raw editor
    this.btnToggleRaw = document.getElementById('btn-toggle-raw');
    this.rawEditorContainer = document.getElementById('raw-editor-container');
    this.textareaBallots = document.getElementById('textarea-ballots');
    this.btnApplyRaw = document.getElementById('btn-apply-raw');
    this.btnExportJson = document.getElementById('btn-export-json');

    // Action buttons
    this.btnClearAllBallots = document.getElementById('btn-clear-all-ballots');
    this.btnLoadSample = document.getElementById('btn-load-sample');
    this.btnRunCustom = document.getElementById('btn-run-custom-election');

    this.appToast = document.getElementById('app-toast');
  }

  bindEvents() {
    // Navigation Tabs
    this.tabBtnSim.addEventListener('click', () => this.switchTab('sim'));
    this.tabBtnNominal.addEventListener('click', () => this.switchTab('nominal'));
    this.tabBtnNomination.addEventListener('click', () => this.switchTab('nomination'));
    this.tabBtnPrimer.addEventListener('click', () => this.switchTab('primer'));
    this.tabBtnBallots.addEventListener('click', () => this.switchTab('ballots'));

    // Auth Toggle / Gate
    this.btnAuthToggle.addEventListener('click', () => this.handleAuthToggle());
    this.btnGateUnlock.addEventListener('click', () => this.handleGateUnlock());
    this.gatePasscodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleGateUnlock();
    });

    // Login Modal
    this.btnSubmitLogin.addEventListener('click', () => this.handleModalLogin());
    this.btnCancelLogin.addEventListener('click', () => this.closeModal(this.modalAdminLogin));
    this.btnCloseLoginModal.addEventListener('click', () => this.closeModal(this.modalAdminLogin));
    this.loginPasscode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleModalLogin();
    });

    // Change Password Modal
    this.btnChangePwd?.addEventListener('click', () => {
      this.pwdCurrent.value = '';
      this.pwdNew.value = '';
      this.openModal(this.modalChangePwd);
      setTimeout(() => this.pwdCurrent?.focus(), 150);
    });
    this.btnClosePwdModal?.addEventListener('click', () => this.closeModal(this.modalChangePwd));
    this.btnCancelPwd?.addEventListener('click', () => this.closeModal(this.modalChangePwd));
    this.btnSavePwd?.addEventListener('click', () => this.handleSaveNewPassword());
    this.pwdCurrent?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.pwdNew?.focus();
    });
    this.pwdNew?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSaveNewPassword();
    });

    // Theme Toggle
    document.getElementById('btn-toggle-theme')?.addEventListener('click', () => this.toggleTheme());

    // Preset Selection
    this.selectPreset.addEventListener('change', (e) => this.loadPreset(e.target.value));

    // Simulation Controls
    this.btnFirst.addEventListener('click', () => this.jumpToRound(0));
    this.btnPrev.addEventListener('click', () => this.stepRound(-1));
    this.btnNext.addEventListener('click', () => this.stepRound(1));
    this.btnLast.addEventListener('click', () => this.jumpToRound(999));
    this.btnPrevSubstep.addEventListener('click', () => this.stepSubstep(-1));
    this.btnNextSubstep.addEventListener('click', () => this.stepSubstep(1));
    this.btnPlayPause.addEventListener('click', () => this.togglePlay());
    this.btnReset.addEventListener('click', () => this.resetSimulation());

    this.speedSlider.addEventListener('input', (e) => {
      this.speedMs = parseInt(e.target.value, 10);
      this.speedVal.textContent = `${(this.speedMs / 1000).toFixed(1)}s`;
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });

    // Voice Announcer
    this.btnToggleVoice.addEventListener('click', () => this.toggleVoiceAnnouncer());

    // Certificates
    this.btnOpenCertificate.addEventListener('click', () => this.openResultsCertificate());
    this.btnPrintElectionCertificate.addEventListener('click', () => window.print());
    this.btnCloseCertModal.addEventListener('click', () => this.closeModal(this.modalElectionCertificate));

    // Nomination Print
    this.btnPrintNomSlip.addEventListener('click', () => window.print());
    this.btnCloseNomModal.addEventListener('click', () => this.closeModal(this.modalNominationSlip));

    // Setup: Vacancy
    this.btnSeatMinus.addEventListener('click', () => this.adjustSeats(-1));
    this.btnSeatPlus.addEventListener('click', () => this.adjustSeats(1));
    this.inputQuotaType.addEventListener('change', (e) => {
      this.quotaType = e.target.value;
      this.selectPreset.value = 'custom';
    });

    // Setup: Candidates
    this.btnAddCandidate.addEventListener('click', () => this.addCandidateFromForm());
    this.inputNewCandName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addCandidateFromForm();
    });

    // Setup: Ballot Entry
    this.btnRecordBallot.addEventListener('click', () => this.recordBallotFromPaper());
    this.btnClearAllBallots.addEventListener('click', () => this.clearAllBallots());
    this.btnLoadSample.addEventListener('click', () => this.loadPreset('faculty_senate'));
    this.btnRunCustom.addEventListener('click', () => this.calculateAndTally(true));

    // Setup: Raw
    this.btnToggleRaw.addEventListener('click', () => {
      const isHidden = this.rawEditorContainer.style.display === 'none';
      this.rawEditorContainer.style.display = isHidden ? 'block' : 'none';
    });
    this.btnApplyRaw.addEventListener('click', () => this.applyRawText());
    this.btnExportJson.addEventListener('click', () => this.exportJsonRegistry());

    // Edit Candidate Modal
    this.btnSaveEditCandidate.addEventListener('click', () => this.saveCandidateEdit());
    this.btnCancelEditCandidate.addEventListener('click', () => this.closeModal(this.modalEditCandidate));
    this.btnCloseEditModal.addEventListener('click', () => this.closeModal(this.modalEditCandidate));

    // Ballot Audit Slip Modal
    this.btnCloseAuditModal.addEventListener('click', () => this.closeModal(this.modalAuditBallot));

    // Nominal Rolls
    this.inputNominalSearch.addEventListener('input', () => this.renderNominalRollTable());
    this.selectNominalDept.addEventListener('change', () => this.renderNominalRollTable());
    this.btnExportNominalCsv.addEventListener('click', () => this.exportNominalCsv());
    this.btnOpenImportCsv?.addEventListener('click', () => this.openModal(this.modalImportCsv));
    this.btnCloseCsvModal?.addEventListener('click', () => this.closeModal(this.modalImportCsv));
    this.btnCancelCsv?.addEventListener('click', () => this.closeModal(this.modalImportCsv));
    this.btnSubmitCsvImport?.addEventListener('click', () => this.handleCsvImport());

    // Nomination Form
    this.formNomination.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNominationSubmit();
    });
  }

  // =========================================================================
  // AUTHENTICATION & ROLE MANAGEMENT
  // =========================================================================

  updateAuthUi() {
    const isAuth = this.authService.isAuthenticated();

    if (isAuth) {
      this.roleBadge.className = 'role-badge admin';
      this.roleBadgeText.textContent = 'Returning Officer';
      this.authBtnIcon.textContent = '🔓';
      this.authBtnLabel.textContent = 'Sign Out';
      this.tabLockIcon.textContent = '🛡️';

      this.adminLockoutGate.style.display = 'none';
      this.adminAuthenticatedContent.style.display = 'block';

      // Show admin actions in nominal rolls
      document.querySelectorAll('.admin-only-btn').forEach(el => el.style.display = 'inline-flex');
      document.querySelectorAll('.admin-only-col').forEach(el => el.style.display = 'table-cell');
    } else {
      this.roleBadge.className = 'role-badge public';
      this.roleBadgeText.textContent = 'Public Observer';
      this.authBtnIcon.textContent = '🔒';
      this.authBtnLabel.textContent = 'Officer Login';
      this.tabLockIcon.textContent = '🔒';

      this.adminLockoutGate.style.display = 'block';
      this.adminAuthenticatedContent.style.display = 'none';

      document.querySelectorAll('.admin-only-btn').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.admin-only-col').forEach(el => el.style.display = 'none');
    }

    this.renderNominalRollTable();
  }

  handleAuthToggle() {
    if (this.authService.isAuthenticated()) {
      this.authService.logout();
      this.updateAuthUi();
      this.showToast("Signed out of Returning Officer mode. Switched to Public Observer view.", "info");
      if (this.activeTab === 'ballots') {
        this.switchTab('sim');
      }
    } else {
      this.loginPasscode.value = '';
      this.openModal(this.modalAdminLogin);
      setTimeout(() => this.loginPasscode.focus(), 150);
    }
  }

  handleModalLogin() {
    const pwd = this.loginPasscode.value;
    if (this.authService.login(pwd)) {
      this.closeModal(this.modalAdminLogin);
      this.updateAuthUi();
      this.showToast("🔓 Returning Officer authenticated. Admin controls unlocked.", "success");
      this.switchTab('ballots');
    } else {
      this.showToast("Invalid officer passcode. Please try again.", "warning");
      this.loginPasscode.select();
    }
  }

  handleGateUnlock() {
    const pwd = this.gatePasscodeInput.value;
    if (this.authService.login(pwd)) {
      this.gatePasscodeInput.value = '';
      this.updateAuthUi();
      this.showToast("🔓 Returning Officer authenticated. Admin setup unlocked.", "success");
    } else {
      this.showToast("Invalid officer passcode.", "warning");
      this.gatePasscodeInput.select();
    }
  }

  handleSaveNewPassword() {
    const current = this.pwdCurrent.value;
    const next = this.pwdNew.value;
    try {
      this.authService.changePasscode(current, next);
      this.closeModal(this.modalChangePwd);
      this.pwdCurrent.value = '';
      this.pwdNew.value = '';
      this.showToast("✓ Officer passcode updated successfully.", "success");
    } catch (err) {
      this.showToast(err.message, "warning");
    }
  }

  // =========================================================================
  // NAVIGATION & TAB SWITCHING
  // =========================================================================

  switchTab(tabKey) {
    this.activeTab = tabKey;
    const tabs = [
      { key: 'sim', btn: this.tabBtnSim, view: this.viewSim },
      { key: 'nominal', btn: this.tabBtnNominal, view: this.viewNominal },
      { key: 'nomination', btn: this.tabBtnNomination, view: this.viewNomination },
      { key: 'primer', btn: this.tabBtnPrimer, view: this.viewPrimer },
      { key: 'ballots', btn: this.tabBtnBallots, view: this.viewBallots },
    ];

    tabs.forEach(t => {
      const active = t.key === tabKey;
      t.btn.classList.toggle('active', active);
      t.btn.setAttribute('aria-selected', active);
      t.view.style.display = active ? 'block' : 'none';
    });

    if (tabKey === 'nominal') {
      this.renderNominalRollTable();
    } else if (tabKey === 'nomination') {
      this.renderNominationsList();
    }
  }

  toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('open', 'visible');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open', 'visible');
  }

  // =========================================================================
  // VOICE ANNOUNCER (SPEECH SYNTHESIS)
  // =========================================================================

  toggleVoiceAnnouncer() {
    this.voiceEnabled = !this.voiceEnabled;
    this.btnToggleVoice.classList.toggle('btn-voice-active', this.voiceEnabled);
    this.voiceLabel.textContent = this.voiceEnabled ? 'Voice: ON' : 'Voice: OFF';
    this.voiceIcon.textContent = this.voiceEnabled ? '📢' : '🎙️';

    if (this.voiceEnabled) {
      this.speak("Live Voice Announcer activated. Announcements will be read aloud.");
      this.showToast("📢 Voice Announcer active. Sub-step commentary will be spoken aloud.", "success");
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      this.showToast("Voice Announcer muted.", "info");
    }
  }

  speak(text) {
    if (!this.voiceEnabled || !window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error", e);
    }
  }

  // =========================================================================
  // NOMINAL ROLLS MODULE
  // =========================================================================

  initNominalRollUi() {
    // Populate departments filter
    const depts = this.nominalService.getDepartments();
    this.selectNominalDept.innerHTML = '<option value="">All Departments</option>';
    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      this.selectNominalDept.appendChild(opt);
    });
    this.renderNominalRollTable();
  }

  renderNominalRollTable() {
    const q = this.inputNominalSearch.value;
    const dept = this.selectNominalDept.value;
    const list = this.nominalService.filter(q, dept);
    const isAuth = this.authService.isAuthenticated();

    this.nominalCountSummary.textContent = `Showing ${list.length} of ${this.nominalService.getAll().length} registered voters`;
    this.nominalTableBody.innerHTML = '';

    if (list.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="${isAuth ? 7 : 6}" style="text-align: center; padding: 2rem; color: var(--text-muted);">No matching voters found in nominal roll.</td>`;
      this.nominalTableBody.appendChild(tr);
      return;
    }

    list.forEach(voter => {
      const tr = document.createElement('tr');
      const isIssued = voter.status === 'Ballot Issued';
      const badgeClass = isIssued ? 'status-badge-issued' : 'status-badge-eligible';

      tr.innerHTML = `
        <td><code style="font-weight: 700;">${voter.id}</code></td>
        <td><code>${voter.rollNo}</code></td>
        <td><strong>${voter.name}</strong></td>
        <td>${voter.dept}</td>
        <td>${voter.year}</td>
        <td><span class="${badgeClass}">${voter.status}</span></td>
        ${isAuth ? `
          <td class="admin-only-col">
            <button type="button" class="btn btn-ghost btn-sm btn-toggle-voter-status" data-id="${voter.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">
              ${isIssued ? 'Mark Eligible' : 'Mark Issued'}
            </button>
          </td>
        ` : ''}
      `;

      if (isAuth) {
        tr.querySelector('.btn-toggle-voter-status')?.addEventListener('click', () => {
          this.nominalService.toggleVoterStatus(voter.id);
          this.renderNominalRollTable();
        });
      }

      this.nominalTableBody.appendChild(tr);
    });
  }

  exportNominalCsv() {
    const csv = this.nominalService.toCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nominal_roll_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("✓ Nominal roll CSV exported.", "info");
  }

  handleCsvImport() {
    const text = this.csvImportTextarea.value;
    try {
      const count = this.nominalService.importCSV(text);
      this.closeModal(this.modalImportCsv);
      this.csvImportTextarea.value = '';
      this.initNominalRollUi();
      this.showToast(`✓ Successfully imported ${count} voter records into nominal roll.`, "success");
    } catch (err) {
      this.showToast(err.message, "warning");
    }
  }

  // =========================================================================
  // CANDIDATE NOMINATIONS MODULE
  // =========================================================================

  initNominationUi() {
    this.renderNominationsList();
  }

  handleNominationSubmit() {
    const data = {
      post: document.getElementById('nom-post').value,
      candidateName: document.getElementById('nom-cand-name').value,
      candidateRoll: document.getElementById('nom-cand-roll').value,
      candidateDept: document.getElementById('nom-cand-dept').value,
      candidateClass: document.getElementById('nom-cand-class').value,
      proposerName: document.getElementById('nom-prop-name').value,
      proposerRoll: document.getElementById('nom-prop-roll').value,
      proposerDept: document.getElementById('nom-cand-dept').value,
      seconderName: document.getElementById('nom-sec-name').value,
      seconderRoll: document.getElementById('nom-sec-roll').value,
      seconderDept: document.getElementById('nom-cand-dept').value,
    };

    const newNom = this.nominationService.submitNomination(data);
    this.formNomination.reset();
    this.renderNominationsList();

    // Render slip in modal and pop up
    this.nominationSlipRenderTarget.innerHTML = this.nominationService.generatePrintableSlipHtml(newNom);
    this.openModal(this.modalNominationSlip);
    this.showToast(`✓ Nomination paper submitted! Registered as ${newNom.id}.`, "success");
  }

  renderNominationsList() {
    const list = this.nominationService.getAll();
    this.nominationsListContainer.innerHTML = '';

    if (list.length === 0) {
      this.nominationsListContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No nominations filed yet.</div>';
      return;
    }

    list.forEach(nom => {
      const card = document.createElement('div');
      card.style.cssText = 'background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.85rem;';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
          <div>
            <strong style="font-size: 0.95rem; color: var(--text-primary);">${nom.candidateName}</strong>
            <div style="font-size: 0.785rem; color: var(--text-muted);">${nom.candidateDept} &bull; Roll: <code>${nom.candidateRoll}</code></div>
          </div>
          <span class="status-tag hopeful" style="font-size: 0.7rem;">${nom.status}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.6rem;">
          Post: <strong>${nom.post}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
          <span>Ref: <code>${nom.id}</code></span>
          <button type="button" class="btn btn-secondary btn-sm btn-view-slip" style="padding: 0.2rem 0.6rem; font-size: 0.75rem;">View Slip</button>
        </div>
      `;

      card.querySelector('.btn-view-slip').addEventListener('click', () => {
        this.nominationSlipRenderTarget.innerHTML = this.nominationService.generatePrintableSlipHtml(nom);
        this.openModal(this.modalNominationSlip);
      });

      this.nominationsListContainer.appendChild(card);
    });
  }

  // =========================================================================
  // OFFICIAL DECLARATION OF RESULTS CERTIFICATE
  // =========================================================================

  openResultsCertificate() {
    if (!this.electionResult) {
      this.showToast("Calculate and run an election count first to generate the certificate.", "warning");
      return;
    }

    const quota = this.electionResult.quota;
    const totalVotes = this.electionResult.totalValidVotes;
    const elected = this.electionResult.electedCandidates;
    const finalRound = this.electionResult.rounds[this.electionResult.rounds.length - 1];
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    let winnerRows = '';
    elected.forEach((candName, idx) => {
      const candObj = this.candidates.find(c => c.name === candName) || { dept: "General" };
      const finalVotes = (finalRound.tallies[candName] || quota).toFixed(4);
      winnerRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;"><strong>#${idx + 1}</strong></td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>${candName}</strong></td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${candObj.dept}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${finalVotes}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;"><span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: bold;">ELECTED</span></td>
        </tr>
      `;
    });

    const certHtml = `
      <div class="nomination-slip-document" style="border: 2px solid #0f172a; padding: 2rem;">
        <div class="nom-slip-header">
          <div class="nom-slip-emblem">🏛️</div>
          <div class="nom-slip-heading">OFFICIAL RETURN OF PREFERENTIAL ELECTION</div>
          <div class="nom-slip-subheading">STATUTORY CERTIFICATE OF DECLARED RESULTS & SCRUTINY AUDIT</div>
          <div class="nom-slip-badge">Inclusive Gregory Method &bull; Single Transferable Vote (STV)</div>
        </div>

        <div class="nom-meta-row">
          <div><strong>Election Name:</strong> ${PRESETS[this.currentPresetKey]?.name || "Institutional Preferential Election"}</div>
          <div><strong>Date & Timestamp:</strong> ${dateStr}</div>
          <div><strong>Total Verified Ballots:</strong> ${this.compiledBallots.length}</div>
          <div><strong>Winning Quota:</strong> ${quota.toFixed(4)} (${this.quotaType.toUpperCase()})</div>
        </div>

        <div class="nom-section-title">1. OFFICIAL RETURN OF DECLARED WINNERS</div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.9rem;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 60px;">Rank</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Candidate Full Name</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Department</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; width: 110px;">Final Votes</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${winnerRows}
          </tbody>
        </table>

        <div class="nom-section-title" style="margin-top: 1.5rem;">2. ELECTION TALLY SUMMARY</div>
        <div class="nom-grid-2" style="font-size: 0.85rem;">
          <div class="nom-box">
            <div><strong>Total Valid Vote Weight:</strong> ${totalVotes.toFixed(4)}</div>
            <div><strong>Total Count Rounds Executed:</strong> ${this.electionResult.rounds.length}</div>
          </div>
          <div class="nom-box">
            <div><strong>Exhausted / Non-Transferable Votes:</strong> ${this.electionResult.exhaustedTotal.toFixed(4)}</div>
            <div><strong>Seats Vacant:</strong> 0 (${this.seats} of ${this.seats} Filled)</div>
          </div>
        </div>

        <div class="nom-section-title" style="margin-top: 1.5rem;">3. RETURNING OFFICER STATUTORY DECLARATION</div>
        <div class="nom-declaration-box" style="font-size: 0.85rem;">
          I, the undersigned Returning Officer, do hereby certify that the count of the votes cast in the above election was completed in strict accordance with statutory Single Transferable Vote regulations using the Inclusive Gregory fractional transfer method, and I hereby declare the candidates listed in Section 1 to be duly elected.
        </div>

        <div class="nom-slip-footer">
          <div class="officer-seal-box">
            <div class="seal-circle">OFFICIAL SEAL<br>RETURNING OFFICER</div>
            <div class="seal-caption">Returning Officer Signature & Seal</div>
          </div>
          <div style="font-size: 0.75rem; color: #475569; text-align: right;">
            <div>Digitally Audited & Sealed by Electoral Board</div>
            <div>Verification Code: <code>STV-${Math.random().toString(16).substring(2, 10).toUpperCase()}</code></div>
          </div>
        </div>
      </div>
    `;

    this.certificateRenderTarget.innerHTML = certHtml;
    this.openModal(this.modalElectionCertificate);
  }

  // =========================================================================
  // PRESET & SETUP LOGIC
  // =========================================================================

  loadPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    this.currentPresetKey = presetKey;
    this.selectPreset.value = presetKey;
    this.seats = preset.seats;
    this.quotaType = preset.quotaType || 'droop';
    this.inputSeats.value = this.seats;
    this.inputQuotaType.value = this.quotaType;

    this.candidates = preset.candidates.map(c => ({ ...c }));
    this.ballotEntries = preset.ballotEntries.map(b => ({
      serial: b.serial,
      count: b.count,
      prefs: [...b.prefs]
    }));

    this.serialCounter = 101;
    this.inputBallotSerial.value = `BAL-${String(this.serialCounter).padStart(4, '0')}`;

    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.renderBallotTable();
    this.syncRawTextarea();

    this.calculateAndTally(false);
  }

  adjustSeats(delta) {
    const next = this.seats + delta;
    if (next >= 1 && next < this.candidates.length) {
      this.seats = next;
      this.inputSeats.value = this.seats;
      this.selectPreset.value = 'custom';
    }
  }

  addCandidateFromForm() {
    const name = this.inputNewCandName.value.trim();
    const dept = this.inputNewCandDept.value.trim() || 'General';

    if (!name) {
      this.showToast("Candidate name cannot be empty.", "warning");
      return;
    }
    if (this.candidates.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      this.showToast("A candidate with this name already exists.", "warning");
      return;
    }

    const id = `cand_${Date.now()}`;
    const color = SLATE_COLORS[this.candidates.length % SLATE_COLORS.length];
    this.candidates.push({ id, name, dept, color });

    this.inputNewCandName.value = '';
    this.inputNewCandDept.value = '';
    this.selectPreset.value = 'custom';

    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.showToast(`Candidate '${name}' added to roster.`, "info");
  }

  removeCandidate(candId) {
    if (this.candidates.length <= 2) {
      this.showToast("An election requires at least 2 candidates.", "warning");
      return;
    }
    const idx = this.candidates.findIndex(c => c.id === candId);
    if (idx === -1) return;
    const removedName = this.candidates[idx].name;
    this.candidates.splice(idx, 1);

    if (this.seats >= this.candidates.length) {
      this.seats = Math.max(1, this.candidates.length - 1);
      this.inputSeats.value = this.seats;
    }

    // Clean preferences from existing ballot entries
    this.ballotEntries.forEach(b => {
      b.prefs = b.prefs.filter(p => p !== removedName);
    });

    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.renderBallotTable();
    this.syncRawTextarea();
    this.showToast(`Candidate '${removedName}' removed.`, "info");
  }

  renderCandidateRoster() {
    this.candidateRosterList.innerHTML = '';
    this.candidates.forEach((cand, idx) => {
      const item = document.createElement('div');
      item.className = 'candidate-roster-item';
      item.innerHTML = `
        <div class="roster-avatar" style="background: ${cand.color}">
          ${cand.name.charAt(0)}
        </div>
        <div class="roster-info">
          <div class="roster-name">${cand.name}</div>
          <div class="roster-dept">${cand.dept}</div>
        </div>
        <div class="roster-actions">
          <button type="button" class="btn-roster-action edit" title="Edit candidate">✏️</button>
          <button type="button" class="btn-roster-action delete" title="Remove candidate">✕</button>
        </div>
      `;

      item.querySelector('.edit').addEventListener('click', () => {
        this.editCandidateId.value = cand.id;
        this.editCandidateName.value = cand.name;
        this.editCandidateDept.value = cand.dept;
        this.openModal(this.modalEditCandidate);
      });

      item.querySelector('.delete').addEventListener('click', () => this.removeCandidate(cand.id));

      this.candidateRosterList.appendChild(item);
    });
  }

  saveCandidateEdit() {
    const id = this.editCandidateId.value;
    const cand = this.candidates.find(c => c.id === id);
    if (!cand) return;

    const oldName = cand.name;
    const newName = this.editCandidateName.value.trim();
    const newDept = this.editCandidateDept.value.trim() || 'General';

    if (!newName) {
      this.showToast("Candidate name cannot be empty.", "warning");
      return;
    }

    cand.name = newName;
    cand.dept = newDept;

    if (oldName !== newName) {
      this.ballotEntries.forEach(b => {
        b.prefs = b.prefs.map(p => p === oldName ? newName : p);
      });
    }

    this.closeModal(this.modalEditCandidate);
    this.renderCandidateRoster();
    this.renderBallotPaperRows();
    this.renderBallotTable();
    this.syncRawTextarea();
    this.showToast(`Candidate updated to '${newName}'.`, "info");
  }

  renderBallotPaperRows() {
    this.ballotCandidateInputs.innerHTML = '';
    this.candidates.forEach((cand, idx) => {
      const row = document.createElement('div');
      row.className = 'ballot-paper-row';
      row.innerHTML = `
        <div class="ballot-candidate-info">
          <span class="ballot-cand-order-num">${idx + 1}</span>
          <div class="roster-avatar" style="background: ${cand.color}; width: 28px; height: 28px; font-size: 0.75rem;">
            ${cand.name.charAt(0)}
          </div>
          <div>
            <div class="ballot-cand-name">${cand.name}</div>
            <div class="ballot-cand-dept">${cand.dept}</div>
          </div>
        </div>
        <div class="ballot-rank-input-wrap">
          <input type="number" class="rank-box-input" min="1" max="${this.candidates.length}" placeholder="—" data-candidate="${cand.name}">
        </div>
      `;

      const input = row.querySelector('.rank-box-input');
      input.addEventListener('input', () => {
        row.classList.toggle('marked', Boolean(input.value.trim()));
        this.validateDuplicateRanks();
      });

      this.ballotCandidateInputs.appendChild(row);
    });
  }

  validateDuplicateRanks() {
    const inputs = Array.from(this.ballotCandidateInputs.querySelectorAll('.rank-box-input'));
    const rankMap = new Map();

    inputs.forEach(inp => {
      inp.classList.remove('has-duplicate');
      const val = inp.value.trim();
      if (val) {
        const rank = parseInt(val, 10);
        if (!isNaN(rank)) {
          if (!rankMap.has(rank)) rankMap.set(rank, []);
          rankMap.get(rank).push(inp);
        }
      }
    });

    let hasDuplicate = false;
    rankMap.forEach((list, rank) => {
      if (list.length > 1) {
        hasDuplicate = true;
        this.duplicateRankNumber.textContent = rank;
        list.forEach(i => i.classList.add('has-duplicate'));
      }
    });

    this.duplicateRankAlert.style.display = hasDuplicate ? 'flex' : 'none';
    return !hasDuplicate;
  }

  recordBallotFromPaper() {
    if (!this.validateDuplicateRanks()) {
      this.showToast("Cannot log ballot: duplicate preference numbers detected.", "warning");
      return;
    }

    const inputs = Array.from(this.ballotCandidateInputs.querySelectorAll('.rank-box-input'));
    const marked = [];

    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) {
        const rank = parseInt(val, 10);
        if (!isNaN(rank)) {
          marked.push({ name: inp.dataset.candidate, rank });
        }
      }
    });

    if (marked.length === 0) {
      this.showToast("Mark at least one preference before logging ballot.", "warning");
      return;
    }

    marked.sort((a, b) => a.rank - b.rank);
    const prefs = marked.map(m => m.name);

    const serial = this.inputBallotSerial.value.trim() || `BAL-${String(this.serialCounter).padStart(4, '0')}`;
    const count = parseInt(this.inputBallotCount.value, 10) || 1;

    this.ballotEntries.push({ serial, count, prefs });
    this.serialCounter++;
    this.inputBallotSerial.value = `BAL-${String(this.serialCounter).padStart(4, '0')}`;
    this.inputBallotCount.value = 1;

    // Clear inputs
    inputs.forEach(inp => {
      inp.value = '';
      inp.closest('.ballot-paper-row').classList.remove('marked');
    });

    this.renderBallotTable();
    this.syncRawTextarea();
    this.showToast(`Logged ${count} ballot(s) as ${serial}.`, "success");
  }

  renderBallotTable() {
    this.ballotTableBody.innerHTML = '';
    let totalBallots = 0;

    this.ballotEntries.forEach((entry, idx) => {
      totalBallots += entry.count;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${entry.serial}</code></td>
        <td><strong>${entry.count}</strong></td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            ${entry.prefs.map((p, pIdx) => `<span class="pref-badge">${pIdx + 1}. ${p}</span>`).join('')}
          </div>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-ghost btn-sm btn-delete-ballot" title="Delete ballot entry" style="padding: 0.2rem 0.5rem; color: #f87171;">✕</button>
        </td>
      `;

      tr.querySelector('.btn-delete-ballot').addEventListener('click', () => {
        this.ballotEntries.splice(idx, 1);
        this.renderBallotTable();
        this.syncRawTextarea();
      });

      this.ballotTableBody.appendChild(tr);
    });

    this.ballotBoxTotalPill.textContent = `${totalBallots} Total Ballots`;
  }

  syncRawTextarea() {
    const lines = this.ballotEntries.map(e => `${e.count} : ${e.prefs.join(' > ')}`);
    this.textareaBallots.value = lines.join('\n');
  }

  applyRawText() {
    const raw = this.textareaBallots.value.trim();
    if (!raw) return;

    const lines = raw.split(/\r?\n/);
    const parsed = [];
    let counter = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      let count = 1;
      let prefsStr = trimmed;

      if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        count = parseInt(parts[0].trim(), 10) || 1;
        prefsStr = parts[1].trim();
      }

      const prefs = prefsStr.split(/[>,]/).map(p => p.trim()).filter(Boolean);
      if (prefs.length > 0) {
        parsed.push({
          serial: `BAL-${String(counter++).padStart(4, '0')}`,
          count,
          prefs
        });
      }
    }

    if (parsed.length > 0) {
      this.ballotEntries = parsed;
      this.renderBallotTable();
      this.showToast(`Applied ${parsed.length} raw ballot groups.`, "info");
    }
  }

  exportJsonRegistry() {
    const data = {
      preset: this.currentPresetKey,
      seats: this.seats,
      quotaType: this.quotaType,
      candidates: this.candidates,
      ballots: this.ballotEntries,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stv_ballot_registry_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearAllBallots() {
    this.ballotEntries = [];
    this.serialCounter = 1;
    this.inputBallotSerial.value = `BAL-0001`;
    this.renderBallotTable();
    this.syncRawTextarea();
    this.resetSimulation();
    this.showToast("Ballot box cleared to 0 ballots.", "info");
  }

  // =========================================================================
  // SIMULATION & DEMONSTRATIVE LIVE COMMENTARY ENGINE
  // =========================================================================

  calculateAndTally(switchToSim = false) {
    if (this.candidates.length < 2) return;
    if (this.ballotEntries.length === 0) {
      if (switchToSim) this.showToast("Ballot box is empty.", "warning");
      return;
    }

    const ballots = [];
    this.ballotEntries.forEach(entry => {
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
      this.currentSubstepIdx = 0;
      this.pause();
      this.render();

      if (switchToSim) {
        this.switchTab('sim');
      }
    } catch (err) {
      alert(`Election calculation error: ${err.message}`);
    }
  }

  stepRound(delta) {
    if (!this.electionResult) return;
    const maxIdx = this.electionResult.rounds.length - 1;
    const nextIdx = this.currentRoundIdx + delta;
    if (nextIdx >= 0 && nextIdx <= maxIdx) {
      this.currentRoundIdx = nextIdx;
      this.currentSubstepIdx = 0;
      this.render();
    }
  }

  jumpToRound(idx) {
    if (!this.electionResult) return;
    this.currentRoundIdx = Math.max(0, Math.min(idx, this.electionResult.rounds.length - 1));
    this.currentSubstepIdx = 0;
    this.render();
  }

  stepSubstep(delta) {
    if (!this.electionResult) return;
    const round = this.electionResult.rounds[this.currentRoundIdx];
    const steps = round.demonstrativeSteps || [];
    if (steps.length === 0) return;

    const nextSub = this.currentSubstepIdx + delta;
    if (nextSub >= 0 && nextSub < steps.length) {
      this.currentSubstepIdx = nextSub;
      this.renderDemonstrativeCommentary(round);
    } else if (nextSub >= steps.length) {
      // Advance to next round if available
      if (this.currentRoundIdx < this.electionResult.rounds.length - 1) {
        this.currentRoundIdx++;
        this.currentSubstepIdx = 0;
        this.render();
      }
    } else if (nextSub < 0) {
      // Go to previous round's last step
      if (this.currentRoundIdx > 0) {
        this.currentRoundIdx--;
        const prevRound = this.electionResult.rounds[this.currentRoundIdx];
        this.currentSubstepIdx = (prevRound.demonstrativeSteps || []).length - 1;
        this.render();
      }
    }
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
      const round = this.electionResult.rounds[this.currentRoundIdx];
      const steps = round.demonstrativeSteps || [];

      if (this.currentSubstepIdx < steps.length - 1) {
        this.currentSubstepIdx++;
        this.renderDemonstrativeCommentary(round);
      } else if (this.currentRoundIdx < maxIdx) {
        this.currentRoundIdx++;
        this.currentSubstepIdx = 0;
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

  resetSimulation() {
    this.pause();
    this.currentRoundIdx = 0;
    this.currentSubstepIdx = 0;
    this.render();
  }

  render() {
    if (!this.electionResult) return;

    const round = this.electionResult.rounds[this.currentRoundIdx];
    const totalRounds = this.electionResult.rounds.length;
    const quota = this.electionResult.quota;
    const totalVotes = this.electionResult.totalValidVotes;

    // KPIs
    this.kpiTotalVotes.textContent = totalVotes.toFixed(2);
    this.kpiTotalBallots.textContent = `${this.compiledBallots.length} verified ballots logged`;
    this.kpiQuota.textContent = quota.toFixed(2);
    this.kpiQuotaType.textContent = this.quotaType === 'droop' 
      ? `Droop Quota: ⌊Votes / (${this.seats} + 1)⌋ + 1` 
      : `Hare Quota: Votes / ${this.seats}`;

    const currentlyElected = Object.entries(round.candidateStatus)
      .filter(([_, st]) => st === CandidateStatus.ELECTED)
      .map(([cand]) => cand);

    this.kpiSeatsStatus.textContent = `${currentlyElected.length} / ${this.seats} Filled`;
    this.kpiSeatsSubtext.textContent = `${this.seats - currentlyElected.length} vacancies remaining`;

    this.kpiRoundNum.textContent = `Round ${round.roundNumber}`;
    this.kpiTotalRounds.textContent = `of ${totalRounds} total count rounds`;

    // Steppers
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

    // Demonstrative Observer Commentary
    this.renderDemonstrativeCommentary(round);

    // Timeline & Banner
    this.renderAuditPanel(round);
    this.renderTimeline();
  }

  renderDemonstrativeCommentary(round) {
    const steps = round.demonstrativeSteps || [];
    if (steps.length === 0) {
      this.demoCommentaryBox.innerHTML = '<div style="color: var(--text-muted);">No detailed sub-step data.</div>';
      return;
    }

    if (this.currentSubstepIdx >= steps.length) {
      this.currentSubstepIdx = steps.length - 1;
    }

    const step = steps[this.currentSubstepIdx];
    this.demoSubstepIndicator.textContent = `Step ${step.stepNumber} of ${steps.length}`;

    let stageClass = 'declaration';
    if (step.stage.includes('ELIMIN')) stageClass = 'elimination';

    let mathCardHtml = '';
    if (step.metrics && step.metrics.surplus !== undefined) {
      mathCardHtml = `
        <div class="demo-math-card">
          <div class="demo-math-item">
            <div class="demo-math-label">Winner Total</div>
            <div class="demo-math-val">${step.metrics.totalVotes.toFixed(4)}</div>
          </div>
          <div class="demo-math-item">
            <div class="demo-math-label">Winning Quota</div>
            <div class="demo-math-val" style="color: var(--quota-marker-color);">${step.metrics.quota.toFixed(4)}</div>
          </div>
          <div class="demo-math-item">
            <div class="demo-math-label">Surplus Votes</div>
            <div class="demo-math-val" style="color: #34d399;">+${step.metrics.surplus.toFixed(4)}</div>
          </div>
          <div class="demo-math-item">
            <div class="demo-math-label">Transfer Value Factor</div>
            <div class="demo-math-val" style="color: #38bdf8;">${step.metrics.transferFactor.toFixed(6)}</div>
          </div>
        </div>
      `;
    }

    let transferTableHtml = '';
    if (step.breakdown && step.breakdown.length > 0) {
      let rows = '';
      step.breakdown.forEach(b => {
        rows += `
          <tr>
            <td><strong>${b.candidate}</strong></td>
            <td><code>${b.ballotCount}</code></td>
            <td class="val-highlight">+${b.transferredValue.toFixed(4)}</td>
            <td style="color: var(--text-muted);">${(b.previousVotes || 0).toFixed(4)}</td>
            <td><strong>${(b.newVotes || 0).toFixed(4)}</strong></td>
          </tr>
        `;
      });

      transferTableHtml = `
        <div style="margin-top: 0.75rem;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.35rem;">
            📊 2nd & Subsequent Preferences Distribution
          </div>
          <div class="demo-table-wrap">
            <table class="demo-transfer-table">
              <thead>
                <tr>
                  <th>Continuing Candidate</th>
                  <th>Ballots</th>
                  <th>Transferred Value</th>
                  <th>Prior Tally</th>
                  <th>New Tally</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    this.demoCommentaryBox.className = `demonstrative-box ${stageClass}`;
    this.demoCommentaryBox.innerHTML = `
      <div class="demo-header-row">
        <span class="demo-stage-tag">${step.title}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">${step.subtitle}</span>
      </div>

      <div class="demo-quote-bubble ${stageClass}">
        <span class="demo-quote-icon">📢</span>
        ${step.narrative}
      </div>

      ${mathCardHtml}
      ${transferTableHtml}
    `;

    // Trigger voice announcement
    if (this.voiceEnabled) {
      this.speak(step.speechText || step.narrative);
    }
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

    const maxScale = Math.max(quota * 1.35, ...this.candidates.map(c => round.tallies[c.name] || 0), 1);
    const quotaPct = Math.min(100, (quota / maxScale) * 100);

    sorted.forEach(cand => {
      const votes = round.tallies[cand.name] || 0.0;
      const status = round.candidateStatus[cand.name];
      const pctOfMax = Math.min(100, (votes / maxScale) * 100);
      const pctOfQuota = quota > 0 ? (votes / quota) * 100 : 0;

      const card = document.createElement('div');
      card.className = `candidate-card ${status.toLowerCase()}`;

      let tagLabel = 'Hopeful';
      let tagClass = 'hopeful';
      if (status === CandidateStatus.ELECTED) {
        tagLabel = '✓ Elected';
        tagClass = 'elected';
      } else if (status === CandidateStatus.ELIMINATED) {
        tagLabel = '✗ Eliminated';
        tagClass = 'eliminated';
      }

      card.innerHTML = `
        <div class="candidate-header">
          <div class="candidate-info">
            <div class="candidate-avatar" style="background: ${cand.color}">
              ${cand.name.charAt(0)}
            </div>
            <div>
              <div class="candidate-name">${cand.name}</div>
              <div class="candidate-dept">${cand.dept}</div>
            </div>
          </div>
          <div class="candidate-meta">
            <span class="status-tag ${tagClass}">${tagLabel}</span>
            <div class="vote-total-badge">${votes.toFixed(4)}</div>
          </div>
        </div>

        <div class="progress-track" aria-label="Votes progress towards quota">
          <div class="quota-line-marker" style="left: ${quotaPct.toFixed(1)}%;" title="Winning Quota: ${quota.toFixed(4)}"></div>
          <div class="progress-fill ${status.toLowerCase()}" style="width: ${pctOfMax.toFixed(1)}%;"></div>
        </div>

        <div class="card-footer">
          <div>
            <span>${votes.toFixed(4)}</span> / ${quota.toFixed(4)}
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
        this.currentSubstepIdx = 0;
        this.render();
      });

      this.timelineFeed.appendChild(item);
    });
  }

  showToast(message, type = 'info') {
    if (!this.appToast) return;
    this.appToast.textContent = message;
    this.appToast.className = `app-toast visible ${type}`;
    setTimeout(() => {
      this.appToast.classList.remove('visible');
    }, 3500);
  }
}

// Instantiate application on window load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new STVApp();
});
