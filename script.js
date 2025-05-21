let habits = [];
let badHabits = [];
let isListening = false;
let recognition;

const habitInput = document.getElementById("habitInput");
const feedback = document.getElementById("feedback");
const habitList = document.getElementById("habitList");
const badHabitList = document.getElementById("badHabitList");
const micButton = document.getElementById("micButton");
const progress = document.getElementById("progress");
const modalBackdrop = document.getElementById("modalBackdrop");
const customAlertModal = document.getElementById("customAlertModal");
const customAlertTitle = document.getElementById("customAlertTitle");
const badHabitTips = {
  "smoking": "Try deep breathing exercises and keep your hands busy to avoid smoking.",
  "procrastination": "Break tasks into smaller steps and set timers to stay on track.",
  "nail biting": "Keep your nails trimmed and use bitter nail polish to discourage biting.",
  "junk food": "Plan healthy meals and keep nutritious snacks handy to avoid junk food.",
  "overspending": "Create a budget and track your expenses regularly to control spending.",
  "drinking alcohol":"please avoid the alcohol.",
  "gossiping":" Sort out negative gossip from the rest.",
  "excessive screen time":"set limits on devices, create screen-free zones, and engage in offline activities like reading or hobbies.",
  "Lying":"Lying can erode trust, damage relationships, and create a hostile environment.",
  "illicit drugs":"avoiding places where you know drugs and alcohol will be available."
};
window.onload = () => {
  const savedHabits = localStorage.getItem("habits");
  const savedBadHabits = localStorage.getItem("badHabits");
  if (savedHabits) {
    habits = JSON.parse(savedHabits);
  }
  if (savedBadHabits) {
    badHabits = JSON.parse(savedBadHabits);
  }

  renderHabits();
  renderBadHabits();
  habitInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addHabit();
    }
  });
};
function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
  localStorage.setItem("badHabits", JSON.stringify(badHabits));
}
function isBadHabit(name) {
  name = name.toLowerCase();
  return Object.keys(badHabitTips).some(bad => name.includes(bad));
}
function speakTip(text) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}
function speakText(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function addHabitFromVoice(name) {
  name = name.trim();
  if (!name) return;

  if (isBadHabit(name)) {
    const alreadyExists = badHabits.find(h => h.name.toLowerCase() === name.toLowerCase());
    if (!alreadyExists) {
      badHabits.push({name: name, completed: false});
      saveHabits();
      renderBadHabits();
      feedback.textContent = `Added bad habit: ${name}`;
      for (const bad in badHabitTips) {
        if (name.toLowerCase().includes(bad)) {
          speakTip(badHabitTips[bad]);
          break;
        }
        }

    } else {
      feedback.textContent = `${name} already exists in bad habits.`;
    }
  } else {
    const alreadyExists = habits.find(h => h.name.toLowerCase() === name.toLowerCase());
    if (!alreadyExists) {
      habits.push({name: name, completed: false});
      saveHabits();
      renderHabits();
      feedback.textContent = `Added: ${name}`;
      speakText(`Added good habit: ${name}`);
    } else {
      feedback.textContent = `${name} already exists.`;
      speakText(`${name} already exists in good habits.`);
    }
  }
}

function addHabit() {
  const name = habitInput.value.trim();
  if (!name) return;
  
  addHabitFromVoice(name);
  habitInput.value = "";
}

function renderHabits() {
  habitList.innerHTML = "";
  habits.forEach((habit, i) => {
    const li = document.createElement("li");
    li.className = "flex items-center justify-between bg-pink-900/30 rounded px-4 py-2 shadow-lg";
    li.innerHTML = `
      <span class="${habit.completed ? "completed" : ""}">${habit.name}</span>
      <button class="neon-button px-3 py-1 rounded text-sm">${habit.completed ? "Undo" : "Done"}</button>
    `;
    li.querySelector("button").onclick = () => {
      habits[i].completed = !habits[i].completed;
      saveHabits();
      renderHabits();
      updateProgress();
    };
    habitList.appendChild(li);
  });
  updateProgress();
}

function renderBadHabits() {
  badHabitList.innerHTML = "";
  badHabits.forEach((habit, i) => {
    const li = document.createElement("li");
    li.className = "flex flex-col bg-purple-900/40 rounded px-4 py-3 shadow-lg";
    li.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-semibold">${habit.name}</span>
      </div>
      <p class="mt-1 text-pink-300 italic text-sm">${getTipForHabit(habit.name)}</p>
    `;
    badHabitList.appendChild(li);
  });
  updateProgress();
}

function getTipForHabit(name) {
  for (const bad in badHabitTips) {
    if (name.toLowerCase().includes(bad)) {
      return badHabitTips[bad];
    }
  }
  return "";
}

function updateProgress() {
  const totalGood = habits.length;
  const completedGood = habits.filter(h => h.completed).length;
  progress.textContent = `${completedGood} / ${totalGood} good habits completed`;
}
function showCustomAlert(message) {
  customAlertTitle.textContent = message;
  customAlertModal.style.display = "flex";
}

function hideCustomAlert() {
  customAlertModal.style.display = "none";
}

function toggleListening() {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    showCustomAlert("Speech Recognition API not supported in this browser.");
    return;
  }

  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  feedback.textContent = "Listening...";
  micButton.textContent = "🎤";
  isListening = true;

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = event => {
    const spokenText = event.results[0][0].transcript;
    feedback.textContent = `Heard: "${spokenText}"`;
    addHabitFromVoice(spokenText);
  };

  recognition.onerror = event => {
    feedback.textContent = `Error: ${event.error}`;
    stopListening();
  };

  recognition.onend = () => {
    stopListening();
  };

  recognition.start();
}

function stopListening() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  isListening = false;
  micButton.textContent = "🎙️";
  if (!feedback.textContent.startsWith("Heard:")) {
    feedback.textContent = "Tap to speak";
  }
}

function showResetModal() {
  modalBackdrop.style.display = "flex";
}

function hideResetModal() {
  modalBackdrop.style.display = "none";
}

function resetHabits() {
  habits = [];
  badHabits = [];
  saveHabits();
  renderHabits();
  renderBadHabits();
  feedback.textContent = "All habits reset.";
  hideResetModal();
  updateProgress();
}
updateProgress();