# Risks & Unknowns

**Project:** IndexPDF / Publication Intelligence
**Purpose:** Identify technical, product, market, and strategic uncertainties that could materially impact feasibility, timeline, or differentiation.

---

## 1) Core Technical Risks

### 1.1 PDF Text Extraction Quality

**Risk:**
PDF text extraction is inherently unreliable due to:

* Fragmented text spans (PDFJS, OCR artifacts).
* Layout-driven PDFs (tables, multi-column text).
* Ligatures, hyphenation, and encoding quirks.
* Scanned documents requiring OCR.

**Impact:**

* Incorrect text primitives → broken highlighting.
* Semantic indexing errors.
* User mistrust in annotations and search.

**Unknowns:**

* How much preprocessing is needed to reach acceptable accuracy?
* Whether PyMuPDF + heuristics outperforms PDFJS enough to justify complexity.
* How much variance exists across real-world PDFs in target users.

**Mitigation Direction:**

* Define a canonical “text atom” abstraction decoupled from extraction source.
* Allow multiple extraction backends (PDFJS, PyMuPDF, OCR).
* Build MVP on “good enough” extraction, not perfect extraction.

---

### 1.2 Primitive Unit Design (Text vs Semantics)

**Risk:**
Choosing the wrong primitive unit (word, span, sentence, concept, embedding) could lock the system into an inflexible architecture.

**Tradeoff:**

* Text atoms → precise UI mapping but weak semantics.
* Semantic units → powerful indexing but hard UI alignment.

**Unknowns:**

* What granularity users actually need (word vs phrase vs concept)?
* How often semantic spans cross PDF layout boundaries?
* Whether LLM-derived concepts can be reliably mapped to geometry.

**Mitigation Direction:**

* Dual-layer model:

  * **Atoms:** geometric + textual primitives.
  * **Concepts:** semantic overlays referencing atoms.
* Avoid committing to a single “true” primitive.

---

### 1.3 LLM Dependence

**Risk:**

* LLMs may hallucinate spans, concepts, or structure.
* Costs could scale unpredictably.
* Latency may hurt UX.

**Unknowns:**

* Whether LLM concept extraction is accurate enough for production.
* Whether deterministic heuristics outperform LLMs in some domains (e.g., scripture, legal text).
* Long-term API pricing and model stability.

**Mitigation Direction:**

* Treat LLM output as probabilistic metadata, not ground truth.
* Cache, diff, and validate LLM outputs against text atoms.
* Design for fallback to rule-based indexing.

---

### 1.4 Annotation & Interaction Model Complexity

**Risk:**
Making text “interactable” (not just highlighted) introduces complexity:

* Mapping UI interactions to spans.
* Handling overlapping annotations.
* Maintaining referential integrity when text changes.

**Unknowns:**

* Whether Box-style annotation models scale to semantic indexing.
* Whether React-PDF-style approaches can handle concept-level interactivity.
* Performance limits with large documents.

**Mitigation Direction:**

* Use span IDs and normalized coordinate systems.
* Separate annotation storage from rendering.
* Avoid hard coupling to PDFJS DOM structure.

---

## 2) Product Risks

### 2.1 MVP Scope Creep

**Risk:**
The project can easily drift into building:

* A full document understanding engine.
* A universal semantic knowledge graph.
* A next-gen PDF viewer.

**Impact:**

* Slower time-to-market.
* Founder burnout.
* Missed market window.

**Unknowns:**

* What minimum feature set actually proves value?
* Which features users will care about vs ignore?

**Mitigation Direction:**

* MVP = “search + highlight + concept index” for a narrow domain.
* Explicitly defer:

  * Perfect structure extraction.
  * Cross-document ontology.
  * Universal format support.

---

### 2.2 User Value Perception

**Risk:**
Users may not immediately understand why semantic indexing is better than:

* Ctrl+F
* bookmarks
* Zotero / Obsidian / Notion
* built-in PDF search

**Unknowns:**

* Which user segment feels the pain most strongly?
* Whether “semantic index” resonates or confuses.
* Whether the value is obvious without onboarding.

**Mitigation Direction:**

* Focus on a killer use case:

  * Scripture study.
  * Legal research.
  * Academic literature.
* Demonstrate “impossible with normal PDF tools” outcomes.

---

## 3) Market & Competitive Risks

### 3.1 Platform Encroachment

**Risk:**
Large players could replicate core features:

* Adobe Acrobat / PDF AI.
* Google Drive / Docs AI.
* Microsoft Copilot.
* Research tools (Semantic Scholar, Scite, etc.).

**Reality Check:**
Yes, if successful, we will likely be:

* Out-competed on generic features.
* Or acquired.

**Unknowns:**

* How fast incumbents move.
* Whether they prioritize this niche.

**Mitigation Direction:**

* Compete on:

  * Depth, not breadth.
  * Domain-specific intelligence.
  * Open, composable architecture.
* Avoid being “just a PDF viewer with AI.”

---

### 3.2 Open Source Disruption

**Risk:**
Open-source tools (Unstructured, LangChain, Haystack, etc.) may converge on similar capabilities.

**Unknowns:**

* Whether any OSS project will fully solve PDF semantic indexing.
* Whether our differentiation is product UX rather than tech.

**Mitigation Direction:**

* Embrace OSS for infrastructure, differentiate on product logic and UX.
* Avoid reinventing commoditized layers.

---

## 4) Strategic Risks

### 4.1 Branding & Positioning Ambiguity

**Risk:**
Names like:

* IndexPDF
* Publication Intelligence
* Publication Index

may confuse:

* What the product actually does.
* Whether it’s a tool, platform, or category.

**Unknowns:**

* Which naming strategy maximizes clarity vs ambition.
* Whether PDF-centric branding limits future expansion.

**Mitigation Direction:**

* Treat IndexPDF as product.
* Treat Publication Intelligence as parent vision.
* Keep architecture format-agnostic even if branding isn’t.

---

### 4.2 Architecture Lock-in

**Risk:**
Early decisions could lock us into:

* PDFJS DOM assumptions.
* One extraction pipeline.
* One semantic model.
* One database schema.

**Unknowns:**

* Whether current assumptions will hold at scale.
* Whether future formats (HTML, EPUB, DOCX) require fundamentally different models.

**Mitigation Direction:**
Design for:

* Pluggable extractors.
* Versioned schemas.
* Immutable atom IDs.
* Concept layers that can evolve independently.

---

## 5) Execution Risks

### 5.1 Founder Time & Cognitive Load

**Risk:**
This project sits at the intersection of:

* PDFs
* NLP
* UX
* AI
* distributed systems
* product strategy

That’s cognitively expensive.

**Unknowns:**

* Whether progress feels linear or perpetually messy.
* Whether I can sustain momentum alongside other commitments.

**Mitigation Direction:**

* Bias aggressively toward MVP shortcuts.
* Accept “ugly but working” pipelines early.
* Avoid premature elegance.

---

### 5.2 Economic Viability

**Risk:**
Costs (LLMs, storage, compute) may exceed willingness to pay.

**Unknowns:**

* Whether users pay per document, per seat, or per insight.
* Whether the product becomes infrastructure or SaaS.

**Mitigation Direction:**

* Track cost per indexed page from day one.
* Design pricing aligned with value density, not usage volume.
