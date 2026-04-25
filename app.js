// ============================================================
// FitnessApp — logique principale
// ============================================================

const STORAGE_KEY = "fitnessapp_v1";
const DAYS = Object.keys(PROGRAM);
const DAY_NAMES_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const defaultState = {
  profile: { age: 19, height: 175, weight: 65, activity: 1.55, goal: "lean" },
  foodLog: {},        // { "YYYY-MM-DD": [ {name, kcal, p, c, f} ] }
  weights: [],        // [ {date, kg} ]
  sessions: [],       // [ {date, day, exercises: [{name, sets:[{weight,reps,done}]}]} ]
  prs: {}             // { exerciseName: { weight, reps, date } }
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

// ----- Calculs nutrition -----
function computeTargets() {
  const { age, height, weight, activity, goal } = state.profile;
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = bmr * activity;
  const goalAdj = { cut: -300, maintain: 0, lean: 300, bulk: 500 }[goal] ?? 300;
  const target = Math.round(tdee + goalAdj);
  // Macros
  const protein = Math.round(weight * 2);                       // 2 g/kg
  const fat = Math.round((target * 0.25) / 9);                   // 25% kcal
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target, protein, carbs, fat };
}

// ============================================================
// Tabs
// ============================================================
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

document.getElementById("goto-workout").addEventListener("click", () => {
  document.querySelector('[data-tab="workout"]').click();
});

// ============================================================
// Dashboard
// ============================================================
function renderDashboard() {
  const t = computeTargets();
  const now = new Date();
  document.getElementById("today-date").textContent =
    now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  // Séance prévue selon jour de la semaine (lundi=index 0 dans PROGRAM)
  const dayMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
  const idx = dayMap[now.getDay()];
  document.getElementById("today-session").textContent = DAYS[idx];

  // Calories
  const log = state.foodLog[todayKey()] || [];
  const sum = log.reduce((acc, f) => ({
    kcal: acc.kcal + (+f.kcal || 0),
    p: acc.p + (+f.p || 0),
    c: acc.c + (+f.c || 0),
    f: acc.f + (+f.f || 0)
  }), { kcal: 0, p: 0, c: 0, f: 0 });

  document.getElementById("kcal-current").textContent = Math.round(sum.kcal);
  document.getElementById("kcal-target").textContent = t.target;

  setBar("bar-prot", "val-prot", sum.p, t.protein, "g");
  setBar("bar-carb", "val-carb", sum.c, t.carbs, "g");
  setBar("bar-fat", "val-fat", sum.f, t.fat, "g");

  // Poids
  const lastWeight = state.weights.length
    ? state.weights[state.weights.length - 1].kg
    : state.profile.weight;
  document.getElementById("current-weight").textContent = lastWeight;

  // Hebdo
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // lundi
  weekStart.setHours(0, 0, 0, 0);
  const done = state.sessions.filter(s => new Date(s.date) >= weekStart).length;
  document.getElementById("weekly-done").textContent = done;
  document.getElementById("streak").textContent = computeStreak();

  // Header user stats
  document.getElementById("user-stats").innerHTML =
    `${state.profile.age} ans · ${state.profile.height} cm · ${lastWeight} kg<br>Cible : ${t.target} kcal/j`;
}

function setBar(barId, valId, current, target, unit) {
  const pct = Math.min(100, Math.round((current / target) * 100)) || 0;
  document.getElementById(barId).style.width = pct + "%";
  document.getElementById(valId).textContent = `${Math.round(current)} / ${target} ${unit}`;
}

function computeStreak() {
  if (!state.sessions.length) return 0;
  const dates = new Set(state.sessions.map(s => s.date.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (streak === 0 && key === todayKey()) {
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

// ============================================================
// Workout
// ============================================================
function renderDaySelector() {
  const sel = document.getElementById("day-select");
  sel.innerHTML = DAYS.map(d => `<option value="${d}">${d}</option>`).join("");
  // Préselectionner aujourd'hui
  const dayMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
  sel.value = DAYS[dayMap[new Date().getDay()]];
  sel.addEventListener("change", renderWorkout);
  renderWorkout();
}

function renderWorkout() {
  const day = document.getElementById("day-select").value;
  const exercises = PROGRAM[day];
  const container = document.getElementById("workout-content");
  container.innerHTML = exercises.map((ex, i) => `
    <div class="exercise" data-idx="${i}">
      <div class="exercise-header">
        <div>
          <div class="exercise-name">${ex.name}</div>
          <div class="exercise-meta">${ex.sets > 0 ? ex.sets + " séries × " + ex.reps + " reps · repos " + ex.rest : ex.reps}</div>
        </div>
      </div>
      <div class="exercise-tip">💡 ${ex.tip}</div>
      ${ex.sets > 0 ? renderSetInputs(ex.sets, i) : ""}
    </div>
  `).join("");

  if (exercises.some(e => e.sets > 0)) {
    container.insertAdjacentHTML("beforeend", `
      <div class="session-actions">
        <button class="primary" id="save-session">Enregistrer la séance</button>
        <button class="ghost" id="clear-session">Effacer</button>
      </div>
    `);
    document.getElementById("save-session").addEventListener("click", saveSession);
    document.getElementById("clear-session").addEventListener("click", renderWorkout);
  }
}

function renderSetInputs(nb, exIdx) {
  let html = '<div class="sets-track">';
  for (let s = 0; s < nb; s++) {
    html += `
      <div class="set-input">
        <label>Série ${s + 1}</label>
        <input type="number" placeholder="kg" data-ex="${exIdx}" data-set="${s}" data-field="weight" />
        <input type="number" placeholder="reps" data-ex="${exIdx}" data-set="${s}" data-field="reps" />
      </div>`;
  }
  html += '</div>';
  return html;
}

function saveSession() {
  const day = document.getElementById("day-select").value;
  const exercises = PROGRAM[day];
  const data = exercises.map((ex, i) => {
    const sets = [];
    for (let s = 0; s < ex.sets; s++) {
      const w = document.querySelector(`input[data-ex="${i}"][data-set="${s}"][data-field="weight"]`);
      const r = document.querySelector(`input[data-ex="${i}"][data-set="${s}"][data-field="reps"]`);
      if (w && r && (w.value || r.value)) {
        const weight = +w.value || 0;
        const reps = +r.value || 0;
        sets.push({ weight, reps });
        // Mise à jour PR
        const cur = state.prs[ex.name];
        if (!cur || weight > cur.weight || (weight === cur.weight && reps > cur.reps)) {
          state.prs[ex.name] = { weight, reps, date: todayKey() };
        }
      }
    }
    return { name: ex.name, sets };
  }).filter(e => e.sets.length > 0);

  if (!data.length) {
    alert("Renseigne au moins une série avant d'enregistrer.");
    return;
  }
  state.sessions.push({ date: new Date().toISOString(), day, exercises: data });
  saveState();
  alert("Séance enregistrée 💪");
  renderDashboard();
  renderHistory();
  renderPRs();
}

// ============================================================
// Nutrition
// ============================================================
function renderMealPlan() {
  document.getElementById("meal-plan").innerHTML = MEAL_PLAN.map(m => `
    <div class="meal">
      <div class="meal-title">${m.name}</div>
      <div class="meal-items">${m.items.map(i => "• " + i).join("<br>")}</div>
      <div class="meal-macros">${m.macros}</div>
    </div>
  `).join("");
}

function renderQuickFoods() {
  document.getElementById("quick-foods-list").innerHTML = QUICK_FOODS.map((f, i) =>
    `<button data-idx="${i}">${f.name} (+${f.kcal} kcal)</button>`
  ).join("");
  document.querySelectorAll("#quick-foods-list button").forEach(b => {
    b.addEventListener("click", () => {
      const f = QUICK_FOODS[+b.dataset.idx];
      addFood({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f });
    });
  });
}

function renderFoodLog() {
  document.getElementById("food-date").textContent =
    "Journée du " + new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const log = state.foodLog[todayKey()] || [];
  const ul = document.getElementById("food-log");
  if (!log.length) {
    ul.innerHTML = '<li style="justify-content:center;color:var(--muted)">Aucun aliment ajouté aujourd\'hui</li>';
    return;
  }
  ul.innerHTML = log.map((f, i) => `
    <li>
      <span><strong>${f.name}</strong> · ${f.kcal} kcal · P${f.p} C${f.c} L${f.f}</span>
      <button class="remove" data-idx="${i}">Retirer</button>
    </li>
  `).join("");
  ul.querySelectorAll(".remove").forEach(b => {
    b.addEventListener("click", () => {
      log.splice(+b.dataset.idx, 1);
      saveState();
      renderFoodLog();
      renderDashboard();
    });
  });
}

function addFood(food) {
  const k = todayKey();
  if (!state.foodLog[k]) state.foodLog[k] = [];
  state.foodLog[k].push(food);
  saveState();
  renderFoodLog();
  renderDashboard();
}

document.getElementById("food-form").addEventListener("submit", e => {
  e.preventDefault();
  addFood({
    name: document.getElementById("food-name").value,
    kcal: +document.getElementById("food-kcal").value,
    p: +document.getElementById("food-prot").value,
    c: +document.getElementById("food-carb").value,
    f: +document.getElementById("food-fat").value
  });
  e.target.reset();
});

// ============================================================
// Progress — poids, historique, PRs
// ============================================================
document.getElementById("weight-form").addEventListener("submit", e => {
  e.preventDefault();
  const kg = +document.getElementById("weight-input").value;
  state.weights.push({ date: todayKey(), kg });
  state.profile.weight = kg;
  saveState();
  e.target.reset();
  renderWeightChart();
  renderDashboard();
  renderProfile();
});

function renderWeightChart() {
  const canvas = document.getElementById("weight-chart");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const pts = state.weights.slice(-30);
  if (pts.length < 2) {
    ctx.fillStyle = "#8a96ab";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Ajoute au moins 2 pesées pour voir la courbe", W / 2, H / 2);
    return;
  }

  const weights = pts.map(p => p.kg);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const padX = 40, padY = 30;

  // Axes
  ctx.strokeStyle = "#2a3445";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, padY);
  ctx.lineTo(padX, H - padY);
  ctx.lineTo(W - padX, H - padY);
  ctx.stroke();

  // Grid + labels
  ctx.fillStyle = "#8a96ab";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const v = min + ((max - min) * i) / 4;
    const y = H - padY - ((H - 2 * padY) * i) / 4;
    ctx.fillText(v.toFixed(1), padX - 6, y + 4);
    ctx.strokeStyle = "#1a2230";
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W - padX, y); ctx.stroke();
  }

  // Ligne
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = padX + ((W - 2 * padX) * i) / (pts.length - 1);
    const y = H - padY - ((H - 2 * padY) * (p.kg - min)) / (max - min);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points
  ctx.fillStyle = "#22d3ee";
  pts.forEach((p, i) => {
    const x = padX + ((W - 2 * padX) * i) / (pts.length - 1);
    const y = H - padY - ((H - 2 * padY) * (p.kg - min)) / (max - min);
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
  });
}

function renderHistory() {
  const ul = document.getElementById("session-history");
  if (!state.sessions.length) {
    ul.innerHTML = '<li style="justify-content:center;color:var(--muted)">Aucune séance enregistrée</li>';
    return;
  }
  ul.innerHTML = state.sessions.slice(-20).reverse().map(s => `
    <li>
      <span class="session-name">${s.day.split("—")[1]?.trim() || s.day}</span>
      <span class="session-date">${formatDate(s.date)}</span>
    </li>
  `).join("");
}

function renderPRs() {
  const ul = document.getElementById("pr-list");
  const entries = Object.entries(state.prs);
  if (!entries.length) {
    ul.innerHTML = '<li style="color:var(--muted)">Aucun PR enregistré pour l\'instant</li>';
    return;
  }
  ul.innerHTML = entries
    .sort((a, b) => b[1].weight - a[1].weight)
    .map(([name, pr]) => `
      <li><span>${name}</span><span class="pr-value">${pr.weight} kg × ${pr.reps}</span></li>
    `).join("");
}

// ============================================================
// Profile
// ============================================================
function renderProfile() {
  document.getElementById("age").value = state.profile.age;
  document.getElementById("height").value = state.profile.height;
  document.getElementById("weight").value = state.profile.weight;
  document.getElementById("activity").value = state.profile.activity;
  document.getElementById("goal").value = state.profile.goal;
  const t = computeTargets();
  document.getElementById("bmr").textContent = t.bmr;
  document.getElementById("tdee").textContent = t.tdee;
  document.getElementById("target-kcal").textContent =
    `${t.target} (P:${t.protein}g · C:${t.carbs}g · L:${t.fat}g)`;
}

document.getElementById("profile-form").addEventListener("submit", e => {
  e.preventDefault();
  state.profile = {
    age: +document.getElementById("age").value,
    height: +document.getElementById("height").value,
    weight: +document.getElementById("weight").value,
    activity: +document.getElementById("activity").value,
    goal: document.getElementById("goal").value
  };
  saveState();
  renderProfile();
  renderDashboard();
});

document.getElementById("reset-data").addEventListener("click", () => {
  if (confirm("Effacer toutes les données ? Action irréversible.")) {
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    initAll();
  }
});

// ============================================================
// Init
// ============================================================
function initAll() {
  renderDashboard();
  renderDaySelector();
  renderMealPlan();
  renderQuickFoods();
  renderFoodLog();
  renderWeightChart();
  renderHistory();
  renderPRs();
  renderProfile();
}

initAll();
