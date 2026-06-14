// ==========================================
// 1. INITIAL DATA LOADING
// ==========================================
let workouts = JSON.parse(localStorage.getItem("breakpoint")) || [];
let skills = JSON.parse(localStorage.getItem("skills")) || {};
let handstandSkills = JSON.parse(localStorage.getItem("handstandSkills")) || {};
let frontLeverSkills = JSON.parse(localStorage.getItem("frontLeverSkills")) || {};

let customExercises = JSON.parse(localStorage.getItem("customExercises")) || ["Push-ups", "Pull-ups", "Dips"];
let warmupExercises = JSON.parse(localStorage.getItem("warmupExercises")) || ["Wrist Circles", "Shoulder Dislocates", "Cat-Cow"];

let currentWorkout = [];

// ==========================================
// 2. DATABASE MANAGEMENT
// ==========================================

function renderDropdowns() {
    const exSelect = document.getElementById("exercise-builder");
    if (exSelect) {
        exSelect.innerHTML = "";
        customExercises.forEach(ex => {
            const opt = document.createElement("option");
            opt.value = opt.textContent = ex;
            exSelect.appendChild(opt);
        });
    }

    const wuSelect = document.getElementById("warmup-builder");
    if (wuSelect) {
        wuSelect.innerHTML = "";
        warmupExercises.forEach(wu => {
            const opt = document.createElement("option");
            opt.value = opt.textContent = wu;
            wuSelect.appendChild(opt);
        });
    }
}

function addNewWarmupToList() {
    const input = document.getElementById("new-warmup-name");
    const name = input.value.trim();
    if (name && !warmupExercises.includes(name)) {
        warmupExercises.push(name);
        localStorage.setItem("warmupExercises", JSON.stringify(warmupExercises));
        input.value = "";
        renderDropdowns();
    }
}

function deleteWarmupFromList() {
    const select = document.getElementById("warmup-builder");
    const name = select.value;
    if (name && confirm(`Remove "${name}" from Warm-ups?`)) {
        warmupExercises = warmupExercises.filter(w => w !== name);
        localStorage.setItem("warmupExercises", JSON.stringify(warmupExercises));
        renderDropdowns();
    }
}

function addNewExerciseToList() {
    const input = document.getElementById("new-exercise-name");
    const name = input.value.trim();
    if (name && !customExercises.includes(name)) {
        customExercises.push(name);
        localStorage.setItem("customExercises", JSON.stringify(customExercises));
        input.value = "";
        renderDropdowns();
    }
}

function deleteExerciseFromList() {
    const select = document.getElementById("exercise-builder");
    const name = select.value;
    if (name && confirm(`Remove "${name}"?`)) {
        customExercises = customExercises.filter(ex => ex !== name);
        localStorage.setItem("customExercises", JSON.stringify(customExercises));
        renderDropdowns();
    }
}

// ==========================================
// 3. WORKOUT LOGIC
// ==========================================

function addWarmupToWorkout() {
    const exercise = document.getElementById("warmup-builder").value;
    const reps = Number(document.getElementById("warmup-reps").value);
    if (!reps) return alert("Enter reps/seconds!");
    currentWorkout.push({ exercise, sets: [reps, reps, reps], isWarmup: true, notes: "" });
    renderCurrentWorkout();
    document.getElementById("warmup-reps").value = "";
}

function addExercise() {
    const exercise = document.getElementById("exercise-builder").value;
    const sets = [
        Number(document.getElementById("set1").value),
        Number(document.getElementById("set2").value),
        Number(document.getElementById("set3").value),
        Number(document.getElementById("set4").value)
    ].filter(s => s > 0);
    if (sets.length === 0) return alert("Enter sets!");
    currentWorkout.push({ exercise, sets, isWarmup: false, notes: document.getElementById("workout-notes").value });
    renderCurrentWorkout();
    ["set1", "set2", "set3", "set4", "workout-notes"].forEach(id => document.getElementById(id).value = "");
}

function renderCurrentWorkout() {
    let html = "";
    currentWorkout.forEach((item, index) => {
        const color = item.isWarmup ? '#ff9800' : '#2196F3';
        html += `
        <div class="workout-entry" style="border-left: 4px solid ${color}">
            <strong>${item.isWarmup ? '🔥' : '💪'} ${item.exercise}</strong><br>
            ${item.sets.join(" / ")}
            ${item.notes ? `<br><small>📝 ${item.notes}</small>` : ""}
            <br><button onclick="removeExercise(${index})" class="delete-btn" style="font-size: 10px;">❌ Remove</button>
        </div>`;
    });
    document.getElementById("current-workout").innerHTML = html;
}

function removeExercise(index) {
    currentWorkout.splice(index, 1);
    renderCurrentWorkout();
}

function saveFullWorkout() {
    if (currentWorkout.length === 0) return;
    workouts.push({ date: new Date().toLocaleDateString(), exercises: [...currentWorkout] });
    localStorage.setItem("breakpoint", JSON.stringify(workouts));
    currentWorkout = [];
    renderCurrentWorkout();
    render();
}

// ==========================================
// 4. HISTORY LOGIC (NEW)
// ==========================================

function renderHistory() {
    const historyList = document.getElementById("workout-history-list");
    if (!historyList) return;

    if (workouts.length === 0) {
        historyList.innerHTML = "<p>No workouts recorded yet.</p>";
        return;
    }

    let html = "";
    // Show newest workouts first
    [...workouts].reverse().forEach((workout, reversedIndex) => {
        const actualIndex = workouts.length - 1 - reversedIndex;
        
        html += `
        <div class="card" style="margin-bottom: 20px; border-top: 4px solid #444;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0;">📅 ${workout.date}</h3>
                <button onclick="deleteWorkout(${actualIndex})" class="delete-btn" style="padding: 5px 10px;">🗑️ Delete</button>
            </div>
            <hr>
            <div style="margin-top: 10px;">
        `;

        workout.exercises.forEach(ex => {
            const icon = ex.isWarmup ? "🔥" : "💪";
            html += `
                <div style="margin-bottom: 8px;">
                    <strong>${icon} ${ex.exercise}</strong>: ${ex.sets.join(" / ")}
                    ${ex.notes ? `<br><small style="color: #888; margin-left: 20px;">📝 ${ex.notes}</small>` : ""}
                </div>
            `;
        });

        html += `</div></div>`;
    });

    historyList.innerHTML = html;
}

function deleteWorkout(index) {
    if (confirm("Are you sure you want to delete this workout from history?")) {
        workouts.splice(index, 1);
        localStorage.setItem("breakpoint", JSON.stringify(workouts));
        renderHistory();
        render(); // Update dashboard stats
    }
}

// ==========================================
// 5. STATS & STREAK
// ==========================================

function calculateStreak() {
    if (workouts.length === 0) return 0;
    const uniqueDates = [...new Set(workouts.map(w => w.date))].map(d => new Date(d)).sort((a, b) => b - a);
    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWorkout = new Date(uniqueDates[0]);
    lastWorkout.setHours(0,0,0,0);
    const diff = Math.floor((today - lastWorkout) / 86400000);
    if (diff > 1) return 0;
    for (let i = 0; i < uniqueDates.length; i++) {
        if (i === 0) { streak = 1; continue; }
        let gap = (new Date(uniqueDates[i-1]).setHours(0,0,0,0) - new Date(uniqueDates[i]).setHours(0,0,0,0)) / 86400000;
        if (gap === 1) streak++; else break;
    }
    return streak;
}

function getPRs() {
    const prs = {};
    workouts.forEach(w => {
        if (!w.exercises) return;
        w.exercises.forEach(ex => {
            if (ex.isWarmup) return;
            const best = Math.max(...ex.sets);
            if (!prs[ex.exercise] || best > prs[ex.exercise]) prs[ex.exercise] = best;
        });
    });
    return prs;
}

// ==========================================
// 6. DASHBOARD & SKILLS
// ==========================================

function render() {
    document.getElementById("total-workouts").textContent = workouts.length;
    document.getElementById("streak").textContent = calculateStreak() + " Days";

    if (workouts.length > 0) {
        const latest = workouts[workouts.length - 1];
        let latestHTML = "";
        latest.exercises.forEach(ex => {
            latestHTML += `<div><strong>${ex.isWarmup ? '🔥' : '💪'} ${ex.exercise}</strong>: ${ex.sets.join("/")}</div>`;
        });
        document.getElementById("latest-workout").innerHTML = latestHTML;
    }

    const prs = getPRs();
    let prsHTML = "";
    Object.entries(prs).forEach(([ex, val]) => { prsHTML += `<div class="pr">🏆 ${ex}: ${val}</div>`; });
    document.getElementById("prs").innerHTML = prsHTML;
}

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
    // Special: If going to history, render it
    if(pageId === 'history-page') renderHistory();
}

function toggleSkillGeneric(button, storageObj, storageKey, selector, renderFn) {
    const buttons = [...document.querySelectorAll(selector)];
    const index = Number(button.dataset.index);
    const skillName = button.textContent.replace("✓ ", "").replace("🔒 ", "").trim();
    if (index > 0) {
        const prev = buttons[index - 1].textContent.replace("✓ ", "").replace("🔒 ", "").trim();
        if (!storageObj[prev]) return;
    }
    storageObj[skillName] = !storageObj[skillName];
    localStorage.setItem(storageKey, JSON.stringify(storageObj));
    renderFn();
    render();
}

function toggleSkill(btn) { toggleSkillGeneric(btn, skills, "skills", "#planche-skills .skill-btn", renderSkills); }
function toggleHandstand(btn) { toggleSkillGeneric(btn, handstandSkills, "handstandSkills", ".handstand-btn", renderHandstandSkills); }
function toggleFrontLever(btn) { toggleSkillGeneric(btn, frontLeverSkills, "frontLeverSkills", ".frontlever-btn", renderFrontLeverSkills); }

function renderSkillCategory(selector, storageObj, progressId, textId) {
    const buttons = [...document.querySelectorAll(selector)];
    let completed = 0;
    buttons.forEach((btn, i) => {
        const skill = btn.textContent.replace("✓ ", "").replace("🔒 ", "").trim();
        btn.classList.remove("skill-complete", "skill-locked");
        let locked = (i > 0 && !storageObj[buttons[i-1].textContent.replace("✓ ", "").replace("🔒 ", "").trim()]);
        if (storageObj[skill]) { btn.classList.add("skill-complete"); btn.innerHTML = "✓ " + skill; completed++; }
        else if (locked) { btn.classList.add("skill-locked"); btn.innerHTML = "🔒 " + skill; }
        else btn.innerHTML = skill;
    });
    const pct = Math.round((completed / buttons.length) * 100) || 0;
    document.getElementById(progressId).style.width = pct + "%";
    document.getElementById(textId).textContent = pct + "%";
}

function renderSkills() { renderSkillCategory("#planche-skills .skill-btn", skills, "planche-progress-bar", "planche-progress-text"); }
function renderHandstandSkills() { renderSkillCategory(".handstand-btn", handstandSkills, "handstand-progress-bar", "handstand-progress-text"); }
function renderFrontLeverSkills() { renderSkillCategory(".frontlever-btn", frontLeverSkills, "frontlever-progress-bar", "frontlever-progress-text"); }

// ==========================================
// 7. INITIALIZE APP
// ==========================================
showPage("dashboard-page");
render();
renderSkills();
renderHandstandSkills();
renderFrontLeverSkills();
renderDropdowns();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}