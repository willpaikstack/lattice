# Manual CAD Fixture Pack

Generated mock files for local Lattice OS manual testing.

Use these for app workflow checks where the browser only needs uploadable files:

- `lattice-qc-bracket.step` - normal small STEP upload.
- `lattice-qc-manifold.stp` - alternate `.stp` extension for multi-file upload.
- `edge-name with spaces (rev A).step` - filename sanitization and display check.
- `duplicate-a/duplicate-part.step` and `duplicate-b/duplicate-part.step` - duplicate basename checks.
- `empty-upload.step` - zero-byte upload rejection check.
- `../drawings/lattice-qc-drawing-rev-a.pdf` - mock drawing attachment for drawing-required RFQ options.

These STEP files are lightweight AP-style text fixtures and are intended for RFQ upload, draft recovery, storage-key, filename, validation, and workflow testing. They are not guaranteed to translate into visible 3D geometry in Autodesk Platform Services.

For CAD-preview/manual viewer validation with real geometry, use unrestricted or reputable sample sources:

- NIST MBE PMI validation models: https://www.nist.gov/ctl/smart-connected-systems-division/smart-connected-manufacturing-systems-group/mbe-pmi-0
- Xometry sample CAD files: https://www.xometry.com/machine-learning-for-manufacturing/sample-cad-files/
- FreeCAD Parts Library: https://github.com/FreeCAD/FreeCAD-library

Suggested manual runs:

1. Upload `lattice-qc-bracket.step`.
2. Upload `lattice-qc-bracket.step` and `lattice-qc-manifold.stp` together.
3. Select a dimensional/FAIR-style inspection option and try submitting without the drawing PDF.
4. Attach `../drawings/lattice-qc-drawing-rev-a.pdf` and submit again.
5. Upload both duplicate-part files from their separate folders.
6. Try `empty-upload.step` and confirm it is rejected.
7. Try `edge-name with spaces (rev A).step` and confirm the filename displays and stores safely.
