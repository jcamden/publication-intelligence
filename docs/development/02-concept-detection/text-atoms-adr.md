Here are the main tradeoffs, framed around what *actually changes* for your system: reproducibility, performance/cost, complexity, and feature headroom.

## Persist TextAtoms (store them)

### Pros

* **Deterministic bbox mapping without re-extraction**

  * You can convert `char_range → atoms → bbox` anytime with no PyMuPDF call.
* **Strong reproducibility + auditability**

  * You can reconstruct exactly what the model saw *and* exactly how highlights were computed.
* **Better re-detection merging**

  * You can dedupe mentions using stable token/atom indices, not “best-effort” string matching.
* **Faster UI interactions**

  * Hover/preview/highlight can be computed from stored geometry instantly.
* **Supports more advanced features later**

  * Phrase-level highlighting, “show me all occurrences of this lemma,” line-based preview, explainability (“highlight came from atoms 120–128”), correction tooling, etc.
* **More resilient to extraction setting changes**

  * You can keep old atoms tied to a `run_id` and compare across extraction versions.

### Cons

* **More storage + more rows**

  * Word-level atoms can be tens of thousands per book; in a relational schema that’s a lot of rows and indexes.
* **Schema + indexing complexity**

  * You’ll need good indexing (by page, sequence) and careful migrations/versioning.
* **Write-time cost**

  * Inserting a large number of rows can slow ingestion and increase DB load.
* **More surface area to secure + maintain**

  * More data to back up, more to purge on deletes, more to query efficiently.
* **Potential “format churn” risk**

  * If you change atom structure (bbox format, normalization), you must version it.

### Mitigation if you persist

If you do persist, avoid row explosion by storing **per-page packed blobs** (arrays/bytea) instead of one row per atom.

---

## Keep TextAtoms Ephemeral (in-memory only)

### Pros

* **Simpler DB and fewer moving parts**

  * No atom tables, fewer indexes, fewer migrations.
* **Lower storage cost**

  * You store only `indexable_text`, page dimensions, and final mentions.
* **Faster initial implementation**

  * Less infra work; fewer performance cliffs from big inserts.
* **Easier retention/privacy story**

  * You’re not storing detailed token-level geometry long-term.

### Cons

* **You must re-extract to compute bboxes later**

  * If you only store `char_range` and not atoms, then any time you need to compute or re-compute bbox unions you need PyMuPDF again (at least per page).
* **Harder to guarantee determinism**

  * Small extraction changes (ignore regions, library version) can shift tokenization/bboxes. Your `char_range` might remain valid but bbox mapping could differ.
* **Weaker debugging for geometry**

  * You can prove the text anchor (`indexable_text[range]`), but not the exact atom boundaries that produced the bbox unless you log them at the time.
* **More runtime CPU load**

  * Every highlight recalculation or validation step may require re-running extraction for pages.
* **Some features become harder**

  * “Explain why highlight is exactly here,” advanced dedupe, or high-frequency geometry queries.

### Mitigation if you keep ephemeral

* Always persist **text anchors** (`text_quote`, `char_range`) and a **bbox computed at detection time**.
* Add `extraction_hash` / `atomization_version` so you can detect when a re-extraction might change mappings.
* If you need determinism later, you can add a packed per-page atom blob without changing the relational schema too much.

---

## What I’d recommend for your plan

Given you already plan to store:

* `indexable_text`
* `text_quote + char_range`
* computed `bbox` on the mention

…you can keep TextAtoms ephemeral for MVP **as long as you accept this rule**:

> Bboxes are computed once during detection and treated as the canonical render geometry; if extraction rules change, you validate via `char_range` and optionally mark mentions “needs review” rather than trying to perfectly recompute geometry.

If you anticipate lots of “change exclude regions → revalidate and re-render everything” or you want very strong explainability, consider storing **packed per-page atoms** (not rows) as a middle ground.

If you tell me your expected scale (books per user, retention needs), I can suggest whether ephemeral is likely to stay comfortable or whether you’ll regret not persisting within the first few months.
