# Notifications

## Purpose

CIRCLE records inbox entries for Circle activity and can deliver the same events through Expo Push on Mobile.

## Users and permissions

Circle recipients are scoped to the event's Circle. Authors are excluded from activity announcements. An event reminder goes to current Circle members who responded Yes, including the creator if they responded Yes. Notification reads and deletes are restricted to the recipient.

## Entry points

The bell on Web and Mobile opens the inbox. Circle Settings controls chat notification level and temporary or indefinite push mute. Device permissions and an active registered Expo token are required for mobile push.

## Events and destinations

| Event | Recipients | Destination |
| --- | --- | --- |
| New message or mention | Other Circle members allowed by their chat notification level | Circle channel and message when available in loaded history |
| Added to a Circle or accepted join request | Affected member | Circle chat |
| New join request | Circle owner | Member management |
| New moment | Other members of its selected Circles, deduplicated per user | Circle moments |
| Event created, changed, cancelled, or due reminder | Circle members for activity; current Yes responders for reminders | Calendar date and event when available |
| Poll created or closed | Other Circle members | Circle polls and the referenced card when available |

## API and realtime

`GET /notifications` accepts a cursor and optional type and unread filters. `GET /notifications/unread-count` returns the server count. Mark read, mark all read, and delete are available to the recipient. `GET/PATCH /notifications/circles/:circleId/settings` reads or updates the caller's membership settings. Socket.IO emits `notification:new` and `notification:unread_count` to the recipient's room.

## Persistence and delivery

In-app records are persisted before Socket.IO and Expo delivery. Push mute suppresses push while keeping eligible inbox entries. Push is capped at 20 dispatches per recipient per UTC hour. When Redis cannot enforce the cap, inbox delivery continues. Configured calendar reminders are scanned every minute before event start. Each event, recipient, and reminder time is recorded once in PostgreSQL.

## Presentation and privacy

The inbox resolves event labels from the selected Vietnamese or English locale. Expo device delivery uses the server's Vietnamese fallback. Activity notifications omit message bodies, moment captions, and event descriptions.

## Verification and limits

The local integration covers an authenticated mention and new poll, recipient isolation, inbox counts, settings, read actions, and calendar reminder deduplication. Android and iOS background and terminated push delivery require device verification. Global quiet hours and batching into digests are outside the current delivery policy.
