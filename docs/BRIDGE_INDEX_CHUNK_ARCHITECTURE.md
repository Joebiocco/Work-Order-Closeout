# Bridge Index + County Chunk Architecture

Date: 2026-05-20

Purpose: document the Bridge Navigator data architecture that replaces one full statewide JSON startup load with a lightweight statewide index plus county detail chunks.

## 1. Confirmed Current State

- `pages/njsearch.html` is about 541 KB.
- `data/njstructures.json` exists and is about 12.4 MB.
- Bridge records are no longer embedded inline in `pages/njsearch.html`.
- `pages/njsearch.html` normal startup loads `../data/bridges/index.json` through `loadBridgeIndex()`.
- `bridgeIndex` is populated at startup with lightweight statewide records.
- `data/njstructures.json` remains in the repo as the source archive and fallback, but it is not fetched during normal startup.
- `service-worker.js` pre-caches `data/bridges/index.json`.
- `data/bridges/index.json` exists.
- `data/bridges/chunks/by-county/` exists and contains one full-record chunk per county.
- Bridge bookmarks use raw `Structure_Number` strings in `localStorage["ft_bridge_bookmarks"]`.
- Visible structure numbers are formatted for display as `XXXX-XXX`, but raw `Structure_Number` values remain the stable data key.
- Search, result cards, map marker basics, detail rendering, Find My Bridge, bookmarks, share, and copy currently consume full bridge records from `allBridges`.

## 2. Proposed Final File Structure

```text
Work Order Website/
├── data/
│   ├── njstructures.json
│   │   └── Transition fallback only; eventually removable after index/chunks are proven stable.
│   └── bridges/
│       ├── index.json
│       └── chunks/
│           └── by-county/
│               ├── ATLANTIC.json
│               ├── BERGEN.json
│               ├── BURLINGTON.json
│               ├── CAMDEN.json
│               └── ...
└── pages/
    └── njsearch.html
```

County file names should use a stable generated `countyCode`, preferably uppercase ASCII with spaces and punctuation normalized to underscores. Missing or unusable county values should go to a predictable fallback such as `UNKNOWN.json`.

## 3. Index JSON Schema

`data/bridges/index.json` should be a lightweight statewide list. It should include only fields required for startup, search, cards, map basics, bookmarks, and GPS matching.

```json
{
  "metadata": {
    "schemaVersion": 1,
    "recordCount": 6825,
    "generatedDate": "2026-05-20",
    "source": "Derived from data/njstructures.json",
    "chunkStrategy": "by-county"
  },
  "records": [
    {
      "Structure_Number": "0101150",
      "structureNumberDisplay": "0101-150",
      "structureNumberSearch": "0101150",
      "searchText": "0101150 0101-150 bridge name county route municipality feature milepoint",
      "Structure_Name": "Example Bridge Name",
      "County": "Atlantic",
      "County_Code": "ATLANTIC",
      "countyCode": "ATLANTIC",
      "Municipality": "Example Township",
      "Route_Number": "Route 9",
      "Facility_Carried": "Route 9",
      "Features_Intersected": "Example Creek",
      "Milepoint": "12.34",
      "Latitude": 39.123456,
      "Longitude": -74.123456,
      "Structure_Length_(ft)": 120.5,
      "chunkPath": "../data/bridges/chunks/by-county/ATLANTIC.json"
    }
  ]
}
```

Notes:

- `Structure_Number` must preserve the exact raw value from the current source record.
- `structureNumberDisplay` is the preformatted display value, such as `1023-152`.
- `structureNumberSearch` is the normalized raw structure number search key, with formatting removed.
- `searchText` is the normalized general search string used for names, county, route, municipality, crossed feature, milepoint, and other lightweight searchable text.
- `chunkPath` should be directly fetchable from `pages/njsearch.html`.

## 4. County Chunk JSON Schema

Each county chunk should preserve full source records for that county. Chunks are for detail only, not for startup search or GPS candidate matching.

```json
{
  "metadata": {
    "schemaVersion": 1,
    "countyCode": "ATLANTIC",
    "county": "Atlantic",
    "recordCount": 312,
    "generatedDate": "2026-05-20",
    "source": "Derived from data/njstructures.json"
  },
  "records": [
    {
      "Structure_Number": "0101150",
      "Structure_Name": "Example Bridge Name",
      "County": "Atlantic",
      "County_Code": "ATLANTIC",
      "Latitude": 39.123456,
      "Longitude": -74.123456
    }
  ]
}
```

The records inside each chunk should keep all fields currently used by search, map, detail, bookmarks, share, and copy, even if some of those fields are also duplicated in the index. This keeps the full detail renderer compatible with existing field names.

## 5. Required Index Fields

Every index record should include:

- Raw `Structure_Number`.
- Formatted structure number, such as `XXXX-XXX`.
- Normalized structure number search string.
- Normalized general search string.
- `Structure_Name`, if available.
- `County`, if available.
- `County_Code` or generated `countyCode`.
- `Municipality`, if available.
- `Route_Number` or feature carried, if available.
- Feature intersected or crossed, if available.
- `Milepoint`, if available.
- `Latitude`.
- `Longitude`.
- `Structure_Length_(ft)`, if available.
- `chunkPath`.

Latitude and longitude are required for Find My Bridge and map marker basics. Records without usable coordinates should remain searchable, but Find My Bridge should skip them.

## 6. Future `doSearch(query)` Behavior

`doSearch(query)` should search the statewide index, not full county chunks.

Expected flow:

1. Wait until the index is loaded.
2. Normalize the query using the same visible behavior that exists today.
3. Preserve raw and formatted structure-number matching. For example, `1023152`, `1023-152`, and partial `1023` searches should continue to work.
4. Match against `structureNumberSearch` for structure-number style queries.
5. Match against `searchText` for name, route, county, municipality, crossed feature, milepoint, and other general searches.
6. Apply bookmark filtering by comparing raw `Structure_Number` values to `ft_bridge_bookmarks`.
7. Return index records to `_renderResults(...)`.

No county chunk should be fetched during ordinary searching.

## 7. Future `_renderResults(...)` Behavior

`_renderResults(...)` should render result cards from index records.

Result cards should continue to show the same practical information currently visible, using lightweight fields:

- Formatted structure number.
- Structure name, if available.
- County, municipality, or route summary, if available.
- Milepoint, if available.
- Bookmark state based on raw `Structure_Number`.

The result card should pass the selected index record, or at least its raw `Structure_Number`, into `selectBridge(...)`. It should not fetch county chunks just to display search results.

## 8. Future `selectBridge(...)` Behavior

`selectBridge(...)` should become async-aware while preserving visible behavior.

Expected flow:

1. Accept an index record or raw `Structure_Number`.
2. Mark the selected result visually right away.
3. Use index latitude and longitude to update the map marker immediately.
4. Show a small loading state in the detail panel while the full record loads.
5. Call `getFullBridgeRecord(structureNumber)`.
6. Render the existing full detail panel with the returned full record.
7. Wire bookmark, share, copy, and map actions after the full record is available.

The implementation should guard against stale async responses. If the user selects Bridge A and then Bridge B before Bridge A's chunk finishes loading, Bridge A's late response must not overwrite Bridge B's detail panel.

## 9. Future `getFullBridgeRecord(structureNumber)` Behavior

`getFullBridgeRecord(structureNumber)` should load exactly one county chunk for the requested bridge.

Expected flow:

1. Look up the raw `Structure_Number` in an in-memory index lookup map.
2. Read the index record's `chunkPath`.
3. Fetch that chunk if it is not already cached.
4. Normalize the chunk payload to a `records` array.
5. Find the full record where `record.Structure_Number === structureNumber`.
6. Return the full record.
7. Throw or return a controlled error state if the index record or full record cannot be found.

The lookup must use exact raw `Structure_Number` matching so existing bookmarks and analytics identifiers remain stable.

## 10. Bookmark Compatibility

Existing bookmarks remain valid because `ft_bridge_bookmarks` already stores raw `Structure_Number` strings.

Migration rules:

- Do not rename `ft_bridge_bookmarks`.
- Do not rewrite bookmark values.
- Do not store formatted structure numbers as bookmark keys.
- Bookmark filter mode should resolve bookmarked raw structure numbers against the statewide index.
- Opening a bookmarked bridge should load the full county chunk only after the user selects that bridge.

This preserves user data and keeps bookmarked searches fast.

## 11. Find My Bridge / GPS Matching

Find My Bridge must scan the statewide index. It must not load county chunks to determine the nearest bridge.

Index records must provide:

- `Latitude`
- `Longitude`
- `Structure_Length_(ft)`, when available
- raw `Structure_Number`
- display/name fields for the multiple-match picker

The existing dynamic radius logic should be preserved:

```text
candidate radius = max(50 meters, structure length in meters + 40 meter GPS buffer)
```

Records without valid latitude or longitude should be skipped for GPS matching. If one or more candidates are found, the picker or selected bridge should use index records for the candidate list. Only after the user selects a bridge, or a single nearest bridge is auto-selected, should the app call `getFullBridgeRecord(...)` for full detail.

## 12. Share, Copy, And Detail Field Timing

The following should use full records, not lightweight index records:

- `buildBridgeShareText(...)`
- `shareBridgeInfo(...)`
- `wireDetailCopyFields(...)`
- Detail copy fields
- Header structure-name copy
- Any full detail panel rows

Recommended behavior:

- Disable or show loading state for share and copy controls until full detail is ready.
- If a share/copy action is triggered while detail is still loading, await the same full-record promise instead of issuing another fetch.
- After full detail renders, wire copy fields exactly once for the current selected detail panel.
- If full detail fails, show a controlled error and keep the lightweight result/map selection intact.

## 13. In-Memory Chunk Cache Design

Use an in-memory `Map` for loaded county chunks.

Recommended caches:

```text
bridgeIndexRecords: Array<IndexRecord>
bridgeIndexByStructureNumber: Map<raw Structure_Number, IndexRecord>
countyChunkCache: Map<chunkPath, Promise<ChunkPayload or ChunkLookup>>
fullRecordCache: Map<raw Structure_Number, FullBridgeRecord>
```

Important details:

- Cache the in-flight Promise, not only the resolved records. This prevents duplicate network requests when two actions request the same county at the same time.
- Keep the cache in memory only. Do not add localStorage or IndexedDB for bridge chunks.
- No eviction is needed for the first implementation because there are only 21 counties and users normally open a small subset in one session.
- If memory pressure appears later, add simple least-recently-used eviction for `countyChunkCache`, but do not add that complexity up front.

## 14. Transition Fallback Plan

During migration, keep `data/njstructures.json` as a fallback.

Suggested transition loader:

1. Try to fetch `../data/bridges/index.json`.
2. If index fetch succeeds, use the index architecture.
3. If index fetch fails, fetch `../data/njstructures.json`.
4. If fallback succeeds, derive a temporary in-memory index from the full records and keep existing behavior available.
5. If both fail, show the existing bridge data error state.

Fallback should be temporary. Once the index and county chunks are proven stable locally and live, remove the startup dependency on `data/njstructures.json`.

## 15. Service Worker Plan

Current service worker behavior:

- Pre-caches `data/bridges/index.json`.
- Does not pre-cache `data/njstructures.json`.
- Runtime-caches county chunks after first successful fetch.
- Does not pre-cache all county chunks unless explicitly approved.

Suggested caching model:

- HTML remains network-first.
- `data/bridges/index.json` can be cache-first or network-first depending on freshness preference, but it should be small enough to pre-cache.
- County chunks should be runtime cached after successful fetch so reopened details can work offline after first use.
- The service worker cache name should only be bumped immediately before a push, after user confirmation, following the existing version rule.

## 16. Rollback Plan

If the index/chunk migration causes production issues:

1. Revert `pages/njsearch.html` loader changes back to `loadBridgeData()` fetching `../data/njstructures.json`.
2. Restore `allBridges` as full records at startup.
3. Restore `service-worker.js` pre-cache behavior for `data/njstructures.json`.
4. Leave `data/bridges/index.json` and county chunks in the repo if desired; they are harmless when unused.
5. Do not touch `ft_bridge_bookmarks`; raw bookmark keys remain valid in both architectures.
6. Verify search, bookmarks, Find My Bridge, share, copy, and formatted structure-number display after rollback.

Rollback should not require any localStorage migration.

## 17. Manual Test Checklist

Startup and loading:

- Load Bridge Navigator on desktop with a clean cache.
- Load Bridge Navigator on mobile or mobile emulation with a clean cache.
- Confirm initial load does not fetch county chunks.
- Confirm a visible loading state appears while the index loads.
- Simulate index fetch failure and confirm fallback to `data/njstructures.json`.
- Simulate both index and fallback failure and confirm a clear error state.

Search:

- Search by raw structure number, such as `1023152`.
- Search by formatted structure number, such as `1023-152`.
- Search by partial structure number, such as `1023`.
- Search by bridge name.
- Search by route or facility carried.
- Search by county.
- Search by crossed feature.
- Confirm result cards match current visible behavior.
- Confirm search does not fetch county chunks.

Detail selection:

- Select a search result and confirm the map updates quickly from index coordinates.
- Confirm the detail panel shows a loading state while the county chunk loads.
- Confirm full detail fields match the current single-JSON behavior.
- Select two bridges quickly and confirm the later selection wins.
- Select bridges from different counties and confirm each county chunk loads once.

Bookmarks:

- Confirm existing `ft_bridge_bookmarks` entries still appear.
- Add a bookmark and confirm the stored key is raw `Structure_Number`.
- Toggle bookmark filter and confirm it uses index records.
- Open a bookmarked bridge and confirm the full county chunk loads only then.

Find My Bridge:

- Confirm GPS nearest bridge scans the statewide index.
- Confirm county chunks are not fetched during candidate matching.
- Confirm the existing dynamic radius behavior still uses `Structure_Length_(ft)` when available.
- Confirm zero-match, single-match, and multiple-match picker states.
- Confirm selecting a GPS candidate loads full detail from its county chunk.

Share and copy:

- Confirm share text includes the same fields as current behavior.
- Confirm share waits for full detail if the chunk is still loading.
- Confirm copy fields copy only displayed values, not labels.
- Confirm header structure-name copy still uses the full detail name.

Map:

- Confirm marker placement works from index latitude/longitude.
- Confirm Street View and Google Maps links still work after full detail loads.

Offline and service worker, once implemented:

- Confirm `data/bridges/index.json` is available offline after pre-cache.
- Confirm a county detail previously opened online is available offline from runtime cache.
- Confirm a county detail never opened online shows a graceful offline error.
- Confirm `data/njstructures.json` is not pre-cached during the index/chunk rollout.

## Assumptions About Source Field Names

- Full records come from `data/njstructures.json.records`.
- `Structure_Number` is always the raw stable identifier and must not be reformatted in storage.
- `Structure_Name` is the preferred name field when present.
- `County` may exist, but if not, `County_Code` or another county-like source field may need to generate both display county and `countyCode`.
- `Municipality` should be indexed only when available.
- Route display may come from `Route_Number`, `Facility_Carried`, or an existing feature-carried field, depending on what the current record provides.
- Crossed feature may come from `Features_Intersected` or the current equivalent field.
- `Milepoint`, `Latitude`, `Longitude`, and `Structure_Length_(ft)` should preserve current field names for compatibility with existing detail, share, copy, and GPS code.
