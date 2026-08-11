# Vendor Source Archive

This directory is the internal archive for reusable documents received from manufacturing vendors: material lists, equipment lists, capability decks, factory profiles, quality certificates, and quality procedures. Keep RFQ- or order-specific files—such as customer drawings, supplier quotations, inspection reports, invoices, and shipping documents—in their workflow-specific storage instead.

## Folder Structure

Store each vendor's reusable documents in a lowercase, hyphenated vendor folder:

```text
docs/vendor-sources/
  best-parts/
  best-prototypes/
  jucheng-precision/
  saky-steel/
  yijin-solution/
  zintilon/
  zytc/
  manifest.json
```

## Archiving A New Document

1. Confirm it is reusable vendor reference material, not tied to one RFQ or order.
2. Save the original file in `docs/vendor-sources/<vendor-slug>/` using a descriptive, lowercase, hyphenated filename. Preserve the original filename in metadata rather than relying on it as the stored filename.
3. Add the document to `src/lib/vendor-source-documents.ts` with the vendor, title, document and received dates, exact repository path, original filename, document type, and extraction notes.
4. Add the matching entry to `docs/vendor-sources/manifest.json`.
5. If derived material, equipment, or capability data uses the document, link those records to its stable source-document ID. Do not make customer-facing claims from a new source until its scope, validity, and extracted details have been reviewed.
6. Verify that every manifest path exists and run the relevant TypeScript/tests before handoff.

Use one vendor folder per legal company or operating brand. When a vendor uses multiple brands, document the chosen folder slug and aliases in the source registry's extraction notes.
