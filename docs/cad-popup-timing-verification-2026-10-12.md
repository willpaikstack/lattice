# CAD popup timing verification — 2026-10-12

## Story

Selecting A10201.SLDPRT on Upload should save the file, submit Autodesk translation and track progress during the export popup, then reuse that translation on Configure.

## Method

Used the user-provided `/Users/williampaik/Downloads/A10201.SLDPRT` (115,778 bytes) in three isolated local browser tabs. Waited 27.5, 20.1 and 60.0 seconds before No → Continue. Compared browser-visible progress, local API request logs and read-only Autodesk manifest snapshots. No RFQ was submitted and no intended-use/material choices were made. The three generated drafts were uniquely labeled and archived through the UI afterward; other customer drafts were retained. Autodesk uploads/jobs were not deleted.

## Results

| Popup wait | Configure entry | Later result |
| --- | --- | --- |
| 27.5 seconds | Brief Starting preview state, then actual 99% processing | Model subsequently rendered |
| 20.1 seconds | Brief Starting preview state, then actual 99% processing | Autodesk success observed about 40.0 seconds after selection; model rendered |
| 60.0 seconds | Viewer loading directly; no translation-wait card | Autodesk success had been observed about 42.3 seconds after selection while still in the popup; model rendered with envelope 63.50 × 48.93 × 49.02 mm |

The accepted translation POST completed roughly 3 seconds after selection, before Continue, with HTTP 202. The popup generated status GETs while still unanswered. This confirms the translation job is submitted during step 1, rather than being delayed until Configure. Each trial showed one translation-start POST; Continue reused its URN/job.

For the two directly sampled jobs, Autodesk remained inprogress at 99% before eventually reporting success. The 40.0/42.3-second figures are first observed completion times, sampled approximately every 2 seconds plus request latency, not exact Autodesk execution durations or guarantees. The first trial had no continuous provider observer and its exact completion time was not captured.

The claim that this file always renders in under 20 seconds was not reproduced in this configured APS service. The measured wait included provider queue/conversion, then a separate browser download/viewer initialization after Configure. At 60 seconds, the viewer was still loading 2 seconds after Continue, even though Autodesk conversion had finished. Final visual inspection confirmed the rendered part; exact browser first-frame latency was not continuously measured. The screenshot alone must not be interpreted as instant rendering.

## Evidence and conclusion

- Provider samples: `output/qa/cad-timing-2026-10-12/aps-trial-2037.json` and `aps-trial-2076.json` (timestamps, status/progress only; no tokens or raw CAD).
- Rendered result: `output/qa/cad-timing-2026-10-12/60-second-wait-rendered.png`.
- The existing early-upload/translation behavior is working in this local test; no additional application code change was made in this verification session.
- Viewer asset preload does not download the converted model. Preloading/reusing the converted model after translation completes during the popup is a possible next optimization; it is not implemented by this verification.
- Content-based reuse of an already translated identical CAD object could avoid repeated fresh translation; currently each new selected File creates a fresh APS object/job. Cache isolation, invalidation and ownership would need to be designed before implementing this.
