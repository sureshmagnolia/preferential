/**
 * Candidate Nomination Portal Service
 * ====================================
 * Government College Chittur - College Staff Council Election 2026-27
 * Official List of Accepted Nominations.
 */

const STORAGE_NOMINATIONS_KEY = 'preferential_nominations';

export const INITIAL_NOMINATIONS = [
  {
    id: "NOM-2026-001",
    post: "College Staff Council Representative (3 Vacancies)",
    candidateName: "AJITHA R",
    candidateRoll: "GCC-019",
    candidateDept: "Economics",
    candidateClass: "Assistant Professor",
    candidatePhone: "",
    candidateEmail: "",
    proposerName: "Faculty Elector",
    proposerRoll: "GCC-020",
    proposerDept: "Economics",
    seconderName: "Faculty Elector",
    seconderRoll: "GCC-024",
    seconderDept: "Economics",
    submittedAt: "2026-10-24 11:00:00",
    status: "Scrutinized & Accepted",
    hash: "E8F2-99B1-402A"
  },
  {
    id: "NOM-2026-002",
    post: "College Staff Council Representative (3 Vacancies)",
    candidateName: "BREJESH N S",
    candidateRoll: "GCC-020",
    candidateDept: "Economics",
    candidateClass: "Assistant Professor",
    candidatePhone: "",
    candidateEmail: "",
    proposerName: "Faculty Elector",
    proposerRoll: "GCC-019",
    proposerDept: "Economics",
    seconderName: "Faculty Elector",
    seconderRoll: "GCC-024",
    seconderDept: "Economics",
    submittedAt: "2026-10-24 11:30:00",
    status: "Scrutinized & Accepted",
    hash: "31B9-7C04-8E11"
  },
  {
    id: "NOM-2026-003",
    post: "College Staff Council Representative (3 Vacancies)",
    candidateName: "MANU CHAKRAVARTHY S",
    candidateRoll: "GCC-072",
    candidateDept: "Physical Education",
    candidateClass: "Assistant Professor",
    candidatePhone: "",
    candidateEmail: "",
    proposerName: "Faculty Elector",
    proposerRoll: "GCC-092",
    proposerDept: "Zoology",
    seconderName: "Faculty Elector",
    seconderRoll: "GCC-001",
    seconderDept: "Principal",
    submittedAt: "2026-10-24 12:00:00",
    status: "Scrutinized & Accepted",
    hash: "6C4F-29DA-5509"
  },
  {
    id: "NOM-2026-004",
    post: "College Staff Council Representative (3 Vacancies)",
    candidateName: "NAGARAJ S",
    candidateRoll: "GCC-024",
    candidateDept: "Economics",
    candidateClass: "Associate Professor",
    candidatePhone: "",
    candidateEmail: "",
    proposerName: "Faculty Elector",
    proposerRoll: "GCC-019",
    proposerDept: "Economics",
    seconderName: "Faculty Elector",
    seconderRoll: "GCC-020",
    seconderDept: "Economics",
    submittedAt: "2026-10-24 12:30:00",
    status: "Scrutinized & Accepted",
    hash: "8A3D-41CE-7801"
  },
  {
    id: "NOM-2026-005",
    post: "College Staff Council Representative (3 Vacancies)",
    candidateName: "SOLOMON C D",
    candidateRoll: "GCC-092",
    candidateDept: "Zoology",
    candidateClass: "Assistant Professor",
    candidatePhone: "",
    candidateEmail: "",
    proposerName: "Faculty Elector",
    proposerRoll: "GCC-072",
    proposerDept: "Physical Education",
    seconderName: "Faculty Elector",
    seconderRoll: "GCC-019",
    seconderDept: "Economics",
    submittedAt: "2026-10-24 13:00:00",
    status: "Scrutinized & Accepted",
    hash: "9B2E-53FF-1092"
  }
];

export class NominationService {
  constructor() {
    this.nominations = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_NOMINATIONS_KEY);
      if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored data contains old mock names like Charlotte or Eleanor, invalidate and use GCC candidates
          const hasOldMock = parsed.some(p => p.candidateName && (
            p.candidateName.includes("Charlotte") || 
            p.candidateName.includes("Eleanor") || 
            p.candidateName.includes("Martinez")
          ));
          if (!hasOldMock) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("Could not load stored nominations", e);
    }
    const initial = [...INITIAL_NOMINATIONS];
    this.save(initial);
    return initial;
  }

  save(data = null) {
    try {
      const toSave = data || this.nominations;
      localStorage.setItem(STORAGE_NOMINATIONS_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save nominations to localStorage", e);
    }
  }

  getAll() {
    return [...this.nominations];
  }

  getAcceptedCandidates() {
    return this.nominations
      .filter(n => n.status.includes("Accepted"))
      .map(n => ({
        name: n.candidateName,
        dept: n.candidateDept,
        post: n.post,
        roll: n.candidateRoll
      }));
  }

  submitNomination(data) {
    const nextSeq = this.nominations.length + 1;
    const id = `NOM-2026-${String(nextSeq).padStart(3, '0')}`;
    const submittedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const hash = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                 Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                 Math.random().toString(36).substring(2, 6).toUpperCase();

    const newNom = {
      id,
      post: data.post || "College Staff Council Representative (3 Vacancies)",
      candidateName: data.candidateName.trim(),
      candidateRoll: data.candidateRoll.trim(),
      candidateDept: data.candidateDept.trim(),
      candidateClass: data.candidateClass.trim(),
      candidatePhone: data.candidatePhone.trim(),
      candidateEmail: data.candidateEmail.trim(),
      proposerName: data.proposerName.trim(),
      proposerRoll: data.proposerRoll.trim(),
      proposerDept: data.proposerDept.trim(),
      seconderName: data.seconderName.trim(),
      seconderRoll: data.seconderRoll.trim(),
      seconderDept: data.seconderDept.trim(),
      submittedAt,
      status: "Scrutinized & Accepted",
      hash
    };

    this.nominations.unshift(newNom);
    this.save();
    return newNom;
  }

  updateStatus(nomId, newStatus) {
    const nom = this.nominations.find(n => n.id === nomId);
    if (nom) {
      nom.status = newStatus;
      this.save();
      return nom;
    }
    return null;
  }

  resetDefault() {
    this.nominations = [...INITIAL_NOMINATIONS];
    this.save();
  }
}
