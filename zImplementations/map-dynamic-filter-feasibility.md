# Map Dynamic Filter Feasibility

Date: 2026-04-30

## Scope

Customer asks for Map-level Dynamic Filter functionality compared with existing MapStore Dynamic Filter.

Enhancements checked:

| Enhancement | Feasibility | Estimate |
| --- | ---: | ---: |
| Check current Dynamic Filter in Map | Done | 0.5 day if repeated with target product config |
| Map-level widget holder and configuration, similar to Dashboard widgets | Feasible. Existing Map widget holder already exists; dashboard-like parity needs extra work. | 1 day if enabling existing holder; 3-5 days if adding dashboard-like configuration/view behavior |
| Adapt current Filter widget to allow selecting from all layers in current map | Feasible with moderate UI and selector work. No backend expected. | 4-6 days |
| Tests, save/load validation, regression pass | Needed | 1.5-2.5 days |

Total estimate:

| Path | Estimate |
| --- | ---: |
| Reuse existing Map `Widgets` holder and add map-layer selection for Filter widget | 6-9 dev days |
| Build Dashboard-like holder behavior for Map before/while adding map-layer Filter widget | 9-14 dev days |

## Graphify Trace Used

Checked `graphify-out/GRAPH_REPORT.md` before source work. Relevant graph hubs:

- `Epics Utils Components Widget Filter`
- `Utils Components Widgets Get Filter`
- `Components Dashboard Hooks Layouts Use`
- `Components Map Base Render`

Ran graph query:

```text
graphify query "MapStore Dynamic filter Map widget holder Dashboard widgets Filter widget layers" --budget 2500
```

Graph returned these relevant nodes:

- `components/widgets/widget/FilterWidget.jsx`
- `components/widgets/enhancers/dashboardFilterWidget.js`
- `plugins/widgets/getWidgetFilterRenderers.js`
- `epics/widgetsbuilder.js`
- `epics/dashboard.js`
- `components/widgets/enhancers/dashboardFilterWidget.js`

Graph output was used for navigation only; source was verified directly.

## Existing Dynamic Filter Behavior

Current Filter widget is already part of generic widget system:

- `web/client/components/widgets/builder/WidgetTypeSelector.jsx` exposes widget type `filter`.
- `web/client/plugins/widgetbuilder/WidgetTypeBuilder.jsx` routes `filter` to `FilterBuilder`.
- `web/client/plugins/widgetbuilder/FilterBuilder.jsx` renders filter wizard and optional layer selector.
- `web/client/plugins/widgetbuilder/FilterBuilderContent.jsx` manages multiple filters in one Filter widget.
- `web/client/components/widgets/widget/DefaultWidget.jsx` renders `widgetType === "filter"` through enhanced `FilterWidget`.
- `web/client/components/widgets/widget/FilterWidget.jsx` renders all configured filters and dispatches `applyFilterWidgetInteractions`.

Filter widget data model:

- Widget fields: `widgetType`, `filters`, `selections`, `interactions`, `dataGrid`, `title`, `description`.
- Each filter has `id`, `layout`, `items`, `data`.
- Filter `data` includes `layer`, `dataSource`, `valuesFrom`, `valueAttribute`, `labelAttribute`, `sortByAttribute`, `sortOrder`, `maxFeatures`, `filterComposition`, `noSelectionMode`, `defaultFilter`, `userDefinedType`, `userDefinedItems`.
- `createNewFilter()` is in `web/client/plugins/widgetbuilder/utils/filterBuilder.js`.
- `FILTER_PROPS` and `filterWidgetOperation()` are in `web/client/utils/WidgetsUtils.js`.

Filter values are fetched client-side:

- `web/client/components/widgets/enhancers/filterWidget.js`
- `valuesFrom === "grouped"` uses WPS distinct values through `getWpsPayload()` and `executeProcess()`.
- `valuesFrom === "single"` uses WFS through `getLayerJSONFeature()`.
- User-defined filter/style lists use static `userDefinedItems`.

Filter effects use interaction system:

- `web/client/utils/InteractionUtils.js` builds selectable targets.
- `generateRootTree(widgets, mapLayers)` includes main map layers when not editing dashboard.
- `generateLayersMetadataTree()` exposes only interaction-supported layers.
- `isInteractionSupported()` currently allows `wms` and `wfs`, excluding background layers.
- `web/client/epics/interactions.js` applies filter widgets to:
  - main map layers through `changeLayerProperties(layer.id, { layerFilter })`
  - chart/table/counter/map widgets through widget property updates
  - styles through `changeLayerProperties(layer.id, { style })`

## Existing Map-Level Holder

Map-level widget holder already exists:

- `web/client/plugins/Widgets.jsx`
- `web/client/plugins/WidgetsBuilder.jsx`
- `web/client/plugins/WidgetsTray.jsx`
- `web/client/components/widgets/view/WidgetsView.jsx`
- `web/client/reducers/widgets.js`
- `web/client/selectors/widgets.js`

Map holder details:

- `Widgets.jsx` renders widgets over the map using `WidgetsViewBase`.
- `WidgetsView.jsx` uses `react-grid-layout` and renders each widget through `DefaultWidget`.
- `WidgetsBuilder.jsx` opens a docked builder from TOC when selected layer supports widget creation.
- `WidgetsTray.jsx` handles collapsed widgets.
- `reducers/widgets.js` stores widgets under `widgets.containers.floating`.
- `selectors/mapsave.js` saves map widgets into `widgetsConfig`.
- `reducers/widgets.js` restores `widgetsConfig` on `MAP_CONFIG_LOADED`.

Existing Dashboard widget holder:

- `web/client/plugins/Dashboard.jsx`
- `web/client/components/dashboard/Dashboard.jsx`
- `web/client/components/dashboard/Layouts.jsx`
- `web/client/components/dashboard/WidgetViewWrapper.jsx`
- `web/client/plugins/AddWidgetDashboard.jsx`
- `web/client/epics/dashboard.js`

Dashboard and Map widgets share the same `widgets` reducer and widget rendering base, but Dashboard wraps it with dashboard-specific layout/view behavior and persistence through dashboard resources. Map persistence is via map `widgetsConfig`.

## Comparison: Dashboard vs Map Holder

| Area | Dashboard | Map |
| --- | --- | --- |
| Widget storage | `widgets.containers.floating` | `widgets.containers.floating` |
| Renderer | `Dashboard.jsx` -> `WidgetsView` | `Widgets.jsx` -> `WidgetsView` |
| Persistence | Dashboard resource data | Map config `widgetsConfig` |
| Add widget button | `AddWidgetDashboard` in `SidebarMenu` | `WidgetsBuilder` in TOC toolbar |
| Builder availability | Dashboard editing state | TOC selected layer and `widgetBuilder.available` |
| Layout model | Dashboard has dashboard-specific view wrapper and selected layout id | Map uses floating grid over map, saved as layout maps |
| Filter target map layers | Disabled while dashboard editing | Available in interaction tree when not dashboard editing |

Conclusion: Map-level holder is not missing. It exists. If customer means "add a dashboard-like holder concept to Map", work is mostly UX/config parity, not core widget infrastructure.

## Current Gaps Against Customer Request

### Gap 1: Map Filter widget can start from selected layer, not all map layers

`WidgetsBuilderButton` in `web/client/plugins/WidgetsBuilder.jsx` is shown from TOC only when a layer is selected and layer has `search`. This biases creation toward one selected layer.

### Gap 2: Layer selector for Filter widget is catalog-based, not map-layer-based

Filter layer selectors currently use catalog records:

- `web/client/plugins/widgetbuilder/FilterLayerSelector.jsx`
- `web/client/components/widgets/builder/wizard/filter/FilterLayerSelector.jsx`
- `web/client/plugins/widgetbuilder/enhancers/filterLayerSelector.js`

These convert selected catalog records to layers through `toLayer()` and `addSearchObservable()`. That is useful for Dashboard, but not the requested "all layers in the map".

### Gap 3: Map mode disables changing source layer once selected

`LayerSelectorField` disables the layer input when not dashboard editing and a layer exists:

- `web/client/components/widgets/builder/wizard/filter/FilterDataTab/components/LayerSelectorField.jsx`

This blocks a clean "choose among current map layers" flow for Map-level Filter widget.

### Gap 4: Interaction target tree already lists map layers, but only compatible ones

`generateRootTree()` includes main map layers only outside dashboard editing. `generateLayersMetadataTree()` filters through `isInteractionSupported()`, currently:

```text
['wms', 'wfs'] and group !== "background"
```

If customer says "all layers", clarify meaning:

- all compatible filterable layers: feasible and recommended
- literally every layer type, including backgrounds/vector/elevation/tiles without WFS metadata: not meaningful for Dynamic Filter without type-specific behavior

### Gap 5: CQL generation assumes string fields

`web/client/utils/FilterEventUtils.js` builds feature CQL with field type hardcoded to `string`. Numeric/boolean attributes may still work badly or require enhancement from layer metadata.

## Feasible Implementation

### Option A: Reuse Existing Map Widgets Holder

Recommended.

Work:

- Ensure target app config includes `WidgetsPlugin`, `WidgetsBuilderPlugin`, and optionally `WidgetsTrayPlugin`.
- Keep persistence through existing map `widgetsConfig`.
- Add Map-layer source selection to Filter widget builder.
- Keep Filter widget as a normal map widget inside existing floating grid.

Estimate: 6-9 dev days total.

Risk: low to medium. Existing holder, reducer, save/load, renderer, and interaction engine already exist.

### Option B: Add Dashboard-Like Holder Parity To Map

Only needed if customer explicitly wants dashboard-style holder UX, view tabs, or configuration separate from existing floating widgets.

Work:

- Decide whether Map should support dashboard-style view layouts or just one map widget holder.
- Adapt `Widgets.jsx` and `WidgetsView` assumptions around `layouts` shape if reusing Dashboard layout arrays.
- Add toolbar/config UI equivalent to dashboard add/configure flows.
- Keep backward compatibility with existing `widgetsConfig.layouts` map shape.

Estimate: +3-5 dev days over Option A.

Risk: medium. Existing map widgets use `react-grid-layout` layout maps; Dashboard added view wrapper semantics that are not drop-in for Map.

### Option C: Select From All Current Map Layers In Filter Builder

Recommended implementation:

- Add a Map layer selector mode for Filter widget builder.
- Source data from `layersSelector(state)`.
- Filter candidates using `isInteractionSupported(layer)` and `canGenerateFilter(layer)` / `describeFeatureType`.
- Show incompatible layers disabled with reason.
- Support multi-select.
- Reuse existing `filterWidgetOperation({ key: "filter-add" })`, because it already accepts an array of layers and creates one filter per layer.
- Reuse `filter-layer` operation for replacing one filter's source layer.
- Reset selections/interactions when source layer changes, as current logic already does.

Likely files touched:

- `web/client/plugins/widgetbuilder/FilterBuilder.jsx`
- `web/client/plugins/widgetbuilder/FilterBuilderContent.jsx`
- `web/client/plugins/widgetbuilder/FilterLayerSelector.jsx` or new map-specific selector beside it
- `web/client/plugins/widgetbuilder/enhancers/filterLayerSelector.js` or new map-layer enhancer
- `web/client/components/widgets/builder/wizard/filter/FilterDataTab/components/LayerSelectorField.jsx`
- `web/client/components/widgets/builder/wizard/filter/FilterDataTab/hooks/useLayerAttributes.js`
- `web/client/utils/WidgetsUtils.js`
- `web/client/utils/InteractionUtils.js`
- tests under `web/client/utils/__tests__`, `web/client/components/widgets/builder/wizard/filter/__tests__`, `web/client/plugins/widgetbuilder/__tests__`

Estimate: 4-6 dev days.

Risk: medium. Biggest risk is UX and layer compatibility, not core filtering.

## Acceptance Notes

Recommended acceptance criteria:

- In Map viewer, user can add a Filter widget without relying only on current TOC selected layer.
- User can select one or more compatible current map layers as Filter widget sources.
- Selecting multiple map layers creates one filter entry per layer.
- Incompatible layers appear disabled or hidden by clear rule.
- Filter widget selections can apply filters to current map layers through interactions.
- Filters persist in map `widgetsConfig` and reload with the map.
- Existing Dashboard Filter widget flow still works.
- Existing chart/table/counter/map widget interactions still work.

## Estimate Breakdown

| Task | Estimate |
| --- | ---: |
| Confirm target config and current Map widget availability | 0.5 day |
| If needed, enable existing `Widgets`, `WidgetsBuilder`, `WidgetsTray` in product config | 0.5 day |
| Add map-layer selector mode for Filter builder | 1.5-2 days |
| Multi-select all compatible map layers and reuse `filter-add` flow | 1-1.5 days |
| Allow map mode source layer change without dashboard-only restriction | 0.5 day |
| Layer compatibility validation and disabled/ineligible state | 0.75-1 day |
| Interaction UX for applying filter to all selected/compatible map layers | 1-1.5 days |
| Save/load and cleanup regression | 0.5-1 day |
| Unit/component tests | 1.5-2 days |
| Dashboard-like holder parity, if required beyond existing Map Widgets holder | +3-5 days |

## Final Feasibility Call

Feasible.

Best path is to reuse existing Map `Widgets` holder and extend Filter widget builder with a current-map-layer selector. Existing code already supports:

- map-level widgets
- map widget save/load through `widgetsConfig`
- filter widget rendering
- multiple filters inside one filter widget
- applying filter/style interactions to main map layers

Main missing piece is UI/source selection from current map layers rather than catalog-selected/dashboard-selected layers.
