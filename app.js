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


form.addEventListener("submit", async e => {
  e.preventDefault();

  const topic = input.value.trim();
  const level = document.getElementById("level").value;

  if (!topic) {
    showToast("Enter a research topic first.");
    input.focus();
    return;
  }

  localStorage.setItem("rgen_last_topic", topic);
  localStorage.setItem("rgen_level", level);

  // Keep the original prototype message for reference:
  // showToast(`RGen prototype ready for: ${topic} (${level})`);

  resultsSection.style.display = "block";
  const status = document.getElementById("resultsStatus");
  const list = document.getElementById("resultsList");

  status.textContent = "Searching Crossref research publications...";
  list.replaceChildren();
  resultsSection.scrollIntoView({ behavior: "smooth" });

  try {
    const url =
      "https://api.crossref.org/works?query=" +
      encodeURIComponent(topic) +
      "&rows=10";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Research search request failed");
    }

    const data = await response.json();
    const papers = data.message?.items || [];

    if (papers.length === 0) {
      status.textContent = "No publications found. Try another topic.";
      return;
    }

    status.textContent =
      `Found ${papers.length} publications for "${topic}".`;

    papers.forEach(paper => {
      const card = document.createElement("article");
      card.className = "rgen-paper";

      const heading = document.createElement("h3");
      heading.textContent = paper.title?.[0] || "Title unavailable";
      card.appendChild(heading);

      const authors = (paper.author || [])
        .map(a => [a.given, a.family].filter(Boolean).join(" "))
        .filter(Boolean)
        .join(", ");

      const authorLine = document.createElement("p");
      authorLine.textContent = "Authors: " + (authors || "Not listed");
      card.appendChild(authorLine);

      const year =
        paper.published?.["date-parts"]?.[0]?.[0] ||
        paper.issued?.["date-parts"]?.[0]?.[0] ||
        "Not listed";

      const yearLine = document.createElement("p");
      yearLine.textContent = "Year: " + year;
      card.appendChild(yearLine);

      const journal = paper["container-title"]?.[0];

      if (journal) {
        const journalLine = document.createElement("p");
        journalLine.textContent = "Journal: " + journal;
        card.appendChild(journalLine);
      }

      const doi = paper.DOI;
      const linkUrl = doi
        ? "https://doi.org/" + doi
        : paper.URL;

      if (linkUrl) {
        const link = document.createElement("a");
        link.href = linkUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Open publication";
        card.appendChild(link);
      }

      list.appendChild(card);
    });

  } catch (error) {
    console.error("Crossref search error:", error);
    status.textContent =
      "Search failed. Please check your internet connection and try again.";
  }
});

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
      "&rows=25";

    const response = await fetch(apiURL);

    if (!response.ok) {
      throw new Error("Crossref request failed: " + response.status);
    }

    const data = await response.json();
    const papers = data.message?.items || [];
papers.forEach((paper) => {
  if (paper.abstract) {
    const doc = document.createElement("div");
    doc.innerHTML = paper.abstract;
    paper.abstract = doc.textContent || "";
  }
});
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
