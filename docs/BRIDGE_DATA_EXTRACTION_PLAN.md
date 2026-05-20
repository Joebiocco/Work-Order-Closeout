# Bridge Data Extraction Plan

## Purpose

Bridge Navigator is currently slow to load, especially on phones, because the full bridge dataset is embedded directly inside `pages/njsearch.html`. This document captures the current data dependencies and a safe migration plan before any application code changes are made.

## Current Embedded Data Location

Bridge data is embedded in `pages/njsearch.html` inside the main inline script:

- `let allBridges = [];`
- `var BRIDGES_DATA = [...]`
- `allBridges = BRIDGES_DATA;`

Current file sizes:

- `pages/njsearch.html`: about 13 MB
- `data/njstructures.json`: about 14 MB

The embedded `BRIDGES_DATA` assignment is the primary load problem. The browser must download, parse, and compile a very large HTML/JavaScript payload before the page is responsive. The same bridge records also exist as a standalone JSON file.

## Existing Data File

`data/njstructures.json` already exists and does not need to be created from scratch.

Observed shape:

- Top-level JSON value: array
- Record count: 6,825
- First record includes the same fields embedded in `BRIDGES_DATA`

This file can become the source for a build/extraction script, but it should not be fetched wholesale by the Bridge Navigator page as the final optimization. Fetching it directly would remove JavaScript parse cost from the HTML, but mobile users would still download and parse a 14 MB JSON file at startup.

## Current Consumers

### `allBridges`

`allBridges` is the central in-memory array consumed by:

- Search
- Bookmark filtering
- Find My Bridge GPS scan
- Result list rendering
- Detail panel rendering
- Map marker placement for the selected bridge
- Share/copy actions after a bridge is selected

Today every consumer assumes each item is the full bridge record.

### Search

`doSearch(query)` scans `allBridges`.

Search currently checks:

- Raw `Structure_Number`
- Display-formatted structure number from `formatStructureNumber(Structure_Number)`
- `Structure_Name`
- Normalized raw structure number with dashes/spaces removed
- Normalized formatted structure number with dashes/spaces removed

Current search does not search every detail field; it is focused on structure number and bridge name.

### Result List

`_renderResults(matches, countEl, listEl, isBookmarkView)` renders result cards from bridge records.

Fields used:

- `Structure_Name`
- `Structure_Number`
- `County_Code`
- `Route_Number`
- `Milepoint`

It also checks bookmarks using raw `Structure_Number`.

### Bridge Selection, Map, and Detail Panel

`selectBridge(bridge, itemEl)` expects a full bridge record.

Map fields:

- `Latitude`
- `Longitude`
- `Structure_Name`
- `Structure_Number`

Google Maps / Street View links:

- `Latitude`
- `Longitude`

Detail panel fields:

- `Structure_Number`
- `Structure_Name`
- `Bridge_Condition_Rating`
- `Year_Built`
- `Average_Daily_Traffic_(ADT)`
- `Route_Number`
- `Milepoint`
- `County_Code`
- `Juristiction`
- `Facility_Carried`
- `Features_Intersected`
- `Latitude`
- `Longitude`
- `Lanes_On_Structure`
- `Lanes_Under_Structure`
- `Number_of_Spans_in_Main_Unit`
- `Number_of_Approach_Spans`
- `Maximum_Span_Length_(ft)`
- `Structure_Length_(ft)`
- `Bridge_Roadway_Width,_Curb-to-Curb_(ft)`
- `Deck_Width,_Out-to-Out_(ft)`
- `Calculated_Deck_Area_(SF)`
- `Total_Horizontal_Clearance_(ft)`
- `Minimum_Vertical_Underclearance_(ft)`
- `Left_Curb_or_Sidewalk_Width_(ft)`
- `Right_Curb_or_Sidewalk_Width_(ft)`
- `Approach_Roadway_Width`
- `Degrees_Skew`
- `Owner`
- `Maintenance_Responsibility`
- `Year_Reconstructed`
- `Year_of_Average_Daily_Traffic`
- `Future_Average_Daily_Traffic`
- `Year_of_Future_Average_Daily_Traffic`
- `Deck_Condition`
- `Superstructure_Condition`
- `Substructure_Condition`
- `Lowest_Component_Rating`
- `Inspection_Date`
- `Routine_Inspection_Frequency`
- `Underwater_Inspection`
- `Underwater_Inspection_Date`
- `Deck_Structure_Type`
- `Type_of_Wearing_Surface`
- `Type_of_Membrane`
- `Deck_Protection`
- `Median`
- `Bridge_Railings`
- `Transitions`
- `Approach_Guardrail`
- `Approach_Guardrail_Ends`
- `Bridge_Improvement_Cost`
- `Roadway_Improvement_Cost`
- `Total_Project_Cost`
- `Year_of_Improvement_Cost_Estimate`

Municipality is not stored in the bridge data. It is reverse-geocoded after selection with Nominatim and cached in the page-level `muniCache` object by rounded coordinate key.

### Share

`buildBridgeShareText(bridge)` and `shareBridgeInfo(bridge, btn)` consume:

- `Structure_Number`
- `Structure_Name`
- `Route_Number`
- `Milepoint`
- `Latitude`
- `Longitude`

Desktop copies text to the clipboard. Mobile opens an SMS compose link.

### Copy Fields

`wireDetailCopyFields(root)` does not consume bridge records directly. It attaches click handlers after the detail HTML is rendered and copies visible text from:

- `.detail-title`
- `.detail-field`
- `.summary-stat`

So copy behavior depends on the detail panel being rendered from a full bridge record first.

### Find My Bridge

The GPS locator scans `allBridges` and requires:

- `Latitude`
- `Longitude`
- `Structure_Length_(ft)`
- `Structure_Name`
- `Structure_Number`
- `County_Code`
- `Route_Number`

It computes distance from the user to every bridge and uses a per-bridge radius:

- `max(50m, Structure_Length_(ft) + 40m GPS buffer)`

This is the feature most suited to geographic chunking.

## Bookmarks and Raw Structure Numbers

Bridge bookmarks are stored in localStorage key `ft_bridge_bookmarks`.

Format:

```js
JSON.stringify(["structNum1", "structNum2"])
```

The stored values are raw `Structure_Number` strings, not display-formatted values.

Current functions:

- `getBookmarks()`
- `setBookmarks(arr)`
- `isBookmarked(structNum)`
- `toggleBookmark(structNum)`

Important migration rule:

Do not change stored bookmark values. Raw `Structure_Number` must remain the stable key for bookmarks, lookups, cache maps, chunks, and migration compatibility.

## Raw vs Formatted Structure Numbers

Raw values come from `bridge.Structure_Number`.

Display values are generated by:

```js
formatStructureNumber(value)
```

The formatter:

- Preserves a dash if one exists and can extract left/right portions.
- Otherwise strips non-alphanumeric characters.
- Uses the last seven compact characters when possible.
- Returns visible format like `1023-152`.

Search supports both raw and formatted values:

- Regex against raw `Structure_Number`
- Regex against `formatStructureNumber(Structure_Number)`
- Normalized raw string without dashes/spaces
- Normalized formatted string without dashes/spaces

Migration must preserve this behavior. A statewide lightweight index should include both raw and preformatted/normalized structure-number variants to avoid repeatedly formatting every record during search.

## Required Data Sets After Migration

Recommended hybrid design:

### 1. Statewide Lightweight Search Index

Small file, loaded at page startup.

Example path:

```text
data/bridges/index.json
```

Each item should include only fields needed for search, result list, bookmarks, shared query resolution, and chunk lookup:

- `Structure_Number`
- `structureDisplay`
- `structureNorm`
- `structureDisplayNorm`
- `Structure_Name`
- `nameNorm`
- `Route_Number`
- `Milepoint`
- `County_Code`
- `Latitude`
- `Longitude`
- `chunk`

Optional for GPS prefiltering:

- `Structure_Length_(ft)`

Including lat/lng and length in the index allows Find My Bridge to run from the index and only load the full chunk after a candidate is selected. If the index size remains reasonable, this is simpler and safer than loading nearby chunks before every GPS scan.

### 2. Full Record Chunks

Chunk files containing full original bridge records.

Example paths:

```text
data/bridges/chunks/<chunk-id>.json
```

Possible chunk strategies:

- County chunks: simple, predictable, good enough for 6,825 records.
- Geographic tile chunks: closer to the Milemarker model, better for GPS boundary handling and future map-based browsing.

For Bridge Navigator, county chunks plus a statewide index may be enough. If using geographic tiles, include neighboring tile loading for Find My Bridge near boundaries.

### 3. Structure Lookup Map

The startup index should support:

```js
structNum -> index item -> chunk id
```

This is necessary for:

- Bookmark list rendering
- Opening shared/search links like `?q=0101-150`
- Loading the full record for selected results

## Proposed Migration Steps

1. Add a bridge data extraction script.
   - Source: `data/njstructures.json`
   - Output: `data/bridges/index.json`
   - Output: `data/bridges/chunks/*.json`
   - Preserve raw `Structure_Number` exactly.

2. Decide chunk strategy.
   - Preferred first implementation: county chunks or simple geo tiles with an index.
   - If using geo tiles, use a stable tile id and include neighbor lookup for GPS.

3. Generate the statewide lightweight index.
   - Include raw, formatted, and normalized structure-number fields.
   - Include enough metadata for result cards and bookmark cards.
   - Include `chunk` for each record.

4. Update `pages/njsearch.html` data loading.
   - Remove inline `BRIDGES_DATA`.
   - Replace immediate `allBridges = BRIDGES_DATA` with async loading of `data/bridges/index.json`.
   - Show an explicit loading state until the index is available.

5. Refactor search to use the lightweight index.
   - Search should return index items.
   - Result cards should render from index items.
   - Raw `Structure_Number` remains the key.

6. Add a full-record loader.
   - `loadBridgeRecord(structNum)` looks up the index item, fetches its chunk, caches the chunk in memory, and returns the full record.
   - Keep an in-memory chunk cache for repeated selections.

7. Update `selectBridge`.
   - Accept either an index item or a full record.
   - If only an index item is available, load the full record before rendering detail/map/share controls.
   - Show a small detail loading state while the chunk loads.

8. Update bookmark filtering.
   - Use raw `Structure_Number` values from `ft_bridge_bookmarks`.
   - Resolve them against the statewide index.
   - Render bookmark results from index items.
   - Load full record only on selection.

9. Update shared query initialization.
   - Defer `?q=` search until index is loaded.
   - Structure-number searches must still match with or without dash.
   - If a query uniquely identifies a bridge, select it after loading the full record.

10. Update Find My Bridge.
    - Option A: Use statewide lightweight index with lat/lng/length to find candidates, then load selected full record.
    - Option B: Load current and neighboring geo chunks, then run existing full-record distance logic.
    - Option A is safer for search consistency; Option B is closer to Milemarker and can reduce memory further.

11. Update service worker caching.
    - Remove `pages/njsearch.html` as a huge precache target after the embedded data is removed.
    - Do not precache all bridge chunks.
    - Cache `data/bridges/index.json` on demand or as a small install asset if it is compact enough.
    - Cache chunk files when requested.

12. Update `AGENTS.md` after implementation.
    - Document new data files, chunk strategy, loader functions, and service worker behavior.

## Rollback Plan

1. Keep the current inline-data version available in git history.
2. Implement extraction in one commit with no unrelated UI changes.
3. If search/bookmarks/detail/GPS breaks, revert that commit.
4. Restore:
   - Inline `BRIDGES_DATA`
   - `allBridges = BRIDGES_DATA`
   - Original service worker asset list
5. Keep generated chunk files harmlessly unused or remove them in the rollback commit.
6. Do not clear localStorage. Bookmarks remain valid because raw `Structure_Number` values are unchanged.

## Manual Tests

### Load and Startup

- Open `pages/njsearch.html` on desktop.
- Open it on mobile-sized viewport.
- Confirm the page shell appears before bridge data finishes loading.
- Confirm a loading state is visible and then changes to the normal search prompt.
- Confirm no console errors.

### Search

- Search by raw structure number, for example `0101150`.
- Search by formatted structure number, for example `0101-150`.
- Search by partial structure number with no dash.
- Search by bridge name.
- Confirm result count and first result are sensible.
- Confirm result cards show formatted `XXXX-XXX` structure numbers.

### Shared Links

- Open `pages/njsearch.html?q=0101-150`.
- Confirm the search runs after index load.
- Confirm the expected bridge appears and can be selected.

### Detail Panel

- Select a bridge.
- Confirm map centers and marker appears.
- Confirm Google Maps and Street View links use the bridge coordinates.
- Confirm every detail zone renders.
- Confirm municipality lookup still updates after selection.

### Share

- On desktop, click Share and confirm clipboard text includes:
  - Structure
  - Bridge
  - Route
  - Milepost
  - Google Maps link
- On mobile, confirm Share opens SMS compose with the same line-by-line content.

### Copy

- Click the bridge name in the detail header.
- Click Route, Milepoint, County, and Coordinates fields.
- Confirm only the visible value is copied, not the field label.
- Confirm copied animation still appears.

### Bookmarks

- Save a bridge.
- Refresh page.
- Open bookmark filter.
- Confirm saved bridge appears even before its full chunk is loaded.
- Select saved bridge and confirm full details load.
- Remove bookmark and confirm it disappears from bookmark view.

### Find My Bridge

- Use browser geolocation test coordinates near a known bridge.
- Confirm one nearby bridge auto-selects.
- Test a location near multiple structures and confirm picker opens.
- Test a location away from bridges and confirm nearest-distance empty state.
- Test a tile/chunk boundary case if geo chunks are used.

### Offline / Service Worker

- Visit Bridge Navigator once online.
- Reload online and confirm latest files are used.
- Go offline after index/chunk has been cached.
- Confirm already fetched chunks still work if cached.
- Confirm non-fetched chunks show a clear error instead of silently failing.

### Regression

- Confirm `ft_bridge_bookmarks` localStorage values are unchanged raw `Structure_Number` strings.
- Confirm no data migration or clearing is required.
- Confirm Fuel Station Finder, Work Order, Payroll, and Milemarker pages still load.
