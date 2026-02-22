// ===== Intel Summit Check-In App (Core + LevelUps) =====

const GOAL = 50;

// DOM
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");

const greetingEl = document.getElementById("greeting");
const attendeeCountEl = document.getElementById("attendeeCount");
const progressBarEl = document.getElementById("progressBar");

const waterCountEl = document.getElementById("waterCount");
const zeroCountEl = document.getElementById("zeroCount");
const powerCountEl = document.getElementById("powerCount");

// Team card elements (for highlighting winner)
const waterCard = document.querySelector(".team-card.water");
const zeroCard = document.querySelector(".team-card.zero");
const powerCard = document.querySelector(".team-card.power");

// ===== LocalStorage keys =====
const STORAGE_KEY = "intelSummitCheckin_v1";

// Data
let total = 0;
let water = 0;
let zero = 0;
let power = 0;
let attendees = []; // { name, teamValue, teamName }

// ===== Helpers =====
function prettyTeamName(teamValue) {
  if (teamValue === "water") return "Team Water Wise";
  if (teamValue === "zero") return "Team Net Zero";
  if (teamValue === "power") return "Team Renewables";
  return "";
}

function getWinnerTeam() {
  // returns {teamValue, teamName, count}
  const teams = [
    { teamValue: "water", teamName: "Team Water Wise", count: water },
    { teamValue: "zero", teamName: "Team Net Zero", count: zero },
    { teamValue: "power", teamName: "Team Renewables", count: power },
  ];

  teams.sort((a, b) => b.count - a.count);

  // handle tie (optional): if top two counts are equal, say it's a tie
  if (teams.length >= 2 && teams[0].count === teams[1].count) {
    return { teamValue: "tie", teamName: "a tie", count: teams[0].count };
  }

  return teams[0];
}

function highlightWinner(teamValue) {
  // Reset
  [waterCard, zeroCard, powerCard].forEach((card) => {
    if (!card) return;
    card.style.outline = "none";
    card.style.boxShadow = "none";
    card.style.transform = "none";
  });

  // Highlight winner card (simple inline styles so you don't need CSS edits)
  let card = null;
  if (teamValue === "water") card = waterCard;
  if (teamValue === "zero") card = zeroCard;
  if (teamValue === "power") card = powerCard;

  if (card) {
    card.style.outline = "3px solid gold";
    card.style.boxShadow = "0 0 18px rgba(255, 215, 0, 0.55)";
    card.style.transform = "scale(1.02)";
  }
}

function updateUI() {
  attendeeCountEl.textContent = total;

  waterCountEl.textContent = water;
  zeroCountEl.textContent = zero;
  powerCountEl.textContent = power;

  const percent = Math.min((total / GOAL) * 100, 100);
  progressBarEl.style.width = percent + "%";

  renderAttendeeList();
}

function saveToStorage() {
  const payload = { total, water, zero, power, attendees };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    total = Number(data.total) || 0;
    water = Number(data.water) || 0;
    zero = Number(data.zero) || 0;
    power = Number(data.power) || 0;
    attendees = Array.isArray(data.attendees) ? data.attendees : [];
  } catch (e) {
    // If storage is corrupted, start fresh
    total = 0;
    water = 0;
    zero = 0;
    power = 0;
    attendees = [];
  }
}

// ===== Attendee List UI (inserts itself; no HTML edits needed) =====
let attendeeSectionEl = null;
let attendeeListEl = null;

function ensureAttendeeListUI() {
  if (attendeeSectionEl && attendeeListEl) return;

  attendeeSectionEl = document.createElement("div");
  attendeeSectionEl.className = "attendee-list-section";
  attendeeSectionEl.style.marginTop = "18px";

  const title = document.createElement("h3");
  title.textContent = "Attendee List";
  title.style.marginBottom = "10px";

  attendeeListEl = document.createElement("ul");
  attendeeListEl.id = "attendeeList";
  attendeeListEl.style.listStyle = "none";
  attendeeListEl.style.paddingLeft = "0";
  attendeeListEl.style.display = "grid";
  attendeeListEl.style.gap = "8px";

  attendeeSectionEl.appendChild(title);
  attendeeSectionEl.appendChild(attendeeListEl);

  // Insert below the team stats block
  const teamStats = document.querySelector(".team-stats");
  if (teamStats && teamStats.parentElement) {
    teamStats.parentElement.appendChild(attendeeSectionEl);
  } else {
    // fallback: add to body
    document.body.appendChild(attendeeSectionEl);
  }
}

function renderAttendeeList() {
  ensureAttendeeListUI();
  attendeeListEl.innerHTML = "";

  attendees.forEach((a, index) => {
    const li = document.createElement("li");
    li.style.padding = "10px 12px";
    li.style.border = "1px solid rgba(255,255,255,0.12)";
    li.style.borderRadius = "10px";
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.gap = "12px";

    const left = document.createElement("span");
    left.textContent = `${index + 1}. ${a.name}`;

    const right = document.createElement("span");
    right.textContent = a.teamName;
    right.style.opacity = "0.9";

    li.appendChild(left);
    li.appendChild(right);
    attendeeListEl.appendChild(li);
  });
}

// ===== Celebration (goal reached) =====
function maybeCelebrate() {
  if (total < GOAL) return;

  const winner = getWinnerTeam();
  if (winner.teamValue === "tie") {
    greetingEl.textContent = `🎉 Goal reached! It's a tie at ${winner.count} each — amazing turnout!`;
    highlightWinner(null);
  } else {
    greetingEl.textContent = `🎉 Goal reached! Winner: ${winner.teamName} with ${winner.count} attendees!`;
    highlightWinner(winner.teamValue);
  }
}

// ===== Init =====
loadFromStorage();
updateUI();

// ===== Submit handler =====
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const teamValue = teamSelect.value;

  if (name === "" || teamValue === "") {
    greetingEl.textContent = "Please enter your name and select a team.";
    return;
  }

  const teamName = prettyTeamName(teamValue);

  // Update counts
  total++;
  if (teamValue === "water") water++;
  if (teamValue === "zero") zero++;
  if (teamValue === "power") power++;

  // Save attendee
  attendees.push({ name, teamValue, teamName });

  // Greeting
  greetingEl.textContent = `Welcome, ${name}! You checked in for ${teamName}.`;

  // Update UI + storage
  updateUI();
  saveToStorage();

  // Celebration if goal hit
  maybeCelebrate();

  // Reset inputs
  nameInput.value = "";
  teamSelect.selectedIndex