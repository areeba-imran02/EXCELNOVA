const KEY = "excelnova-workspace-v1";
const initial = {
  activePage: "dashboard",
  theme: "light",
  currentProject: null,
  projects: [],
  sheet: {
    name: "Sales Data",
    rows: [
      ["Product", "Region", "Units", "Unit Price", "Revenue"],
      ["Laptop", "North", 12, 850, "=C2*D2"],
      ["Phone", "South", 25, 420, "=C3*D3"],
      ["Tablet", "East", 18, 260, "=C4*D4"],
      ["Monitor", "West", 9, 310, "=C5*D5"],
      ["Keyboard", "North", 30, 45, "=C6*D6"]
    ]
  },
  chatHistory: [],
  user: null
};
let state;
try { state = { ...initial, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
catch { state = structuredClone(initial); }
export function getState() { return state; }
export function setState(patch) { state = { ...state, ...patch }; persist(); return state; }
export function updateSheet(rows) { state.sheet = { ...state.sheet, rows }; persist(); }
export function persist() { localStorage.setItem(KEY, JSON.stringify(state)); }
export function resetLocalData() { state = structuredClone(initial); persist(); }
