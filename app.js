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

// Create a section for real research results
const resultsSection = document.createElement("section");
resultsSection.id = "researchResults";
resultsSection.style.cssText = "display:none; padding:24px 0;";

resultsSection.innerHTML = `
  <h2>Research Results</h2>
  <p id="resultsStatus" role="status"></p>
  <div id="resultsList"></div>
`;

document.getElementById("research").after(resultsSection);

// Add simple styling without changing the existing website theme
const style = document.createElement("style");
style.textContent = `
  #resultsList {
    display: grid;
    gap: 16px;
    margin-top: 18px;
  }
  .rgen-paper {
    padding: 18px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: white;
    color: #10213a;
    overflow-wrap: anywhere;
  }
  .rgen-paper h3 {
    margin-top: 0;
    line-height: 1.5;
  }
  .rgen-paper a {
    color: #087eae;
  }
`;
document.head.appendChild(style);

function addText(parent, tag, value) {
  const element = document.createElement(tag);
  element.textContent = value;
  parent.appendChild(element);
  return element;
}

function getPublicationYear(item) {
  const dates = [
    item.published,
    item["published-print"],
    item["published-online"],
    item.issued
  ];

  for (const date of dates) {
    const year = date?.["date-parts"]?.[0]?.[0];
    if (year) return String(year);
  }

  return "Not listed";
}

function displayPapers(items) {
  const list = document.getElementById("resultsList");
  list.replaceChildren();

  if (items.length === 0) {
    addText(list, "p", "No publications found. Try different keywords.");
    return;
  }

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "rgen-paper";

    addText(
      card,
      "h3",
      item.title?.[0] || "Title not available"
    );

    const authors = (item.author || [])
      .map(author =>
        [author.given, author.family].filter(Boolean).join(" ")
      )
      .filter(Boolean);

    addText(
      card,
      "p",
      "Authors: " + (authors.join(", ") || "Not listed")
    );

    addText(card, "p", "Year: " + getPublicationYear(item));

    const journal = item["container-title"]?.[0];
    if (journal) {
      addText(card, "p", "Journal: " + journal);
    }

    if (item.DOI) {
      const link = document.createElement("a");
      link.href = "https://doi.org/" + item.DOI;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View publication / DOI ↗";
      card.appendChild(link);
    } else if (item.URL) {
      const link = document.createElement("a");
      link.href = item.URL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open publication ↗";
      card.appendChild(link);
    } else {
      addText(card, "p", "Publication link not available.");
    }

    list.appendChild(card);
  });
}

// Connect the form to the Crossref API
form.addEventListener("submit", async event => {
  event.preventDefault();

  const topic = input.value.trim();
  const level = document.getElementById("level").value;
  const status = document.getElementById("resultsStatus");
  const list = document.getElementById("resultsList");
  const button = form.querySelector('button[type="submit"]');

  if (!topic) {
    showToast("Enter a research topic first.");
    input.focus();
    return;
  }

  localStorage.setItem("rgen_last_topic", topic);
  localStorage.setItem("rgen_level", level);

  resultsSection.style.display = "block";
  status.textContent = `Searching publications for "${topic}"...`;
  list.replaceChildren();
  resultsSection.scrollIntoView({ behavior: "smooth" });

  if (button) button.disabled = true;

  try {
    const apiURL =
      "https://api.crossref.org/works?query=" +
      encodeURIComponent(topic) +
      "&rows=10";

    const response = await fetch(apiURL);

    if (!response.ok) {
      throw new Error("Crossref request failed: " + response.status);
    }

    const data = await response.json();
    const papers = data.message?.items || [];

    status.textContent =
      `Found ${papers.length} publication records for "${topic}". ` +
      `Selected level: ${level}.`;

    displayPapers(papers);
  } catch (error) {
    console.error("RGen Search error:", error);
    status.textContent =
      "Research search failed. Check your internet connection and try again.";
  } finally {
    if (button) button.disabled = false;
  }
});

// Topic suggestion buttons
document.querySelectorAll("[data-topic]").forEach(btn => {
  btn.addEventListener("click", () => {
    input.value = btn.dataset.topic;
    input.focus();
    showToast("Topic added — choose your level and start research.");
  });
});

// Homepage buttons
document.getElementById("ctaBtn").addEventListener("click", () => {
  document.getElementById("research").scrollIntoView({
    behavior: "smooth"
  });
  setTimeout(() => input.focus(), 500);
});

document.getElementById("signInBtn").addEventListener("click", () => {
  showToast("Accounts will be added in a future build.");
});

document.getElementById("menuBtn").addEventListener("click", () => {
  showToast("Mobile navigation will be added in a future build.");
});

// Register the service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .catch(error => console.error("Service worker error:", error));
  });
}
