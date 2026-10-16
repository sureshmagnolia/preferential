/**
 * Candidate Nomination Portal Service
 * ====================================
 * Manages nomination filing, validation, slip generation, and verification registry.
 */

const STORAGE_NOMINATIONS_KEY = 'preferential_nominations';

export const INITIAL_NOMINATIONS = [
  {
    id: "NOM-2026-001",
    post: "University Senate Representative (3 Vacancies)",
    candidateName: "Dr. Eleanor Vance",
    candidateRoll: "FAC-CS-101",
    candidateDept: "Computer Science",
    candidateClass: "Associate Professor",
    candidatePhone: "+91 98470 11223",
    candidateEmail: "e.vance@university.edu",
    proposerName: "Aaron Mathew",
    proposerRoll: "24-CS-001",
    proposerDept: "Computer Science",
    seconderName: "Aiswarya Rajan",
    seconderRoll: "24-CS-002",
    seconderDept: "Computer Science",
    submittedAt: "2026-10-14 10:30:00",
    status: "Scrutinized & Accepted",
    hash: "E8F2-99B1-402A"
  },
  {
    id: "NOM-2026-002",
    post: "University Senate Representative (3 Vacancies)",
    candidateName: "Prof. Robert Martinez",
    candidateRoll: "FAC-PH-204",
    candidateDept: "Physics",
    candidateClass: "Professor",
    candidatePhone: "+91 94471 22334",
    candidateEmail: "r.martinez@university.edu",
    proposerName: "Hafiz Mohammed",
    proposerRoll: "24-PH-001",
    proposerDept: "Physics",
    seconderName: "Joel Joseph",
    seconderRoll: "24-PH-003",
    seconderDept: "Physics",
    submittedAt: "2026-10-14 11:15:00",
    status: "Scrutinized & Accepted",
    hash: "31B9-7C04-8E11"
  },
  {
    id: "NOM-2026-003",
    post: "University Senate Representative (3 Vacancies)",
    candidateName: "Dr. Charlotte Hayes",
    candidateRoll: "FAC-EC-305",
    candidateDept: "Economics",
    candidateClass: "Assistant Professor",
    candidatePhone: "+91 98460 33445",
    candidateEmail: "c.hayes@university.edu",
    proposerName: "Aditi Ramesh",
    proposerRoll: "24-EC-001",
    proposerDept: "Economics",
    seconderName: "Kiran Jacob",
    seconderRoll: "24-EC-004",
    seconderDept: "Economics",
    submittedAt: "2026-10-14 14:00:00",
    status: "Scrutinized & Accepted",
    hash: "6C4F-29DA-5509"
  }
];

export class NominationService {
  constructor() {
    this.nominations = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_NOMINATIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load stored nominations", e);
    }
    return [...INITIAL_NOMINATIONS];
  }

  save() {
    try {
      localStorage.setItem(STORAGE_NOMINATIONS_KEY, JSON.stringify(this.nominations));
    } catch (e) {
      console.error("Failed to save nominations", e);
    }
  }

  getAll() {
    return [...this.nominations];
  }

  submitNomination(data) {
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const hash = `${Math.random().toString(16).substring(2, 6).toUpperCase()}-${randomHex}-${Date.now().toString(16).slice(-4).toUpperCase()}`;
    const id = `NOM-2026-${String(this.nominations.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const submittedAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

    const newNom = {
      id,
      post: data.post.trim(),
      candidateName: data.candidateName.trim(),
      candidateRoll: data.candidateRoll.trim(),
      candidateDept: data.candidateDept.trim(),
      candidateClass: data.candidateClass.trim() || "Undergraduate / Postgraduate",
      candidatePhone: data.candidatePhone?.trim() || "—",
      candidateEmail: data.candidateEmail?.trim() || "—",
      proposerName: data.proposerName.trim(),
      proposerRoll: data.proposerRoll.trim(),
      proposerDept: data.proposerDept.trim(),
      seconderName: data.seconderName.trim(),
      seconderRoll: data.seconderRoll.trim(),
      seconderDept: data.seconderDept.trim(),
      submittedAt,
      status: "Submitted & Awaiting Scrutiny",
      hash
    };

    this.nominations.unshift(newNom);
    this.save();
    return newNom;
  }

  generatePrintableSlipHtml(nom) {
    return `
      <div class="nomination-slip-document" id="printable-nomination-slip">
        <div class="nom-slip-header">
          <div class="nom-slip-emblem">🏛️</div>
          <div class="nom-slip-heading">OFFICE OF THE RETURNING OFFICER</div>
          <div class="nom-slip-subheading">OFFICIAL PREFERENTIAL ELECTION NOMINATION PAPER</div>
          <div class="nom-slip-badge">Form No. 2A &bull; Statutory Candidate Declaration</div>
        </div>

        <div class="nom-meta-row">
          <div><strong>Nomination Reference:</strong> <code>${nom.id}</code></div>
          <div><strong>Security Hash:</strong> <code>${nom.hash}</code></div>
          <div><strong>Timestamp:</strong> ${nom.submittedAt}</div>
          <div><strong>Scrutiny Status:</strong> <span class="badge-status-pill">${nom.status}</span></div>
        </div>

        <div class="nom-section-title">1. ELECTION POST APPLIED FOR</div>
        <div class="nom-box">
          <div class="nom-field-label">Office / Constituency:</div>
          <div class="nom-field-value large"><strong>${nom.post}</strong></div>
        </div>

        <div class="nom-section-title">2. CANDIDATE PARTICULARS</div>
        <div class="nom-grid-2">
          <div class="nom-box">
            <div class="nom-field-label">Full Name of Candidate:</div>
            <div class="nom-field-value"><strong>${nom.candidateName}</strong></div>
          </div>
          <div class="nom-box">
            <div class="nom-field-label">Admission / Roll / Staff No:</div>
            <div class="nom-field-value"><code>${nom.candidateRoll}</code></div>
          </div>
          <div class="nom-box">
            <div class="nom-field-label">Academic Department:</div>
            <div class="nom-field-value">${nom.candidateDept}</div>
          </div>
          <div class="nom-box">
            <div class="nom-field-label">Semester / Class / Designation:</div>
            <div class="nom-field-value">${nom.candidateClass}</div>
          </div>
        </div>

        <div class="nom-section-title">3. PROPOSER & SECONDER VERIFICATION</div>
        <div class="nom-grid-2">
          <div class="nom-box">
            <div class="nom-field-label">Proposer Name & Department:</div>
            <div class="nom-field-value">${nom.proposerName} (${nom.proposerDept})</div>
            <div class="nom-field-sub">Roll No: <code>${nom.proposerRoll}</code></div>
            <div class="sign-line-placeholder">Signature of Proposer</div>
          </div>
          <div class="nom-box">
            <div class="nom-field-label">Seconder Name & Department:</div>
            <div class="nom-field-value">${nom.seconderName} (${nom.seconderDept})</div>
            <div class="nom-field-sub">Roll No: <code>${nom.seconderRoll}</code></div>
            <div class="sign-line-placeholder">Signature of Seconder</div>
          </div>
        </div>

        <div class="nom-section-title">4. CANDIDATE STATUTORY CONSENT & DECLARATION</div>
        <div class="nom-declaration-box">
          I, <strong>${nom.candidateName}</strong>, hereby declare that I agree to this nomination, am qualified under the institution's preferential election constitution, and have not been disqualified from contesting by any disciplinary or statutory provisions.
          <div class="sign-line-placeholder" style="margin-top: 2rem;">Signature of Candidate</div>
        </div>

        <div class="nom-slip-footer">
          <div class="officer-seal-box">
            <div class="seal-circle">OFFICIAL SEAL<br>RETURNING OFFICER</div>
            <div class="seal-caption">Scrutiny Date & Signature</div>
          </div>
          <div class="qr-mock-box">
            <div style="font-family: monospace; font-size: 0.7rem; color: #475569;">
              VERIFIED SECURE DIGITALLY<br>
              ID: ${nom.id}<br>
              HASH: ${nom.hash}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
