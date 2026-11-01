"use strict";

const levels = [
  ["kat","hus","bil","bog","mad","sol","mus","vej","dag","lys","træ","sø","øje","år"],
  ["skole","kaffe","morgen","aften","venner","mappe","filen","musen","tastatur","søndag","lørdag"],
  ["computer","dokument","internet","adgangskode","besked","billeder","arbejde","familie","øvelse"],
  ["sikkerhed","downloads","genvejstast","tekstbehandling","kommunikation","undervisning","digitalisering"]
];

const els = {
  track: document.querySelector("#track"), answer: document.querySelector("#answer"),
  level: document.querySelector("#level"), correct: document.querySelector("#correct"),
  streak: document.querySelector("#streak"), best: document.querySelector("#best"),
  progress: document.querySelector("#progress"), feedback: document.querySelector("#feedback"),
  pause: document.querySelector("#pause"), overlay: document.querySelector("#overlay"),
  resume: document.querySelector("#resume"), sound: document.querySelector("#sound")
};

let level = 0, levelCorrect = 0, totalCorrect = 0, streak = 0, best = 0;
let duration = 10, word = "", wordEl = null, frame = null, started = null;
let paused = false, soundOn = true, lastWord = "";
const wordsPerLevel = 10;

function randomWord(){
  const choices = levels[level].filter(w => w !== lastWord);
  const selected = choices[Math.floor(Math.random() * choices.length)] || levels[level][0];
  lastWord = selected;
  return selected;
}
function tone(freq=520, length=.08){
  if(!soundOn) return;
  try { const ctx = new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.value=freq; g.gain.value=.05; o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+length); o.stop(ctx.currentTime+length); } catch(e){}
}
function update(){
  els.level.textContent = level + 1; els.correct.textContent = totalCorrect;
  els.streak.textContent = streak; els.best.textContent = best;
  els.progress.style.width = `${(levelCorrect / wordsPerLevel) * 100}%`;
}
function message(text,type="") { els.feedback.textContent=text; els.feedback.className=`feedback ${type}`; }
function removeWord(){ if(frame) cancelAnimationFrame(frame); frame=null; if(wordEl) wordEl.remove(); wordEl=null; }
function nextWord(){
  removeWord(); if(paused) return;
  word=randomWord(); els.answer.value="";
  wordEl=document.createElement("span"); wordEl.className="moving-word"; wordEl.textContent=word; els.track.appendChild(wordEl);
  const start=els.track.clientWidth+10, end=48-wordEl.offsetWidth; started=null;
  function animate(time){
    if(paused) return;
    if(!started) started=time;
    const p=Math.min((time-started)/(duration*1000),1);
    wordEl.style.left=`${start+(end-start)*p}px`;
    if(p<1) frame=requestAnimationFrame(animate); else missed();
  }
  frame=requestAnimationFrame(animate); els.answer.focus();
}
function success(){
  totalCorrect++; levelCorrect++; streak++; best=Math.max(best,streak); duration=Math.max(4.5,duration*.96);
  tone(); message("Rigtigt! Godt skrevet.","ok");
  if(levelCorrect>=wordsPerLevel){
    levelCorrect=0;
    if(level<levels.length-1){ level++; duration=Math.max(7,duration+1.5); message(`Flot! Du er nu på niveau ${level+1}.`,"ok"); }
    else { duration=Math.max(4.5,duration*.95); message("Flot! Du fortsætter på det højeste niveau.","ok"); }
  }
  update(); setTimeout(nextWord,350);
}
function missed(){
  streak=0; duration=Math.min(13,duration+1.2); tone(230,.12);
  message(`Ordet var “${word}”. Næste ord kommer lidt langsommere.`,"help"); update(); setTimeout(nextWord,900);
}
function setPaused(value){
  paused=value; removeWord(); els.overlay.hidden=!value; els.pause.textContent=value?"Fortsæt":"Pause";
  if(value){ els.answer.blur(); } else { message("Godt, vi fortsætter."); nextWord(); }
}
els.answer.addEventListener("input",()=>{ if(!paused && els.answer.value.trim().toLocaleLowerCase("da-DK")===word.toLocaleLowerCase("da-DK")) success(); });
els.answer.addEventListener("keydown",e=>{ if(e.key==="Enter") e.preventDefault(); });
els.pause.addEventListener("click",()=>setPaused(!paused)); els.resume.addEventListener("click",()=>setPaused(false));
els.sound.addEventListener("click",()=>{ soundOn=!soundOn; els.sound.setAttribute("aria-pressed",String(soundOn)); els.sound.textContent=soundOn?"🔊 Lyd til":"🔇 Lyd fra"; });
document.addEventListener("visibilitychange",()=>{ if(document.hidden && !paused) setPaused(true); });
window.addEventListener("resize",()=>{ if(!paused) nextWord(); });
window.addEventListener("load",()=>{ update(); setTimeout(nextWord,700); });
