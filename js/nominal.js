/**
 * Nominal Rolls Registry & Public Voter Directory
 * ================================================
 * Stores, queries, and manages voter eligibility data across academic departments.
 */

export const INITIAL_NOMINAL_ROLL = [
  // Computer Science
  { id: "VOT-1001", rollNo: "24-CS-001", name: "Aaron Mathew", dept: "Computer Science", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1002", rollNo: "24-CS-002", name: "Aiswarya Rajan", dept: "Computer Science", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1003", rollNo: "24-CS-003", name: "Akash Sharma", dept: "Computer Science", year: "Semester 5", status: "Ballot Issued" },
  { id: "VOT-1004", rollNo: "24-CS-004", name: "Ananya Pillai", dept: "Computer Science", year: "Semester 1", status: "Eligible" },
  { id: "VOT-1005", rollNo: "24-CS-005", name: "Basil K. George", dept: "Computer Science", year: "Semester 5", status: "Eligible" },
  { id: "VOT-1006", rollNo: "24-CS-006", name: "Fathima Noora", dept: "Computer Science", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1007", rollNo: "24-CS-007", name: "Gautham Krishna", dept: "Computer Science", year: "Semester 5", status: "Eligible" },

  // Physics
  { id: "VOT-1008", rollNo: "24-PH-001", name: "Hafiz Mohammed", dept: "Physics", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1009", rollNo: "24-PH-002", name: "Haritha Nair", dept: "Physics", year: "Semester 1", status: "Eligible" },
  { id: "VOT-1010", rollNo: "24-PH-003", name: "Joel Joseph", dept: "Physics", year: "Semester 5", status: "Eligible" },
  { id: "VOT-1011", rollNo: "24-PH-004", name: "Karthika Menon", dept: "Physics", year: "Semester 3", status: "Ballot Issued" },
  { id: "VOT-1012", rollNo: "24-PH-005", name: "Mridula Varma", dept: "Physics", year: "Semester 5", status: "Eligible" },

  // Mathematics
  { id: "VOT-1013", rollNo: "24-MA-001", name: "Nandana S.", dept: "Mathematics", year: "Semester 1", status: "Eligible" },
  { id: "VOT-1014", rollNo: "24-MA-002", name: "Nikhil Das", dept: "Mathematics", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1015", rollNo: "24-MA-003", name: "Pranav Mohan", dept: "Mathematics", year: "Semester 5", status: "Eligible" },
  { id: "VOT-1016", rollNo: "24-MA-004", name: "Rhea Thomas", dept: "Mathematics", year: "Semester 3", status: "Eligible" },

  // Commerce
  { id: "VOT-1017", rollNo: "24-CM-001", name: "Rohit Nambiar", dept: "Commerce", year: "Semester 5", status: "Eligible" },
  { id: "VOT-1018", rollNo: "24-CM-002", name: "Sana Mariyam", dept: "Commerce", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1019", rollNo: "24-CM-003", name: "Siddharth Paul", dept: "Commerce", year: "Semester 1", status: "Ballot Issued" },
  { id: "VOT-1020", rollNo: "24-CM-004", name: "Sneha Kurian", dept: "Commerce", year: "Semester 5", status: "Eligible" },
  { id: "VOT-1021", rollNo: "24-CM-005", name: "Varun Vinod", dept: "Commerce", year: "Semester 3", status: "Eligible" },

  // Economics
  { id: "VOT-1022", rollNo: "24-EC-001", name: "Aditi Ramesh", dept: "Economics", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1023", rollNo: "24-EC-002", name: "Devika Prasad", dept: "Economics", year: "Semester 5", status: "Eligible" },
  { id: "VOT-1024", rollNo: "24-EC-003", name: "Irfan Habeeb", dept: "Economics", year: "Semester 1", status: "Eligible" },
  { id: "VOT-1025", rollNo: "24-EC-004", name: "Kiran Jacob", dept: "Economics", year: "Semester 3", status: "Eligible" },

  // Botany
  { id: "VOT-1026", rollNo: "24-BO-001", name: "Athira Sreekumar", dept: "Botany", year: "Semester 5", status: "Eligible" },
  { id: "VOT-1027", rollNo: "24-BO-002", name: "Cyril Peter", dept: "Botany", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1028", rollNo: "24-BO-003", name: "Gayathri Unni", dept: "Botany", year: "Semester 1", status: "Eligible" },

  // English
  { id: "VOT-1029", rollNo: "24-EN-001", name: "Farhan Ali", dept: "English", year: "Semester 3", status: "Eligible" },
  { id: "VOT-1030", rollNo: "24-EN-002", name: "Meera Krishnan", dept: "English", year: "Semester 5", status: "Ballot Issued" },
  { id: "VOT-1031", rollNo: "24-EN-003", name: "Vivek Sundar", dept: "English", year: "Semester 1", status: "Eligible" }
];

const LOCAL_STORAGE_KEY = 'preferential_nominal_roll';

export class NominalRollService {
  constructor() {
    this.roll = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load stored nominal roll, using default", e);
    }
    return [...INITIAL_NOMINAL_ROLL];
  }

  save() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.roll));
    } catch (e) {
      console.error("Failed to save nominal roll to localStorage", e);
    }
  }

  getAll() {
    return [...this.roll];
  }

  getDepartments() {
    const depts = new Set(this.roll.map(v => v.dept));
    return Array.from(depts).sort();
  }

  filter(query = '', department = '') {
    const cleanQ = query.trim().toLowerCase();
    return this.roll.filter(voter => {
      const matchQ = !cleanQ || 
        voter.name.toLowerCase().includes(cleanQ) || 
        voter.rollNo.toLowerCase().includes(cleanQ) ||
        voter.id.toLowerCase().includes(cleanQ);
      const matchDept = !department || voter.dept === department;
      return matchQ && matchDept;
    });
  }

  toggleVoterStatus(voterId) {
    const voter = this.roll.find(v => v.id === voterId);
    if (voter) {
      voter.status = voter.status === 'Eligible' ? 'Ballot Issued' : 'Eligible';
      this.save();
      return voter;
    }
    return null;
  }

  importCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("CSV must have at least a header and one data row.");

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = header.findIndex(h => h.includes('name'));
    const rollIdx = header.findIndex(h => h.includes('roll') || h.includes('adm') || h.includes('id'));
    const deptIdx = header.findIndex(h => h.includes('dept') || h.includes('department'));
    const yearIdx = header.findIndex(h => h.includes('year') || h.includes('sem') || h.includes('class'));

    if (nameIdx === -1) throw new Error("CSV must contain a 'Name' column.");

    const imported = [];
    let idCounter = this.roll.length + 1001;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const name = cols[nameIdx];
      if (!name) continue;

      const rollNo = rollIdx !== -1 && cols[rollIdx] ? cols[rollIdx] : `ROLL-${i}`;
      const dept = deptIdx !== -1 && cols[deptIdx] ? cols[deptIdx] : 'General';
      const year = yearIdx !== -1 && cols[yearIdx] ? cols[yearIdx] : 'Undergraduate';

      imported.push({
        id: `VOT-${idCounter++}`,
        rollNo,
        name,
        dept,
        year,
        status: 'Eligible'
      });
    }

    if (imported.length === 0) throw new Error("No valid records found to import.");

    this.roll = imported;
    this.save();
    return this.roll.length;
  }

  resetToDefault() {
    this.roll = [...INITIAL_NOMINAL_ROLL];
    this.save();
    return this.roll.length;
  }

  toCSV() {
    const headers = ['Voter ID', 'Roll / Adm No', 'Full Name', 'Department', 'Semester / Year', 'Status'];
    const rows = this.roll.map(v => [
      v.id,
      `"${v.rollNo}"`,
      `"${v.name}"`,
      `"${v.dept}"`,
      `"${v.year}"`,
      v.status
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }
}
