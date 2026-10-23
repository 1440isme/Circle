# Lessons Learned

Post-mortems, bug analyses, and root-cause takeaways.

---

## Lesson 01: Avoid Direct SQL Strings in Dynamic Filters
- **Problem:** Dynamic filtering by circle tags or member status constructed through raw string concatenation introduces SQL injection risks.
- **Root Cause:** Bypassing Prisma's type-safe `where` builder.
- **Resolution:** Strictly use Prisma's nested `where` clauses with input validated by class-validator DTOs.

## Lesson 02: Socket Event Storms on Disconnection
- **Problem:** When a client disconnected abruptly, 100+ socket clients received repeated connection status updates.
- **Root Cause:** Broadcasting presence without debouncing rapid reconnection attempts.
- **Resolution:** Implemented a 5-second debounce window in Redis for user offline status broadcast.

## Lesson 03: VirtualizedList Degradation on Fast-Paging Media Feeds
- **Problem:** Moment snap paging feed triggered severe delays and warnings: `VirtualizedList: You have a large list that is slow to update (dt: 4686ms)`.
- **Root Cause:** Re-instantiating unmemoized inline feed cards, callbacks, and feed arrays on every scroll and parent re-render.
- **Resolution:** Extracted feed card into `React.memo(MomentFeedCardItem)`, memoized callbacks and feed items, and calibrated batch parameters (`initialNumToRender: 1, maxToRenderPerBatch: 2, windowSize: 3, updateCellsBatchingPeriod: 50`).

## Lesson 04: Silent Offscreen View Compositing in React Native
- **Problem:** Dynamic image stitching via `react-native-view-shot` flashed visual frames over UI and shrank exported images into a small corner of the canvas.
- **Root Cause:** Views mounted inside visible coordinate trees without zero-clipping bounds, combined with hardcoded `width/height` capture options overriding native layout frames.
- **Resolution:** Encapsulated offscreen capture in a zero-size wrapper (`width: 0, height: 0, overflow: 'hidden'`) at `(0, 0)`, bound capture target directly to `momentFrameSize`, and let `captureRef` derive canvas resolution from native view bounds and device pixel density.
