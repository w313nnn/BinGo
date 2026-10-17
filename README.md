# BinGo ♻️
### Making Responsible Waste Disposal Simple

BinGo is a residential waste management platform that helps residents dispose of waste responsibly and conveniently. From identifying household items to finding recycling facilities and arranging bulky-waste collection, BinGo bridges the gap between knowing how to recycle and taking action.

## 🌍 Problem Statement

Disposing of household waste is not always straightforward. Residents may struggle to identify the correct disposal method for specific items, locate nearby recycling facilities, understand collection schedules, or arrange pickups for bulky waste such as furniture and electronic appliances.

Without accessible and reliable information, recyclable and special waste may end up in general waste streams, contributing to environmental pollution and inefficient waste management.

## 💡 Our Solution

BinGo brings essential waste disposal services together in one platform, helping residents make informed decisions and take practical steps towards more sustainable living.

By combining AI-assisted item identification, recycling location discovery, collection services, report tracking, and eco-rewards, BinGo aims to make responsible waste disposal more accessible and engaging.

## ✨ Key Features

- **AI-Assisted Waste Identification** — Identify household items from photos and receive suggested disposal methods, with the option to review or correct the suggestions.
- **Recycling Point Locator** — Discover nearby recycling facilities and drop-off points for batteries, electronic waste, recyclable materials, and other supported waste categories.
- **Collection Schedule** — Check waste collection schedules and relevant disposal information.
- **Bulky-Waste Pickup Booking** — Submit pickup requests for items such as sofas, refrigerators, and other large household items by providing item details, photos, and appointment information.
- **Request and Report Tracking** — Monitor submitted collection requests and waste-related reports through their status updates.
- **Eco-Rewards** — Encourage sustainable habits through rewards for eligible recycling activities, subject to verification.

## 🔄 How It Works

1. **Identify** — Take a photo of a household item or select its category manually.
2. **Discover** — Review the recommended disposal method and locate a suitable recycling point or collection service.
3. **Take Action** — Follow disposal guidance, visit a drop-off point, or submit a bulky-waste pickup request.
4. **Track** — Check the status of submitted requests and reports.
5. **Earn** — Receive eco-rewards for eligible recycling activities after verification.

## 🎯 Target Users

- Residents living in residential communities and property developments.
- Households disposing of bulky furniture and electronic appliances.
- Individuals looking for convenient recycling and special-waste disposal options.
- Property management teams seeking to encourage more responsible waste disposal practices.

## 🌱 Expected Impact

BinGo aims to:

- Reduce confusion about proper waste disposal.
- Make recycling facilities and collection services easier to access.
- Encourage the proper handling of bulky waste and electronic waste.
- Improve visibility into collection requests and waste-related reports.
- Motivate residents to adopt sustainable habits through positive reinforcement.

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4.
- **Animation and icons:** Motion and Lucide React.
- **Services:** Firebase Authentication/Firestore and Google Maps through `@vis.gl/react-google-maps`.
- **Prototype data:** Local storage and seeded data in `src/appData.tsx`.

See [Minimal design update](docs/minimal-design.md) for the latest photo flow, animation references and validation.

## Local development

In Windows PowerShell, use `npm.cmd` in place of `npm` in the commands below.

Use a Node.js version supported by the Vite version in `package.json` (Node 22.12+).

```sh
npm install
```

Copy `.env.example` to `.env.local`, then set `VITE_GOOGLE_MAPS_API_KEY` for maps. Firebase currently reads `firebase-applet-config.json` directly; the `FIREBASE_API_KEY` example variable is not consumed by that module. Use a development Firebase project and restrict the Maps key to approved origins/APIs.

```sh
npm run dev
npm run lint
npm run build
npm run preview
```

`lint` currently checks TypeScript; it is not an ESLint or accessibility audit. There is no automated end-to-end test suite in this snapshot. Firebase subscriptions may seed documents on an empty database: integration checks should use a disposable development project.

## UI conventions and ownership

- `src/index.css`: shared color tokens, typography baseline, keyboard focus, motion preferences, form controls and responsive `.app-shell` sizing.
- `src/main.tsx`: application mounting, Maps error notification and rendering-error recovery.
- `src/App.tsx`, `src/LoginFlow.tsx`, `src/AdminPanel.tsx`: component layouts and interaction behavior. Global CSS alone cannot fix validation, modal semantics, or state transitions here.
- Use Tailwind utilities for component spacing and layout. Reuse the shared frame; avoid duplicating fixed minimum heights. Give flex scroll areas `min-height: 0` and a bounded parent height.
- Use semantic buttons and labels; give icon-only controls accessible names. Keep visible keyboard focus. Use static Tailwind classes or inline styles for computed sizes so the build can detect utilities.
- Preserve readable content at narrow widths and 200% zoom. Check loading, empty, error, success and disabled states for each action.

## Google sign-in troubleshooting

Google sign-in uses a full-page redirect on phones and a popup on desktop. If Firebase reports an unauthorized domain, add the exact host you opened BinGo from in Firebase Console → Authentication → Settings → Authorized domains. For phone testing over the LAN, this host may be a private IP such as `192.168.0.10`; if Firebase will not accept it, deploy to Firebase Hosting or use an authorized HTTPS development domain. Also confirm Google is enabled under Authentication → Sign-in method. If you use `localhost` on a project created after 28 April 2025, add `localhost` manually. A different hostname or browser profile has separate sign-in history.

## Interaction review and integration checklist

See [UI improvements and validation](docs/ui-ux-improvements.md) and [UI review](docs/ui-ux-review.md) for changes, known prototype limitations, and a repeatable test matrix. Source inspection is not proof that a live integration works.

## 🚧 Project Status

BinGo is being developed as part of the **Sime Darby Property University Hackathon 2026**.

The project focuses on demonstrating an accessible, resident-centred approach to waste identification, recycling discovery, and waste collection coordination. Some features may use simulated data or prototype workflows for demonstration purposes.

## 👥 Team

Developed by a team of four first-year Software Engineering students for the Sime Darby Property University Hackathon 2026.

## ♻️ Our Vision

We believe responsible waste disposal should be easy to understand, convenient to access, and rewarding to practise.

**BinGo — Making every disposal decision count.**
