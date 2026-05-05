# Map Dynamic Filter — Investigation Document

Date: 2026-05-04
Source feasibility: [`map-dynamic-filter-feasibility-v2.md`](./map-dynamic-filter-feasibility-v2.md)
Audience: Stakeholders + engineering
Scope: 15 enhancements to the Filter widget on the Map viewer, plus 12 round-2 refinements (R1–R12).

---

## 1. Objective

Extend the existing Filter widget so a user on the Map viewer can:

1. Create a Filter widget directly from the TOC toolbar without first selecting a layer (new entry point).
2. Pick the target layer from layers already on the map (instead of being forced to use the catalog or a single pre-selected TOC layer).
3. Manage each filter inside the widget independently — collapse/expand, zoom to filtered features, jump to the layer filter editor, export filtered data, and disable the filter without deleting it.

Backend: no changes. All work is in the MapStore2 client (`web/client/...`).

---

## 2. Pros

- **Closes a real UX gap.** Today the Filter widget can only be created when one TOC layer is selected, and the layer cannot be changed afterwards (`WidgetsBuilder.jsx`, `LayerSelectorField.jsx`). The new TOC icon + Map-layer picker removes both restrictions.
- **Reuses existing infrastructure.** No new redux slice, no new persistence schema, no new export pipeline. Builder entry is threaded via a transient `builderEntry` flag through `FILTER_PROPS`; export reuses the `LayerDownload` dialog; zoom reuses `zoomToExtent`; layer filter reuses `openFilterEditor` inside the builder.
- **Per-filter operations are isolated.** Collapse, disable, zoom, export, and "open layer filter" each act on a single filter inside a multi-filter widget. State lives in the existing `filter.layout` / `filter.disabled` shape, so the widget JSON stays backwards-compatible.
- **Catalog flow and Dashboard untouched.** Default Filter widget creation path (catalog-based, multi-layer in dashboards) is preserved. Risk to existing users is minimal.
- **Total effort is small.** Round 1: ~8.75 dev-days end-to-end including tests and i18n. Round 2 refinements (R1–R12) are localized polish.

---

## 3. Cons / Risks

- **Two layer-source models coexist.** Map entry uses `MapLayerSelector` (Option A — radio, single layer); Dashboard / single-layer entry keeps `FilterLayerSelector` (catalog, multi-add). Developers must remember which path to extend when adding builder features. Mitigation: branching is centralized in `FilterBuilder.jsx` based on `builderEntry`.
- **`builderEntry` is transient state.** It must be added to `FILTER_PROPS` but not persisted with saved widgets. Forgetting to strip it on save would leak builder UI state into widget JSON. Mitigation: `WidgetsUtils.js` allowlist + tests in `WidgetsUtils-test.js`.
- **Zoom-to-filtered features depends on WFS.** Requires the target layer to expose a queryable WFS endpoint and a geometry attribute. Layers without `geometryName` or with `dataSource === 'user-defined'` (no resolvable layer) must disable the icon (already handled). The R5 fix (CQL → OGC via `cqlToOgc`, wrapped in `<ogc:Filter>`) is mandatory; using a raw CQL string against `getLayerJSONFeature` zooms to the full layer extent.
- **Export reuses `LayerDownload`.** Per-filter shapefile/CSV export piggybacks on the existing dialog. The dialog is layer-scoped, not filter-scoped, so the per-filter CQL must be merged via `mergeFiltersToOGC` (`epics/layerdownload.js`). User-defined datasource without a target layer cannot export — icon must be disabled in that state.
- **Disable-filter contract changed twice.** R4 cleared `selections[filterId]` on disable; R9 reverted that and now keeps selections, relying on the epic to suppress CQL. Documentation and the comment in `epics/interactions.js` must stay aligned with R9 to avoid future regressions.
- **CSS specificity fragility.** Bootstrap `.btn-link:hover` underline rule has the same specificity as the round-2 fix; R8 + R9 had to nest under `.ms-filter-card-toolbar` / `.ms-filter-selector-header` to win the cascade. Any future refactor of the filter card class names risks reintroducing the underline.
- **Translations partial.** Only `en-US` updated for `selectMapLayers` (R10) and `toc.createFilterWidget` (R6). Other locales fall back, which is acceptable but must be flagged for the standard i18n pass.

---

## 4. Suggestions

1. **Lock the contract for `builderEntry`.** Add a unit test in `WidgetsUtils-test.js` that asserts `builderEntry` is *not* present on the persisted widget after `saveWidget`. Prevents accidental persistence.
2. **Centralize disable logic.** Keep the disable contract (R9) in one place: `applyFilterWidgetInteractionsEpic` short-circuits on `filter.disabled === true`. The corresponding inline comment must remain accurate; consider a JSDoc block on the epic.
3. **Guard zoom + export icons defensively.** Both must check `filter.data.layer` and `dataSource` before being clickable. Disabling vs. hiding: prefer disabling with a tooltip to avoid layout jumps in the per-filter toolbar.
4. **Add a single integration test for the "open layer filter" reroute.** R7 changed the action triplet from `selectNode + openQueryBuilder` to `editWidget + onEditorChange + openFilterEditor`. A regression test in `filterWidgetCard-test.js` (already added) is enough; document the contract in the epic file.
5. **Schedule the i18n pass.** Two new keys (`toc.createFilterWidget`, `widgets.builder.wizard.selectMapLayers` updated) need translation in non-en-US locales.
6. **Run `graphify update .` after merge.** Per workspace rule. Last reported counts: 10544 nodes / 10403 edges / 2708 communities — use as a baseline for drift detection.
7. **Out-of-scope hold.** Per-filter dedicated export pipeline, Dashboard parity for the new TOC icon, and any backend changes are explicitly out of scope. Capture as separate tickets if requested later.

---

## 5. Tasks Involved

### 5.1 New files

| Path | Purpose |
| --- | --- |
| `web/client/plugins/widgetbuilder/FilterWidgetTOCButton.jsx` | TOC toolbar icon (visible when layers > 0 and none selected). |
| `web/client/plugins/widgetbuilder/MapLayerSelector.jsx` | Single-select (radio) layer picker sourced from `layersSelector`, filtered by `isInteractionSupported`. |
| `web/client/components/widgets/widget/FilterPerItemToolbar.jsx` | Per-filter header toolbar: zoom, open-layer-filter, export, enable/disable switch, optional collapse chevron. |
| `web/client/actions/filterWidgetCard.js` | Action creators for per-filter card operations. |
| `web/client/epics/filterWidgetCard.js` | Epics: zoom-to-filtered (R5), open-layer-filter reroute (R7), export trigger. |
| `web/client/plugins/widgetbuilder/enhancers/mapLayerSelector.js` | HOC for `MapLayerSelector` wiring. |

### 5.2 Edited files

| Path | Change |
| --- | --- |
| `web/client/plugins/WidgetsBuilder.jsx` | Register `FilterWidgetTOCButton` at TOC `position: 99` (R12). |
| `web/client/plugins/Widgets.jsx`, `web/client/plugins/Dashboard.jsx` | Wire per-filter toolbar callbacks. |
| `web/client/plugins/widgetbuilder/FilterBuilder.jsx`, `FilterBuilderContent.jsx`, `FilterView.jsx` | Branch by `builderEntry`; add `collapseTool` slot before title (R8); preserve filter editor focus (R7). |
| `web/client/plugins/widgetbuilder/utils/filterBuilder.js` | Defaults: `layout.defaultExpanded`, `disabled`. (Description field removed in R1.) |
| `web/client/utils/WidgetsUtils.js` | Extend `FILTER_PROPS` allowlist with new transient/persisted props. |
| `web/client/components/widgets/builder/wizard/FilterWizard.jsx` | Pass `builderEntry` into data tab. |
| `web/client/components/widgets/builder/wizard/filter/FilterDataTab/index.jsx` | Drop description input (R1). |
| `web/client/components/widgets/builder/wizard/filter/FilterDataTab/components/LayerSelectorField.jsx` | Relax `isDisabled` for `builderEntry === 'toc-icon'`. |
| `web/client/components/widgets/builder/wizard/filter/FilterLayoutTab.jsx` | Add `defaultExpanded` checkbox in Items panel. |
| `web/client/components/widgets/widget/FilterWidget.jsx` | Wire actions for zoom / export / open-layer-filter / disable / collapse. Disable preserves selections (R9). |
| `web/client/components/widgets/widget/filter-widget.less` | Underline fix scoped to `.ms-filter-card-toolbar` / `.ms-filter-selector-header` (R3, R8, R9, R11); chevron `-6px` left margin (R11); `label { margin-bottom: 0 }` inside toolbar (R8). |
| `web/client/epics/interactions.js` | `applyFilterWidgetInteractionsEpic` skips disabled filters; treats them as "no contribution" (R4 / R9). |
| `web/client/translations/data.en-US.json` | New keys: `toc.createFilterWidget` (R6), `widgets.builder.wizard.selectMapLayers` updated to singular (R10). Remove `widgets.filterWidget.description` (R1). |

### 5.3 Tests

| Path | Coverage |
| --- | --- |
| `web/client/plugins/widgetbuilder/__tests__/FilterWidgetTOCButton-test.jsx` | TOC button visibility (layers > 0 + no selection). |
| `web/client/plugins/widgetbuilder/__tests__/MapLayerSelector-test.jsx` | Single-select (radio) replacement semantics (R2). |
| `web/client/components/widgets/widget/__tests__/FilterPerItemToolbar-test.jsx` | Toolbar slots render correctly; chevron only when `onToggleCollapse` supplied (R9). |
| `web/client/components/widgets/widget/__tests__/FilterWidget-test.jsx` | Per-filter actions; disable preserves selections (R9). |
| `web/client/utils/__tests__/WidgetsUtils-test.js` | New props persist; `builderEntry` does not. |
| `web/client/epics/__tests__/interactions-test.js` | Disabled filter contributes `null`; `noSelectionMode` bypassed. |
| `web/client/epics/__tests__/filterWidgetCard-test.js` | Open-layer-filter reroute action triplet (R7). |
| `web/client/components/widgets/builder/wizard/filter/__tests__/FilterDataTab-test.jsx` | Negative assertion: description textarea must NOT exist (R1). |
| `web/client/components/widgets/builder/wizard/filter/__tests__/FilterLayoutTab-test.jsx` | `defaultExpanded` checkbox behavior. |

### 5.4 Post-implementation

- Run `graphify update .`.
- Run `ReadLints` across all touched files.
- Manual smoke for R5 (zoom uses correct subset bbox).

---

## 6. Estimation

### 6.1 Round 1 (initial 15 enhancements)

| Bucket | Effort (dev-days) |
| --- | ---: |
| Item 1 — confirm gap (already verified) | 0 |
| Items 2 + 3 — TOC icon + open builder | 0.50 |
| Item 4 — allow layer selection on TOC entry (`builderEntry` plumb) | 0.50 |
| Item 5 — Investigation 1 (layer source) | 0.25 |
| Item 6 — rest unchanged (no-op verification) | 0 |
| Items 7 + 8 — per-filter collapse / expand | 1.00 |
| Item 9 — Investigation 2 (description) + impl (later reverted in R1) | 0.50 |
| Item 10 — default value (already shipped) | 0 |
| Item 11 — `defaultExpanded` toggle | 0.25 |
| Item 12 — zoom to filtered features | 1.00 |
| Item 13 — open layer filter quick action | 0.50 |
| Item 14 — export filtered data | 0.75 |
| Item 15 — enable/disable toggle | 0.75 |
| i18n + tests + review buffer | 1.75 |
| **Round 1 total** | **~8.75** |

### 6.2 Round 2 refinements (R1–R12)

| Item | Effort (dev-days) |
| --- | ---: |
| R1 — remove description field | 0.25 |
| R2 — radio (single-select) on map entry | 0.25 |
| R3 — strip toolbar icon underline | 0.10 |
| R4 — disable behaves like cleared (later revised) | 0.50 |
| R5 — zoom bbox fix (CQL → OGC) | 0.50 |
| R6 — TOC tooltip rename | 0.05 |
| R7 — open-layer-filter reroute to builder | 0.50 |
| R8 — header polish (label margin, underline specificity, chevron position) | 0.50 |
| R9 — duplicate chevron + title-side underline + disable preserves selections | 0.40 |
| R10 — map layer selector copy fix | 0.05 |
| R11 — chevron horizontal alignment | 0.10 |
| R12 — TOC button rendering order (position 11 → 99) | 0.05 |
| **Round 2 total** | **~3.25** |

### 6.3 Combined

| | Dev-days |
| --- | ---: |
| Round 1 | 8.75 |
| Round 2 | 3.25 |
| **Grand total (delivered)** | **~12.00** |

Calendar estimate (1 engineer, ~50% allocation for tests / review / merge): **~3 working weeks** end-to-end.

---

## 7. Out of Scope

- Backend changes (no WFS, OGC, or persistence schema work).
- Dashboard parity for the new TOC icon (Dashboard keeps catalog flow).
- Per-filter dedicated export pipeline (existing `LayerDownload` dialog used).
- Translations for non-en-US locales (handled in standard i18n pass).

---

## 8. References

- Feasibility v1: [`map-dynamic-filter-feasibility.md`](./map-dynamic-filter-feasibility.md)
- Feasibility v2 (full source for this investigation): [`map-dynamic-filter-feasibility-v2.md`](./map-dynamic-filter-feasibility-v2.md)
- Graphify last update: 10544 nodes / 10403 edges / 2708 communities (post-R10, post-R12).
