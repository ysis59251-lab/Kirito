# AnimeFume Admin (Android)

Native Android admin companion app, separate from the public AnimeFume website.

## Requirements
- Android Studio or AndroidIDE with JDK 17 and Android SDK 35.
- A Firebase project controlled by the app owner.
- Enable **Authentication → Email/Password**.
- Add an Android app in Firebase with package name `com.animefume.admin`.
- Download its `google-services.json` and place it at `app/google-services.json`. This file is intentionally not committed.
- Create a Firestore database. Create `adminUsers/{AUTH_UID}` for each approved administrator with `active: true` and `role: "owner"` (or "admin"). Never let users create or edit their own admin record.

## Build
Open this `admin-android` folder in AndroidIDE, sync Gradle, then build `app:assembleDebug`.

## Security status
Firebase Authentication verifies identity only. The app additionally reads `adminUsers/{uid}`, but **Firestore Security Rules must enforce admin permissions server-side** before connecting any management/write operations. Do not rely on hiding screens in the APK. Do not put service-account keys, private API secrets, or admin passwords in the app.

## Current scope (v3)
- Email/password sign-in and sign-out with an active-admin allow-list check.
- Real-time overview of online viewers from `onlineUsers`, excluding admin sessions and stale heartbeats.
- Real-time reports inbox backed by the website's `reports` Realtime Database path, with mark-read and delete actions.
- Announcement management backed by Realtime Database `siteConfig/announcement`, including publish and live on/off controls for owners; the website listens to the same path.
- Episode submission from Android to the existing Google Apps Script endpoint used by the website, including Thai dub/sub options.
- Owner-only assistant management through Firestore `adminUsers/{uid}` with active/role/email fields.
- Role-aware navigation with a dedicated overview, reports, announcements, episode entry and assistants workspace.
