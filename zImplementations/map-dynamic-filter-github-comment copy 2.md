@tdipisa @allyoucanmap
## Map Dynamic Filter - Implementation Plan

### Overview

The existing Filter widget will be extended to work directly on the Map viewer. A new TOC toolbar icon will allow creating a Filter widget without first selecting a layer; the target layer will be picked from layers already on the map (instead of the catalog). Each filter inside a multi-filter widget will get an independent header toolbar to collapse, zoom to filtered features, jump to the layer filter editor, export, and enable/disable the filter - without removing it.

The change will be entirely client-side. The widget JSON shape will remain backwards-compatible: new state will live on the existing `filter.layout` and `filter.disabled` fields, and the TOC entry source will be threaded as a transient `builderEntry` flag.

---

### 1. TOC toolbar entry

- A new `FilterWidgetTOCButton` will be registered on the TOC toolbar at `position: 99` (rendered last).
- The icon will be visible only when at least one layer is loaded **and** no layer is selected, mirroring the `AddLayer` / `AddGroup` visibility pattern.
- Clicking the icon will dispatch `createWidget({ widgetType: 'filter', builderEntry: 'toc-icon' })`. The existing `initEditorOnNew` epic already spreads arbitrary widget payload into `editNewWidget`, so no epic changes are required to thread the flag.
- Tooltip: **"Create a filter widget for the map"** (disambiguates from the generic `toc.createWidget` tooltip that targets a selected layer).

---

### 2. Map-layer picker

A new `MapLayerSelector` component will source layers from the map state instead of the catalog.

- Source: `layersSelector` filtered by `isInteractionSupported` - i.e. `['wms', 'wfs'].includes(layer.type) && layer.group !== 'background'`.
- Selection model: **single-select (radio)**. A Filter widget on the map targets one layer at a time; multi-select would imply multi-layer interactive filtering, which is out of scope.
- Header copy: "Select a layer from the map".
- `FilterBuilder.jsx` will branch on `builderEntry === 'toc-icon'` to render `MapLayerSelector` instead of the existing `FilterLayerSelector` (catalog).
- `LayerSelectorField.jsx` `isDisabled` will be relaxed so the layer can be changed inside the builder when entered via the TOC icon.

The catalog-based flow used for Dashboard widgets and the existing single-layer entry will remain unchanged.

---

### 3. Per-filter card toolbar

Each filter inside a multi-filter widget will get a header toolbar. State will be stored per filter and persisted with the widget where applicable.

| Tool | Stored on | Behavior |
|------|-----------|----------|
| Collapse / expand chevron | `filter.layout.collapsed` | Renders **before** the title icon. Body collapses; header stays visible. |
| Zoom to filtered features | - | Builds CQL → OGC, fetches bbox via WFS, dispatches `zoomToExtent`. |
| Open layer filter | - | Re-opens this filter inside the widget builder's in-builder layer filter editor (not the TOC Query panel). |
| Export filtered data | - | Opens the existing `LayerDownload` dialog with the filter's CQL merged in. |
| Enable / disable switch | `filter.disabled` | Suppresses the filter's CQL contribution while preserving user selections. |

A new `defaultExpanded` checkbox in the Layout → Items panel will control the initial collapsed state of each filter (`layout.defaultExpanded`, default `true`).

Disabling a filter will short-circuit `applyFilterWidgetInteractionsEpic` so the filter contributes `null` to the composed CQL - its entry will be stripped by `removeEmptyFilters`, and the target layer / connected widgets will lose this filter's contribution immediately. Selections will not be cleared on disable; re-enabling will restore the prior CQL on the next interaction apply with no extra clicks.

---

### 4. Zoom to filtered features

The per-filter zoom action will:

1. Compose CQL via `processFilterToCQL(filter, selections)`.
2. Convert CQL to OGC XML using `cqlToOgc` and wrap as `<ogc:Filter>...</ogc:Filter>`.
3. Call `getLayerJSONFeature(layer, wrappedOgcFilter, { propertyName: layer.geometryName, maxFeatures: 1000 })`.
4. Compute the bbox via `@turf/bbox` and dispatch `zoomToExtent(bbox, 'EPSG:4326')`.

> [!NOTE]
> `getLayerJSONFeature` embeds the filter argument as raw XML inside `<wfs:Query>`. Passing a bare CQL string produces an invalid request body - the server returns the full feature set and the bbox is computed over everything. The CQL → OGC conversion is mandatory.

The icon will be disabled when the filter has no resolvable target layer (`dataSource === 'user-defined'` without `filter.data.layer`) or when the layer has no `geometryName`.

---

### 5. Open layer filter quick action

The action will open the **in-builder** layer filter editor (not the TOC Query panel) by dispatching, in order:

```js
editWidget(widget)
onEditorChange('selectedFilterId', filterId)
openFilterEditor()
```

This will trigger the existing `openWidgetEditor` epic; the builder will open, `FilterBuilderContent` will read `selectedFilterId`, `FilterDataTab` will mount, and the QueryPanel scoped to that filter's `data.layer` will be raised.

The icon will be skipped when `dataSource !== 'features'` or there is no `filter.data.layer`.

---

### 6. Export filtered data

The per-filter export action will reuse the existing `LayerDownload` dialog. The filter's CQL will be merged into the dialog's request via `mergeFiltersToOGC` (`epics/layerdownload.js`). The user will choose CSV / Shapefile / GML in the standard dialog; no new export pipeline will be introduced. The icon will be disabled when no resolvable target layer is present.

---

### 7. Persistence

- `filter.layout.collapsed`, `filter.layout.defaultExpanded`, and `filter.disabled` will be persisted as part of the widget's existing `filters[]` array - no schema change required.
- `builderEntry` will be added to the `FILTER_PROPS` allowlist in `WidgetsUtils.js` as **transient** state and stripped on save. A unit test will assert it is not present on the persisted widget.

---

### 8. i18n

Two new / updated keys in `data.en-US.json`:

| Key | Value |
|---|---|
| `toc.createFilterWidget` | "Create a filter widget for the map" |
| `widgets.builder.wizard.selectMapLayers` | "Select a layer from the map" |

Other locales will fall back to en-US until the standard i18n pass.

---

### Design decisions

> [!NOTE]
> **Map layers, not catalog, for the TOC entry**
> The TOC-icon entry will source layers from `layersSelector` rather than the catalog. The Filter widget acts on a layer that is already on the map; if a catalog layer were chosen, the widget would build CQL with no visible target. The catalog flow remains available via the existing `Add Layer` button → user can add then create a filter. Dashboard keeps the catalog flow because it has no map context.<br>
> **Single-select (radio) on the map entry**
> One Filter widget targets one layer at a time. Multi-select would imply multi-layer interactive filtering, which is out of scope. Dashboard's `FilterLayerSelector` (catalog, multi-add) is unchanged.<br>
> **Per-filter description field - not implemented**
> An earlier round added a `data.description` per filter. The stakeholder dropped the requirement: per-filter `data.title` covers the label, and the widget-level `description` covers paragraph context. The field has been removed end-to-end.<br>
> **Disable preserves selections**
> Disabling a filter keeps the user's selections intact and only flips `filter.disabled`. The interactions epic suppresses the CQL contribution. Clearing selections on disable was tried and reverted because it forced the user to re-pick values on every toggle.<br>
> **Export reuses `LayerDownload` (no new pipeline)**
> The existing dialog supports CSV / Shapefile / GML. Per-filter CQL is merged via `mergeFiltersToOGC`. A dedicated per-filter export pipeline is not in scope.<br>
> **Zoom requires CQL → OGC conversion**
> `getLayerJSONFeature` embeds its filter argument as XML inside `<wfs:Query>`. A raw CQL string produces an invalid body and zooms to the layer's full extent. `cqlToOgc` + `<ogc:Filter>` wrapping is mandatory.<br>
> **Open layer filter targets the builder, not the TOC**
> The intended flow is to edit the filter in-place inside the widget builder. Routing to the TOC layer filter (Query) panel was tried and reverted because it left the widget builder unfocused and required the user to come back manually.

---

### Task summary & estimates

| # | Task | Estimate | Uncertainty |
|---|------|----------|-------------|
| 1 | TOC entry - `FilterWidgetTOCButton` + `builderEntry` plumbing | 1 day | Low |
| 2 | Map-layer picker - `MapLayerSelector` (radio) + `FilterBuilder` branching | 1 day | Low |
| 3 | Per-filter toolbar - collapse, zoom, open layer filter, export, enable/disable | 2 days | Medium |
| 4 | Zoom to filtered features - CQL → OGC, WFS bbox, `zoomToExtent` | 1 day | Medium |
| 5 | Open layer filter reroute - `editWidget` + `onEditorChange` + `openFilterEditor` | 0.5 days | Low |
| 6 | Export - wire `LayerDownload` with merged filter CQL | 0.75 days | Low |
| 7 | Enable/disable contract - epic short-circuit + widget UI | 0.75 days | Low |
| 8 | Layout option - `defaultExpanded` checkbox | 0.25 days | Low |
| 9 | Persistence - `FILTER_PROPS` allowlist, transient `builderEntry` | 0.25 days | Low |
| 10 | i18n - new / updated en-US keys | 0.25 days | Low |
| 11 | UX polish - header alignment, underline fix, button order | 0.75 days | Low |
| 12 | Unit tests & code refactor | 1.5 days | Medium |
| | **Total** | **~10 days** | |
