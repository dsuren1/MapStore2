@tdipisa @allyoucanmap

## Map Dynamic Filter - Proposal

Goal: extend the existing Filter widget so it can be created and managed directly from the Map viewer.

### Scope

- Add a TOC toolbar button: **Create a filter widget for the map**.
- Show it only when the map has layers and no specific TOC layer is selected.
- Let the user pick from layers already loaded on the map instead of the catalog.
- Keep the current Dashboard/catalog flow unchanged.
- Add per-filter actions inside multi-filter widgets:
  - collapse / expand
  - zoom to filtered features
  - edit filter in the widget builder
  - export filtered data
  - enable / disable without deleting selections

### Main decisions

- The TOC entry uses map layers, not catalog layers, because the filter must target a layer already visible on the map.
- Map-layer selection is single-select. One Filter widget targets one layer; multi-layer filtering is out of scope.
- Disable keeps user selections and only suppresses that filter's CQL contribution.
- Export reuses the existing `LayerDownload` flow. No new export pipeline.
- Edit filter opens the widget builder's filter editor, not the TOC Query panel.
- Zoom uses WFS bbox from the filtered feature set. CQL must be converted to OGC XML before calling `getLayerJSONFeature`; raw CQL returns the wrong extent.

### Technical notes

- `FilterWidgetTOCButton` will call `createWidget({ widgetType: 'filter', builderEntry: 'toc-icon' })`. The existing widget creation flow already carries extra widget props into the builder, so `builderEntry` can be used to switch the builder entry path.
- When `builderEntry === 'toc-icon'`, `FilterBuilder` will render a map-layer selector based on `layersSelector`, filtered to interactive layers only (`wms` / `wfs`, excluding background layers). The existing catalog selector remains unchanged for Dashboard and catalog-based flows.
- The per-filter toolbar will update the existing `filters[]` entries. Collapse state lives under `filter.layout`; disabled state lives on `filter.disabled`.
- Disabled filters will be skipped when composing interaction CQL. The filter values remain in the widget state, so re-enabling restores the previous selection without forcing the user to configure it again.
- Zoom will build the filter CQL with the existing widget utilities, convert it to OGC XML, fetch filtered features through WFS, compute the bbox, then call `zoomToExtent`.
- Export will pass the filter CQL into the existing layer download request, where it can be merged through the current `mergeFiltersToOGC` path.

### Persistence

- Persist per-filter UI state on existing filter fields:
  - `filter.layout.collapsed`
  - `filter.layout.defaultExpanded`
  - `filter.disabled`
- Use `builderEntry` only as transient builder state. It must not be saved in the widget JSON.
- No widget schema change required.

### i18n

- Add `toc.createFilterWidget`: "Create a filter widget for the map"
- Add `widgets.builder.wizard.selectMapLayers`: "Select a layer from the map"

### Estimated work

- TOC entry + builder entry plumbing: 1 day
- Map-layer picker: 1 day
- Per-filter toolbar actions: 2 days
- Zoom / export / edit wiring: 2 days
- Enable-disable behavior and layout persistence: 1 day
- Tests and polish: 1.5 days

Total estimate: **~8.5 days**
