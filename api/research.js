
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET for research search." });
  }

  const q = String(req.query?.q || "").trim().slice(0, 180);
  const source = ["all", "crossref", "pubmed"].includes(
    String(req.query?.source || "all")
  ) ? String(req.query?.source || "all") : "all";
  const sort = String(req.query?.sort || "relevance") === "newest"
    ? "newest" : "relevance";

  if (q.length < 2) {
    return res.status(400).json({
      error: "Enter at least 2 characters to search."
    });
  }

  try {
    const jobs = [];
    if (source !== "pubmed") jobs.push(searchCrossref(q, sort));
    if (source !== "crossref") jobs.push(searchPubmed(q, sort));

    const settled = await Promise.allSettled(jobs);
    const results = settled.flatMap(x =>
      x.status === "fulfilled" ? x.value : []
    );

    results.sort((a, b) =>
      sort === "newest"
        ? (Number(b.year) || 0) - (Number(a.year) || 0)
        : 0
    );

    return res.status(200).json({
      query: q,
      results: results.slice(0, 24),
      sources: [...new Set(results.map(x => x.source))],
      notice: "Metadata is supplied by Crossref and/or PubMed. Verify details at the source."
    });
  } catch (e) {
    console.error("Research API error:", e);
    return res.status(502).json({
      error: "The scholarly services are temporarily unavailable. Please retry."
    });
  }
}

function yearOf(dateParts) {
  return Array.isArray(dateParts) && dateParts[0]
    ? String(dateParts[0]) : "";
}

async function searchCrossref(q, sort) {
  const u = new URL("https://api.crossref.org/works");
  u.searchParams.set("query", q);
  u.searchParams.set("rows", "12");

  if (sort === "newest") {
    u.searchParams.set("sort", "published");
    u.searchParams.set("order", "desc");
  }

  const r = await fetch(u);
  if (!r.ok) throw new Error("Crossref error");

  const data = await r.json();

  return (data.message?.items || []).map(x => ({
    title: Array.isArray(x.title) ? x.title[0] : "Untitled publication",
    authors: (x.author || [])
      .map(a => [a.given, a.family].filter(Boolean).join(" "))
      .filter(Boolean),
    year: yearOf(
      x.published?.["date-parts"]?.[0] ||
      x["published-print"]?.["date-parts"]?.[0] ||
      x.created?.["date-parts"]?.[0]
    ),
    journal: Array.isArray(x["container-title"])
      ? x["container-title"][0] : "",
    doi: x.DOI || "",
    url: x.URL || (x.DOI ? `https://doi.org/${x.DOI}` : ""),
    abstract: stripTags(x.abstract || "").slice(0, 1400),
    source: "Crossref"
  }));
}

async function searchPubmed(q, sort) {
  const search = new URL(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
  );
  search.searchParams.set("db", "pubmed");
  search.searchParams.set("term", q);
  search.searchParams.set("retmax", "12");
  search.searchParams.set("retmode", "json");

  if (sort === "newest") search.searchParams.set("sort", "date");

  const sr = await fetch(search);
  if (!sr.ok) throw new Error("PubMed search error");

  const sd = await sr.json();
  const ids = sd.esearchresult?.idlist || [];
  if (!ids.length) return [];

  const summary = new URL(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
  );
  summary.searchParams.set("db", "pubmed");
  summary.searchParams.set("id", ids.join(","));
  summary.searchParams.set("retmode", "json");

  const rr = await fetch(summary);
  if (!rr.ok) throw new Error("PubMed summary error");

  const rd = await rr.json();

  return ids.map(id => {
    const x = rd.result?.[id] || {};
    const doi = (x.articleids || [])
      .find(a => a.idtype === "doi")?.value || "";

    return {
      title: stripTags(x.title || "Untitled publication"),
      authors: (x.authors || []).slice(0, 8).map(a => a.name),
      year: String(x.pubdate || "").match(/\b(?:19|20)\d{2}\b/)?.[0] || "",
      journal: x.fulljournalname || x.source || "",
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      abstract: "",
      source: "PubMed"
    };
  });
}

function stripTags(s) {
  return String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
  
