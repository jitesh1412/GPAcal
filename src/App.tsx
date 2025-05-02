import React, { useState, useEffect } from "react";

// Branch color mapping (visual-friendly hex codes)
const BRANCH_COLORS: Record<string, string> = {
  CSE: "#22c55e", // green
  ECE: "#dc2626", // red
  IT: "#92400e", // brown
  IOT: "#f97316", // orange
  EEE: "#7c2d12", // maroon
  CSBS: "#14b8a6", // teal
  MECH: "#0ea5e9", // sky blue
  CSD: "#db2777", // dark pink
  CHE: "#a8a29e", // cement gray
  CSM: "#ea580c", // dark orange
  CIVIL: "#bbf7d0", // light green
};

const GRADE_MAP: Record<string, number> = {
  "A+": 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
};

const GRADE_OPTIONS = [
  { label: "A+", value: 10 },
  { label: "A", value: 9 },
  { label: "B", value: 8 },
  { label: "C", value: 7 },
  { label: "D", value: 6 },
  { label: "E", value: 5 },
  { label: "F", value: 0 },
];

const BRANCH_LIST = [
  "CSE", "ECE", "IT", "IOT", "EEE", "CSBS", "MECH", "CSD", "CHE", "CSM", "CIVIL", "Other"
];

function getBranchColor(branch: string) {
  if (BRANCH_COLORS[branch]) return BRANCH_COLORS[branch];
  // Random pleasant color for 'Other' or missing
  return `hsl(${Math.floor(Math.random()*360)},70%,60%)`;
}

function calcSGPA(subjects: { grade: string; credits: number }[]) {
  let totalPoints = 0;
  let totalCredits = 0;
  for(const s of subjects) {
    totalPoints += (GRADE_MAP[s.grade] ?? 0) * (Number(s.credits) || 0);
    totalCredits += (Number(s.credits) || 0);
  }
  if (totalCredits === 0) return 0;
  return totalPoints / totalCredits;
}

// Semester data type
type SemesterInfo = {
  branch: string;
  semester: number;
  subjects: {
    code: string;
    grade: string;
    credits: number;
  }[];
  sgpa: number;
};

export default function App() {
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState(0);
  const [numSubjects, setNumSubjects] = useState(0);
  const [subjects, setSubjects] = useState(
    Array.from({ length: 6 }, () => ({ code: "", grade: "A+", credits: 3 }))
  );
  const [sgpa, setSGPA] = useState<number | null>(null);
  const [semesters, setSemesters] = useState<SemesterInfo[]>([]);
  const [cgpa, setCGPA] = useState<number>(0);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("rvrjc-sgpa-data");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if(data?.semesters) setSemesters(data.semesters);
      } catch {}
    }
  }, []);
  // Save semesters to localStorage whenever semesters changes
  useEffect(() => {
    localStorage.setItem(
      "rvrjc-sgpa-data",
      JSON.stringify({ semesters })
    );
  }, [semesters]);

  // Update subjects array when number of subjects changes
  useEffect(() => {
    setSubjects((prev) => {
      const current = prev.slice(0, numSubjects);
      while (current.length < numSubjects) {
        current.push({ code: "", grade: "A+", credits: 3 });
      }
      return current;
    });
  }, [numSubjects]);

  // Calculate CGPA whenever semesters changes
  useEffect(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    for(const sem of semesters) {
      const credits = sem.subjects.reduce((a, b) => a + b.credits, 0);
      totalPoints += sem.sgpa * credits;
      totalCredits += credits;
    }
    setCGPA(totalCredits === 0 ? 0 : totalPoints / totalCredits);
  }, [semesters]);

  // Dynamic theme color by branch
  const accentColor = branch ? getBranchColor(branch) : "#818cf8";

  // SGPA calculation
  function handleCalcSGPA() {
    setSGPA(Number(calcSGPA(subjects).toFixed(3)));
  }

  // Save/add semester
  function handleSaveSemester() {
    if (!branch || !semester) return;
    const thisSGPA = calcSGPA(subjects);
    if(thisSGPA === 0) return;
    // Avoid duplicate (branch+semester)
    setSemesters(prev => {
      const filtered = prev.filter(s => !(s.branch === branch && s.semester === semester));
      return [
        ...filtered,
        {
          branch,
          semester,
          subjects: JSON.parse(JSON.stringify(subjects)),
          sgpa: Number(thisSGPA.toFixed(3)),
        },
      ].sort((a, b) => a.semester - b.semester);
    });
    setSGPA(Number(thisSGPA.toFixed(3)));
  }

  function handleRemoveSemester(idx: number) {
    setSemesters(prev => prev.filter((_, i) => i !== idx));
  }

  function handleEditSemester(idx: number) {
    const sem = semesters[idx];
    setBranch(sem.branch);
    setSemester(sem.semester);
    setNumSubjects(sem.subjects.length);
    setSubjects(JSON.parse(JSON.stringify(sem.subjects)));
    setSGPA(sem.sgpa);
  }

  function handleClearAll() {
    setSemesters([]);
    setSGPA(null);
    setCGPA(0);
    localStorage.removeItem("rvrjc-sgpa-data");
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: 'url("Screenshot 2025-05-01 175739.png")' }}
    >
      <div className="backdrop-blur-sm bg-white/90 sm:max-w-xl w-full p-8 rounded-3xl shadow-2xl flex flex-col items-center lift-card border border-zinc-200 relative">
        <img
          src="Screenshot 2025-05-01 175756.png"
          alt="RVR & JC College Logo"
          className="w-24 h-24 mb-2 drop-shadow-lg rounded-full border-4 border-white -mt-24 bg-white"
          style={{ position: 'absolute', top: '-3.5rem', left: '50%', transform: 'translateX(-50%)' }}
        />
        <h1 className="text-3xl font-bold text-center mt-20 mb-2" style={{ color: accentColor }}>
          R.V.R. & J.C. College of Engineering
        </h1>
        <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: accentColor }}>
          SGPA & CGPA Calculator
        </h2>
        {/* Branch selection */}
        <div className="w-full flex flex-col md:flex-row gap-4 mb-6 justify-center">
          <div className="w-full md:w-1/2">
            <label className="block font-medium mb-1">Branch</label>
            <select
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
              style={{ borderColor: accentColor, outlineColor: accentColor }}
              value={branch}
              onChange={e => setBranch(e.target.value)}
            >
              <option value="">Select Branch</option>
              {BRANCH_LIST.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/2">
            <label className="block font-medium mb-1">Semester</label>
            <input
              type="number"
              min={1}
              max={12}
              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
              style={{ borderColor: accentColor, outlineColor: accentColor }}
              value={semester}
              onChange={e => setSemester(Number.parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        {/* Subjects setup */}
        <div className="mb-4 flex flex-row justify-between items-center w-full">
          <label className="font-medium">
            Number of Subjects:
            <input
              type="number"
              min={1}
              max={12}
              value={numSubjects}
              onChange={e => setNumSubjects(Number.parseInt(e.target.value) || 0)}
              className="ml-2 w-16 rounded-md border px-2 py-1 focus:outline-none focus:ring-2"
              style={{ borderColor: accentColor, outlineColor: accentColor }}
            />
          </label>
        </div>
        <div className="w-full mb-4">
          <div className="grid grid-cols-12 gap-2 font-semibold text-center border-b pb-1">
            <div className="col-span-4">Subject Code</div>
            <div className="col-span-4">Grade</div>
            <div className="col-span-4">Credits</div>
          </div>
          {subjects.map((subj, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 mb-1">
              <div className="col-span-4">
                <input
                  type="text"
                  className="w-full rounded border px-2 py-1"
                  style={{ borderColor: accentColor, outlineColor: accentColor }}
                  value={subj.code}
                  onChange={e => {
                    const newValue = e.target.value; // Ensure full text input is captured
                    setSubjects(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], code: newValue }; 
                      return next;
                    });
                  }}
                  onBlur={() => console.log("Final input:", subj.code)}
                  placeholder="e.g. MA101"
                />
              </div>
              <div className="col-span-4">
                <select
                  className="w-full rounded border px-2 py-1"
                  style={{ borderColor: accentColor, outlineColor: accentColor }}
                  value={subj.grade}
                  onChange={e => {
                    const next = [...subjects];
                    next[idx].grade = e.target.value;
                    setSubjects(next);
                  }}
                >
                  {GRADE_OPTIONS.map(opt => (
                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-4">
                <input
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  className="w-full rounded border px-2 py-1"
                  style={{ borderColor: accentColor, outlineColor: accentColor }}
                  value={subj.credits}
                 onChange={e => {
                    const next = [...subjects];
                    next[idx].credits = Number.parseFloat(e.target.value) || 0;
                    setSubjects(next);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Calculation & Action Buttons */}
        <div className="w-full flex flex-col md:flex-row gap-4">
          <button
            className="text-white font-semibold rounded-lg px-5 py-2 mb-2"
            style={{ backgroundColor: accentColor }}
            onClick={handleCalcSGPA}
            type="button"
          >
            Calculate SGPA
          </button>
          <button
            className="text-white bg-zinc-700 hover:bg-zinc-800 font-semibold rounded-lg px-5 py-2 mb-2"
            type="button"
            onClick={handleSaveSemester}
          >
            Save/Add Semester
          </button>
          <button
            className="font-semibold rounded-lg px-4 py-2 text-zinc-700 border border-zinc-300 bg-white hover:bg-red-100"
            type="button"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        </div>
        {sgpa !== null && (
          <div className="mt-4 mb-2 w-full flex items-center justify-center">
            <span className="font-bold text-lg">SGPA:</span>
            <span
              className="ml-2 px-3 py-1 rounded-xl text-white text-lg font-bold shadow"
              style={{ backgroundColor: accentColor }}
            >
              {sgpa}
            </span>
          </div>
        )}
        {/* Saved semesters and CGPA display */}
        {semesters.length > 0 && (
          <div className="mt-6 w-full">
            <div className="mb-2 flex items-center gap-4">
              <span className="font-semibold text-xl">Semesters</span>
              <span className="font-medium ml-auto">CGPA:
                <span
                  className="ml-2 px-3 py-1 rounded-xl text-white font-bold text-lg shadow"
                  style={{ backgroundColor: accentColor }}
                >
                  {cgpa.toFixed(3)}
                </span>
              </span>
            </div>
            <div className="divide-y rounded-xl border bg-white">
              {semesters.map((sem, idx) => (
                <div key={sem.semester + sem.branch} className="flex flex-col md:flex-row gap-2 items-center py-2 px-2">
                  <div className="font-semibold mr-2 w-24 text-center">Sem {sem.semester}</div>
                  <div className="text-sm text-zinc-600 w-24 text-center">SGPA: <b>{sem.sgpa}</b></div>
                  <div className="flex-1 text-xs text-zinc-500 overflow-x-auto whitespace-nowrap">
                    {sem.subjects.map(s => `${s.code || '?'}: ${s.grade} (${s.credits})`).join(" | ")}
                  </div>
                  <button className="px-2 py-1 text-blue-600 hover:underline text-xs" onClick={() => handleEditSemester(idx)}>Edit</button>
                  <button className="px-2 py-1 text-red-500 hover:underline text-xs" onClick={() => handleRemoveSemester(idx)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
