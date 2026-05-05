# Map Dynamic Filter — Investigation Summary

## Objective

Improve the Filter widget on the Map viewer so users can:

- Create a Filter widget from the TOC toolbar without first selecting a layer.
- Pick the target layer from layers already on the map.
- Manage each filter inside a multi-filter widget independently — collapse, zoom to filtered features, open the layer filter editor, export, and enable/disable.

Client-only change. No backend, schema, or persistence updates.

## Investigation

- The current Filter widget can only be created when one TOC layer is selected, and the layer cannot be changed later. This is the gap.
- A new TOC icon (visible when layers exist but none is selected) opens the existing Filter widget builder with a `builderEntry: 'toc-icon'` flag.
- That flag switches the layer picker from the catalog to a new map-layer picker (single-select radio) sourced from layers already on the map.
- Per-filter operations are added to the filter card header without changing the saved widget shape — they reuse `filter.layout` / `filter.disabled` and existing actions (`zoomToExtent`, `openFilterEditor`, `LayerDownload` dialog).
- Disabling a filter keeps the user's selections but suppresses the filter's CQL contribution in the interactions epic.
- Catalog flow and Dashboard widget creation paths are unchanged.

## Implementation Plan

1. **TOC entry point** — new `FilterWidgetTOCButton` registered at TOC `position: 99`; opens builder with `builderEntry: 'toc-icon'`.
2. **Map layer picker** — new `MapLayerSelector` (radio, single-select) used when `builderEntry === 'toc-icon'`; existing `FilterLayerSelector` (catalog) kept for the default path.
3. **Per-filter toolbar** — new `FilterPerItemToolbar` with: collapse chevron (rendered before the title), zoom-to-filtered, open-layer-filter, export, enable/disable switch.
4. **Layout option** — new `defaultExpanded` checkbox in the Layout → Items panel.
5. **Zoom to filtered features** — convert filter CQL to OGC (`cqlToOgc`), wrap in `<ogc:Filter>`, fetch bbox via `getLayerJSONFeature`, dispatch `zoomToExtent`.
6. **Open layer filter** — dispatch `editWidget → onEditorChange(selectedFilterId) → openFilterEditor` so the in-builder layer filter editor opens for that filter.
7. **Export** — reuse the existing `LayerDownload` dialog with the filter's CQL merged via `mergeFiltersToOGC`.
8. **Enable/disable** — `applyFilterWidgetInteractionsEpic` short-circuits when `filter.disabled === true`; selections are preserved.
9. **i18n + tests + lints + `graphify update .`** as the closing pass.

## Tasks Involved

**New files**

- `plugins/widgetbuilder/FilterWidgetTOCButton.jsx`
- `plugins/widgetbuilder/MapLayerSelector.jsx`
- `plugins/widgetbuilder/enhancers/mapLayerSelector.js`
- `components/widgets/widget/FilterPerItemToolbar.jsx`
- `actions/filterWidgetCard.js`
- `epics/filterWidgetCard.js`
- Tests for each of the above.

**Edited files**

- `plugins/WidgetsBuilder.jsx`, `plugins/Widgets.jsx`, `plugins/Dashboard.jsx`
- `plugins/widgetbuilder/FilterBuilder.jsx`, `FilterBuilderContent.jsx`, `FilterView.jsx`
- `plugins/widgetbuilder/utils/filterBuilder.js`
- `utils/WidgetsUtils.js` (extend `FILTER_PROPS`)
- `components/widgets/builder/wizard/FilterWizard.jsx`
- `components/widgets/builder/wizard/filter/FilterDataTab/index.jsx`
- `components/widgets/builder/wizard/filter/FilterDataTab/components/LayerSelectorField.jsx`
- `components/widgets/builder/wizard/filter/FilterLayoutTab.jsx`
- `components/widgets/widget/FilterWidget.jsx`
- `components/widgets/widget/filter-widget.less`
- `epics/interactions.js`
- `translations/data.en-US.json`

**Tests** — added/updated alongside touched components and epics.

## Estimation

| Phase | Dev-days |
| --- | ---: |
| Initial implementation (TOC entry, layer picker, per-filter toolbar, zoom, export, open layer filter, disable, defaults, i18n, tests) | ~8.75 |
| Refinements (UX polish, single-select fix, zoom CQL→OGC fix, open-layer-filter reroute, header alignment, copy fixes, button order) | ~3.25 |
| **Total** | **~12** |

Calendar: ~3 working weeks for one engineer at ~50% allocation including tests, review, and merge.

## Out of Scope

- Backend changes.
- Dashboard parity for the new TOC icon.
- Per-filter dedicated export pipeline (uses existing `LayerDownload` dialog).
- Translations for non-en-US locales (handled in the standard i18n pass).
