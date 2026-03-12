# Full Armory Export: Recommended Printable Format

## Goal
Create a **single printable packet** that can be handed to insurance, law enforcement, or legal representatives after theft, fire, or total loss.

## Best overall format
Use a **hybrid export**:

1. **Primary:** A paginated **PDF report** (print-ready, human-readable).
2. **Secondary attachment:** **CSV files** for raw line-item data (easy for adjusters to ingest into claims systems).

For most users, the PDF is the "official" document, while CSV is backup/detail data.

---

## Why PDF + CSV is best
- **PDF is court/claims friendly:** fixed layout, page numbers, easy signatures, easy to print.
- **CSV is machine-friendly:** insurance adjusters and auditors can sort/filter totals quickly.
- **Redundancy:** if one format is hard to read or import, the other still works.

---

## Suggested PDF structure ("Full Armory Export")

### 1) Cover Page
- Report title: **Full Armory Export**
- Owner name / account
- Generated date and time (with timezone)
- Optional claim/reference number
- Total item count and estimated total value
- Data disclaimer ("Values are owner-provided unless appraised")

### 2) Summary Page
- Category totals (e.g., rifles, pistols, optics, accessories, ammo)
- Count by status/location (e.g., home safe, offsite storage)
- Overall replacement value and purchase-cost total
- Quick chart/table (optional)

### 3) Master Inventory Table (core section)
For each item include:
- Unique internal ID
- Item type/category
- Manufacturer
- Model
- Caliber/gauge (when relevant)
- **Serial number** (full or masked depending on privacy setting)
- Condition
- Purchase date
- Purchase price
- Estimated replacement value
- Storage location
- Notes/tags
- Receipt/document count linked to the item

### 4) Item Detail Pages (one per item or grouped)
- Primary and secondary photos (timestamp if available)
- Full identifying details
- Accessories included with the item
- Provenance (where purchased)
- Warranty/appraisal references
- Linked receipt reference IDs (matching appendix/index)

### 5) Supporting Documents Index
- Receipt filenames or references
- Appraisal documents
- Warranty certificates
- Permit/license references (if user chooses)
- For each document: linked item ID, upload date, page count, file hash/checksum (optional)

### 6) **Receipt Appendix (required)**
- Include **all uploaded receipts** as printable pages in the export packet.
- Preserve original order by item, then by upload date.
- Print a header on each receipt page with item ID + receipt filename.
- If the original receipt is an image/PDF, render it as-is in the appendix.

### 7) Signature & Attestation Block
- "I attest this inventory is accurate to the best of my knowledge"
- Name, signature line, date

### 8) Footer on every page
- Page X of Y
- Export generation timestamp
- Optional tamper hash (short checksum)

---

## Privacy and safety controls (important)
Offer export privacy levels:

1. **Insurance/Law Enforcement mode (full detail):** full serial numbers and exact locations.
2. **General backup mode (redacted):** serial masked (e.g., `***1234`), generalized location.

Also include:
- Optional "exclude photos" toggle.
- Optional "exclude legal docs" toggle.
- Optional "include receipt images/pages" toggle (default **ON**).
- Password-protected PDF option.

---

## CSV companion files
Ship one ZIP containing:
- `full-armory-export.pdf`
- `inventory-items.csv`
- `attachments-index.csv`
- `valuation-summary.csv`
- `receipts/` folder with the **original uploaded receipt files** (or `receipts.zip`)

This makes both printing and digital ingestion straightforward while preserving originals.

---

## Formatting guidelines for print readiness
- US Letter by default (with A4 option)
- High contrast black text
- No dependence on background colors
- Keep row heights large enough for manual annotation
- Repeat table headers on each new page

---

## Recommendation
If you only build one output first, build the **PDF packet** with:
1. cover,
2. summary,
3. master table,
4. receipt appendix (all uploaded receipts),
5. appendix of photos and document index.

Then add CSV/original-file bundle as a second phase for power users and insurance workflows.

---

## Implemented in app (current behavior)
- Settings now includes an actionable **Full Armory Export** panel with preset selection:
  - `CLAIMS`: full-detail export for insurance/law enforcement.
  - `BACKUP`: masked serials for safer personal backup sharing.
- The export action calls `GET /api/exports/full-armory?preset=CLAIMS|BACKUP`.
- Generated download set:
  - `full-armory-export-<timestamp>.json`
  - `inventory-items-<timestamp>.csv`
  - `attachments-index-<timestamp>.csv`
  - `valuation-summary-<timestamp>.csv`
- The payload includes missing-evidence counters (`missingReceipt`, `missingPhoto`, `missingValue`, `missingSerial`) to identify weak claim records early.
