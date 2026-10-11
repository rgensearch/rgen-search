const toast = document.getElementById("toast");
const input = document.getElementById("topicInput");
const form = document.getElementById("researchForm");

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 2600);
}

document.querySelectorAll("[data-topic]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    input.value = btn.dataset.topic;
    input.focus();
    showToast("Topic added — choose your level and start research.");
  });
});

form.addEventListener("submit", e=>{
  e.preventDefault();
  const topic = input.value.trim();
  const level = document.getElementById("level").value;
  if(!topic){ showToast("Enter a research topic first."); input.focus(); return; }
  localStorage.setItem("rgen_last_topic", topic);
  localStorage.setItem("rgen_level", level);
  showToast(`RGen prototype ready for: ${topic} (${level})`);
});

document.getElementById("ctaBtn").addEventListener("click", ()=>{
  document.getElementById("research").scrollIntoView({behavior:"smooth"});
  setTimeout(()=>input.focus(), 500);
});

document.getElementById("signInBtn").addEventListener("click", ()=>{
  showToast("Accounts will be added in the next build.");
});

document.getElementById("menuBtn").addEventListener("click", ()=>{
  showToast("Mobile navigation will be added in the next build.");
});

if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
