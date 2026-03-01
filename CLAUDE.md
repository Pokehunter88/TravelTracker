# CLAUDE.md — TravelTracker

AI assistant reference for the TravelTracker codebase.

---

## Project Overview

TravelTracker is a client-side travel tracking web application. Users can mark countries as visited or wishlisted, view an interactive world map, browse a chronological travel timeline, and manage their data. There is no backend API — all persistence is via browser `localStorage`.

---

## Running the Application

```bash
npm install          # Install Express (only dependency)
node server.js       # Serve on http://localhost:8080
```

- Root `/` redirects to `/index.html`
- No build step — all assets are served directly
- No `.env` files needed

---

## Repository Structure

```
TravelTracker/
├── server.js                   # Express static file server (port 8080)
├── package.json                # Minimal: only express ^5.1.0
│
├── index.html                  # Home: world map + visited count summary
├── list.html                   # Countries/regions explorer with modal detail
├── timeline.html               # Chronological visit timeline with map
├── wishlist.html               # Wishlist view with map
├── settings.html               # Import/export data management
├── map.html                    # Standalone map (currently unused in nav)
│
├── js/
│   ├── list.js                 # Core country browsing, visit tracking, modal
│   ├── timeline.js             # Timeline rendering and map sync
│   ├── wishlist.js             # Wishlist rendering and map interaction
│   ├── calendar.js             # Custom scroll-wheel date picker component
│   └── settings.js             # JSON import/export with merge/overwrite
│
├── datasets/
│   ├── countryInfo.txt         # GeoNames TSV: country metadata (primary data source)
│   ├── countryInfo_out.txt     # Country data with timezones
│   ├── countryInfo_un.txt      # UN country data variant
│   ├── timeZones.txt           # Timezone mappings
│   └── dataset.py              # Python script used for data processing
│
├── ne_50m_admin_0_countries.geojson   # Country boundaries (Natural Earth, ~16MB)
├── ne_50m_admin_1_states_provinces.geojson  # State/region boundaries (~11MB)
├── cities.geojson              # City point data (~20MB)
├── cities15000.txt             # GeoNames cities with 15k+ population (~7.5MB)
├── countryInfo.txt             # Root-level copy of country info
└── admin1CodesASCII.txt        # Admin region codes
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Server | Node.js + Express 5 |
| UI | Vanilla HTML5 + Vanilla JavaScript (no framework) |
| Mapping | Leaflet 1.9.4 (CDN) |
| Styling | Tailwind CSS (CDN, with forms + container-queries plugins) |
| Typography | Space Grotesk, Noto Sans (Google Fonts CDN) |
| Flags | flagcdn.com SVG images |
| Data | GeoJSON, TSV (tab-separated), JSON in localStorage |

**No build tools.** No transpilation, no bundler, no TypeScript. Scripts are loaded directly in HTML or with `<script src="...">`.

---

## Data Model

All user data lives in `localStorage` under the key `"saveData"`:

```json
{
  "countryVisits": [
    {
      "country": "us",
      "date": "2024-06-15",
      "notes": "optional string"
    }
  ],
  "countryWishlists": [
    {
      "country": "jp",
      "notes": "optional string"
    }
  ]
}
```

**Key conventions:**
- Country codes: ISO Alpha-2, **lowercase** in storage (e.g. `"us"`, `"gb"`, `"jp"`)
- Country codes: **uppercase** when used to look up GeoJSON `ISO_A2_EH` properties
- Dates: ISO 8601 `"YYYY-MM-DD"` string format
- The `getSaveData()` helper (defined inline in several HTML files) handles missing keys and parse errors, always returning `{ countryVisits: [], countryWishlists: [] }`

---

## GeoJSON Property Keys

Different GeoJSON files use different property names for country codes — be careful:

| File | ISO code property |
|---|---|
| `ne_50m_admin_0_countries.geojson` | `ISO_A2_EH` |
| `ne_50m_admin_1_states_provinces.geojson` | varies by feature |

The `countryInfo.txt` dataset uses column index `0` for ISO Alpha-2 codes (parsed as lowercase).

---

## JavaScript Conventions

- **Vanilla JS only** — no React, Vue, or any framework
- `async/await` for all data loading via the Fetch API
- All data files fetched with `{ cache: "force-cache" }` for performance
- Country info stored in `Map<string, object>` for O(1) lookups: `countryInfoMap.get(code)`
- DOM element IDs follow the pattern:
  - `country-{code}` — country list items (e.g. `country-us`)
  - `region-{name}` — region list items
  - `city-{name}` — city items
- Event listeners are attached directly to elements (no event delegation pattern)
- Section headers in JS files use `// --- Section Name ---` comments

---

## HTML Page Patterns

Each page follows this structure:
1. `<head>` loads CDN dependencies (Tailwind, Leaflet, Google Fonts)
2. Dark theme applied via Tailwind class `bg-[#161a1d]` on the root div
3. Consistent navigation header with links to: Countries, Timeline, Wishlist, Settings
4. Inline `<script>` blocks for page-specific bootstrap logic
5. External `js/*.js` scripts for complex module logic

**Theme colors** (applied via Tailwind arbitrary values or inline styles):
- Background: `#161a1d`
- Border: `#2e363e`
- Visited highlight: `#2fff2b4f` (green with alpha)
- Wishlist highlight: `#2b7fff4f` (blue with alpha)
- Both (visited + wishlisted): `#2db0ae4f` (cyan with alpha)

---

## URL Navigation (Deep Linking)

`list.html` supports query parameters for deep linking:

```
list.html?tab=countries&id=us        # Open US country detail
list.html?tab=regions&id=US.CA       # Open California region detail
```

These are handled in `loadData()` in `js/list.js` using `URLSearchParams`. Navigation state is pushed with `window.history.pushState()`.

---

## Leaflet Map Conventions

- Maps are initialized with most interaction controls disabled: `zoomControl: false`, `doubleClickZoom: false`, `boxZoom: false`, `keyboard: false`, `tap: false`
- Attribution control is disabled: `attributionControl: false`
- GeoJSON layers are added with a `style` function that checks visit/wishlist status
- `fitBounds()` is used to zoom the map to a selected feature
- Map instances are stored in module-level `let map` variables

---

## Data Loading Flow (`js/list.js`)

1. Parse `datasets/countryInfo.txt` (TSV) → populate `countryInfoMap` and render country list items
2. Fetch `cities15000.txt` → build city-to-country lookup
3. Fetch `ne_50m_admin_0_countries.geojson` → render Leaflet country layer
4. Fetch `ne_50m_admin_1_states_provinces.geojson` → render Leaflet regions layer (on demand)
5. Read `localStorage["saveData"]` → populate `visitedCountries` and `wishlistedCountries` arrays

---

## Settings / Data Transfer

`js/settings.js` provides:
- **Export**: reads `localStorage["saveData"]`, populates a textarea, copies to clipboard
- **Import (Overwrite)**: validates JSON structure, writes to `localStorage["saveData"]`
- **Import (Merge)**: deduplicates entries by exact JSON key match, merges arrays

Validation requires both `countryVisits` and `countryWishlists` keys to be present.

---

## No Tests

The test suite was removed (commit `35afe9f`). There is no test runner, no test files, and no test-related npm scripts. When adding features, manually test in the browser.

---

## Development Notes for AI Assistants

- **Do not introduce a build step** — the project intentionally uses CDN scripts and plain JS
- **Do not add a backend API** — all state is localStorage; adding a server-side DB would be a major architectural change
- **Do not add npm dependencies** beyond what is strictly necessary; currently only `express` is used
- **Country codes must be lowercase** in storage and when calling `countryInfoMap.get()`; use `.toUpperCase()` only when matching GeoJSON `ISO_A2_EH` properties
- **Large GeoJSON files** (16MB, 20MB) — avoid loading them unnecessarily; they are already cached via `force-cache`
- **`getSaveData()`** is defined inline in each HTML file, not in a shared module — if adding a shared utility, note that there is no module bundler
- The `map.html` page is **not linked in the navigation** (commented out) — treat it as a work in progress
- Tailwind is loaded from CDN and used with `?plugins=forms,container-queries` — avoid assuming JIT purging or custom config
