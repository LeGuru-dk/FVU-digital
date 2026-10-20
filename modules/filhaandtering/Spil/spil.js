"use strict";

const state = { completed: new Set(), selectedFile: null, selectedPerson: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function setFeedback(element, message, type = "") {
  element.textContent = message;
  element.className = `feedback${type ? ` ${type}` : ""}`;
}

function markCompleted(game) {
  state.completed.add(game);
  updateProgress();
}

function unmarkCompleted(game) {
  state.completed.delete(game);
  updateProgress();
}

function updateProgress() {
  const count = state.completed.size;
  $("#progressText").textContent = `${count} af 5 missioner gennemført`;
  $("#progressBar").style.width = `${count * 20}%`;
  const finish = $(".finish");
  if (count === 5) {
    finish.classList.add("complete");
    $("#finishText").textContent = "Tillykke! Du har gennemført alle missioner og er nu Filagent.";
  } else {
    finish.classList.remove("complete");
    $("#finishText").textContent = `Du mangler ${5 - count} mission${5 - count === 1 ? "" : "er"} for at blive Filagent.`;
  }
}

// Spil 1: Sortér filer
const sortFiles = [
  { id: "ferie", name: "Familieferie_2025.jpg", folder: "Billeder" },
  { id: "regning", name: "Elregning_2026-01.pdf", folder: "Økonomi" },
  { id: "kage", name: "Chokoladekage.docx", folder: "Opskrifter" },
  { id: "job", name: "Jobansøgning_Butik.docx", folder: "Jobsøgning" },
  { id: "foto", name: "Portræt_Maja.jpg", folder: "Billeder" }
];
let placedFiles = new Set();

function renderSortGame() {
  state.selectedFile = null;
  placedFiles = new Set();
  $("#filePile").innerHTML = sortFiles.map(file => `<button class="choice-card" type="button" data-file="${file.id}">📄 ${file.name}</button>`).join("");
  $("#folderChoices").innerHTML = ["Billeder", "Økonomi", "Opskrifter", "Jobsøgning"].map(folder => `<button class="folder-button" type="button" data-folder="${folder}">📁 ${folder}</button>`).join("");
  $("#sortScore").textContent = "0 af 5 placeret";
  setFeedback($("#sortFeedback"), "Vælg først en fil.");
  unmarkCompleted("sort");
}

$("#filePile").addEventListener("click", event => {
  const button = event.target.closest("[data-file]");
  if (!button || button.classList.contains("done")) return;
  $$("[data-file]").forEach(item => item.classList.remove("selected"));
  button.classList.add("selected");
  state.selectedFile = button.dataset.file;
  setFeedback($("#sortFeedback"), `Du har valgt ${button.textContent.trim()}. Vælg nu en mappe.`);
});

$("#folderChoices").addEventListener("click", event => {
  const button = event.target.closest("[data-folder]");
  if (!button) return;
  if (!state.selectedFile) {
    setFeedback($("#sortFeedback"), "Vælg en fil, før du vælger en mappe.", "error");
    return;
  }
  const file = sortFiles.find(item => item.id === state.selectedFile);
  if (file.folder === button.dataset.folder) {
    placedFiles.add(file.id);
    const fileButton = $(`[data-file="${file.id}"]`);
    fileButton.classList.remove("selected");
    fileButton.classList.add("done");
    fileButton.disabled = true;
    state.selectedFile = null;
    $("#sortScore").textContent = `${placedFiles.size} af 5 placeret`;
    setFeedback($("#sortFeedback"), `Godt valgt. ${file.name} passer i ${file.folder}.`, "success");
    if (placedFiles.size === sortFiles.length) markCompleted("sort");
  } else {
    setFeedback($("#sortFeedback"), `Prøv igen. Tænk på, hvad filen ${file.name} indeholder.`, "error");
  }
});

// Spil 2: Find filen
const fileTree = {
  name: "Dokumenter", type: "folder", children: [
    { name: "Privat", type: "folder", children: [
      { name: "Ferie", type: "folder", children: [
        { name: "2024", type: "folder", children: [{ name: "Pakkeliste_2024.docx", type: "file" }] },
        { name: "2025", type: "folder", children: [{ name: "Ferieplan_2025.docx", type: "file", target: true }, { name: "Hotel.pdf", type: "file" }] }
      ] },
      { name: "Regninger", type: "folder", children: [{ name: "Elregning_2026-01.pdf", type: "file" }] }
    ] },
    { name: "Undervisning", type: "folder", children: [{ name: "Noter.docx", type: "file" }] },
    { name: "Økonomi", type: "folder", children: [{ name: "Budget.xlsx", type: "file" }] }
  ]
};
let currentPath = [fileTree];
let findAttempts = 0;

function renderExplorer() {
  const current = currentPath.at(-1);
  $("#breadcrumbs").innerHTML = currentPath.map((node, index) => `<button type="button" data-crumb="${index}">${node.name}</button>`).join("<span aria-hidden='true'>›</span>");
  $("#folderView").innerHTML = current.children.map((item, index) => `<button type="button" data-item="${index}">${item.type === "folder" ? "📁" : "📄"} ${item.name}</button>`).join("");
}

function resetFindGame() {
  currentPath = [fileTree];
  findAttempts = 0;
  $("#findAttempts").textContent = "0";
  setFeedback($("#findFeedback"), "Åbn en mappe for at lede.");
  renderExplorer();
  unmarkCompleted("find");
}

$("#folderView").addEventListener("click", event => {
  const button = event.target.closest("[data-item]");
  if (!button) return;
  const item = currentPath.at(-1).children[Number(button.dataset.item)];
  findAttempts += 1;
  $("#findAttempts").textContent = String(findAttempts);
  if (item.type === "folder") {
    currentPath.push(item);
    renderExplorer();
    setFeedback($("#findFeedback"), `Du har åbnet mappen ${item.name}.`);
  } else if (item.target) {
    setFeedback($("#findFeedback"), `Fundet! Stien er ${currentPath.map(node => node.name).join(" > ")} > ${item.name}.`, "success");
    markCompleted("find");
  } else {
    setFeedback($("#findFeedback"), `${item.name} er ikke den fil, du leder efter. Prøv igen.`, "error");
  }
});

$("#breadcrumbs").addEventListener("click", event => {
  const button = event.target.closest("[data-crumb]");
  if (!button) return;
  currentPath = currentPath.slice(0, Number(button.dataset.crumb) + 1);
  renderExplorer();
});

// Spil 3: Omdøb
const renameRules = [
  { field: "rename1", extension: ".pdf", groups: [["el", "regning"], ["2026"], ["01", "januar"]] },
  { field: "rename2", extension: ".jpg", groups: [["ferie", "familie"], ["italien"], ["2025"]] },
  { field: "rename3", extension: ".docx", groups: [["ansøgning", "jobansøgning"], ["butik"], ["version2", "version 2", "v2"]] }
];

$("#renameForm").addEventListener("submit", event => {
  event.preventDefault();
  const results = renameRules.map(rule => {
    const value = event.currentTarget.elements[rule.field].value.trim().toLowerCase();
    const hasExtension = value.endsWith(rule.extension);
    const hasAllParts = rule.groups.every(group => group.some(term => value.includes(term)));
    return { field: rule.field, ok: hasExtension && hasAllParts, hasExtension };
  });
  if (results.some(result => !event.currentTarget.elements[result.field].value.trim())) {
    setFeedback($("#renameFeedback"), "Udfyld alle tre felter, før du kontrollerer.", "error");
    return;
  }
  results.forEach(result => event.currentTarget.elements[result.field].setAttribute("aria-invalid", String(!result.ok)));
  const correct = results.filter(result => result.ok).length;
  if (correct === 3) {
    setFeedback($("#renameFeedback"), "Flot. Alle navnene beskriver indholdet og beholder den rigtige filtype.", "success");
    markCompleted("rename");
  } else {
    setFeedback($("#renameFeedback"), `${correct} af 3 navne opfylder modellen. Kontrollér indhold, dato/år eller version og filtypen til sidst.`, "error");
  }
});

function resetRenameGame() {
  $("#renameForm").reset();
  $$("input", $("#renameForm")).forEach(input => input.removeAttribute("aria-invalid"));
  setFeedback($("#renameFeedback"), "Udfyld alle tre felter.");
  unmarkCompleted("rename");
}

// Spil 4: Flyt eller kopiér
$("#moveCopyForm").addEventListener("submit", event => {
  event.preventDefault();
  const answers = ["move", "copy", "move", "copy"];
  const choices = answers.map((_, index) => event.currentTarget.elements[`mc${index + 1}`].value);
  if (choices.some(choice => !choice)) {
    setFeedback($("#moveCopyFeedback"), "Besvar alle fire situationer.", "error");
    return;
  }
  const score = choices.filter((choice, index) => choice === answers[index]).length;
  if (score === 4) {
    setFeedback($("#moveCopyFeedback"), "Alle fire er rigtige. Flyt ved ny fast placering; kopiér, når originalen også skal bevares.", "success");
    markCompleted("moveCopy");
  } else {
    setFeedback($("#moveCopyFeedback"), `${score} af 4 er rigtige. Se igen på, om filen skal skifte plads, eller om der skal være en ekstra kopi.`, "error");
  }
});

function resetMoveCopyGame() {
  $("#moveCopyForm").reset();
  setFeedback($("#moveCopyFeedback"), "Besvar alle fire situationer.");
  unmarkCompleted("moveCopy");
}

// Spil 5: Backup-battle
const people = [
  { id: "anna", label: "Anna", detail: "Kun telefon", risk: "Høj risiko" },
  { id: "bo", label: "Bo", detail: "Telefon + synkronisering til sky", risk: "Mellem risiko" },
  { id: "camilla", label: "Camilla", detail: "Telefon + sky + særskilt backup", risk: "Lav risiko" }
];
let placedPeople = new Set();

function renderRiskGame() {
  state.selectedPerson = null;
  placedPeople = new Set();
  $("#peopleChoices").innerHTML = people.map(person => `<button class="choice-card" type="button" data-person="${person.id}"><strong>${person.label}</strong><br><small>${person.detail}</small></button>`).join("");
  $("#riskChoices").innerHTML = ["Høj risiko", "Mellem risiko", "Lav risiko"].map(risk => `<button class="risk-button" type="button" data-risk="${risk}">${risk}</button>`).join("");
  $("#riskScore").textContent = "0 af 3 placeret";
  $("#eventRound").hidden = true;
  $("#eventForm").reset();
  setFeedback($("#riskFeedback"), "Vælg først en person.");
  setFeedback($("#eventFeedback"), "");
  unmarkCompleted("risk");
}

$("#peopleChoices").addEventListener("click", event => {
  const button = event.target.closest("[data-person]");
  if (!button || button.classList.contains("done")) return;
  $$("[data-person]").forEach(item => item.classList.remove("selected"));
  button.classList.add("selected");
  state.selectedPerson = button.dataset.person;
  setFeedback($("#riskFeedback"), `Du har valgt ${button.textContent.trim()}. Vælg nu et risikoniveau.`);
});

$("#riskChoices").addEventListener("click", event => {
  const button = event.target.closest("[data-risk]");
  if (!button) return;
  if (!state.selectedPerson) {
    setFeedback($("#riskFeedback"), "Vælg en person først.", "error");
    return;
  }
  const person = people.find(item => item.id === state.selectedPerson);
  if (person.risk === button.dataset.risk) {
    placedPeople.add(person.id);
    const personButton = $(`[data-person="${person.id}"]`);
    personButton.classList.remove("selected");
    personButton.classList.add("done");
    personButton.disabled = true;
    state.selectedPerson = null;
    $("#riskScore").textContent = `${placedPeople.size} af 3 placeret`;
    setFeedback($("#riskFeedback"), `Rigtigt. ${person.label}: ${person.risk}.`, "success");
    if (placedPeople.size === people.length) $("#eventRound").hidden = false;
  } else {
    setFeedback($("#riskFeedback"), `Prøv igen. Se på, hvor mange uafhængige steder ${person.label}s billeder findes.`, "error");
  }
});

$("#eventForm").addEventListener("submit", event => {
  event.preventDefault();
  const answer = event.currentTarget.elements.event.value;
  if (!answer) {
    setFeedback($("#eventFeedback"), "Vælg et svar.", "error");
  } else if (answer === "cloud") {
    setFeedback($("#eventFeedback"), "Rigtigt. Kopien i cloudtjenesten kan bruges, når telefonen er væk.", "success");
    markCompleted("risk");
  } else {
    setFeedback($("#eventFeedback"), "Prøv igen. Billederne findes også i cloudtjenesten.", "error");
  }
});

// Fælles nulstilling
$$('[data-reset]').forEach(button => button.addEventListener("click", () => {
  const game = button.dataset.reset;
  if (game === "sort") renderSortGame();
  if (game === "find") resetFindGame();
  if (game === "rename") resetRenameGame();
  if (game === "moveCopy") resetMoveCopyGame();
  if (game === "risk") renderRiskGame();
}));

$("#resetAll").addEventListener("click", () => {
  renderSortGame();
  resetFindGame();
  resetRenameGame();
  resetMoveCopyGame();
  renderRiskGame();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

renderSortGame();
resetFindGame();
resetRenameGame();
resetMoveCopyGame();
renderRiskGame();
updateProgress();
