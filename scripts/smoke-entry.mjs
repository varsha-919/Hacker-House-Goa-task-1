// Entry point for the headless smoke test. Re-exports the canvas
// renderers so the smoke script can call them directly.
export { renderBuilderIDToCanvas, canvasToPngDataUrl } from '../src/lib/export';
export { renderTeamPosterToCanvas } from '../src/lib/teamExport';
