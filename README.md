# BinGo ♻️
### Making Responsible Waste Disposal Simple

BinGo is a residential waste management platform that helps residents dispose of waste responsibly and conveniently. From identifying household items to finding recycling facilities and arranging bulky-waste collection, BinGo bridges the gap between knowing how to recycle and taking action.

## 🌍 Problem Statement

Disposing of household waste is not always straightforward. Residents may struggle to identify the correct disposal method for specific items, locate nearby recycling facilities, understand collection schedules, or arrange pickups for bulky waste such as furniture and electronic appliances.

Without accessible and reliable information, recyclable and special waste may end up in general waste streams, contributing to environmental pollution and inefficient waste management.

## 💡 Our Solution

BinGo brings essential waste disposal services together in one platform, helping residents make informed decisions and take practical steps towards more sustainable living.

By combining AI-assisted item identification, recycling location discovery, collection services, report tracking, and eco-rewards, BinGo aims to make responsible waste disposal more accessible and engaging.

## 🚀 Prototypes & Demo

Explore BinGo through our interactive prototypes:

- **Live Web Prototype:** [Try BinGo](https://bingo-git-integration-ui-map-data-tslc1.vercel.app/)
- **Figma Prototype:** [View Design & Interactive Prototype](https://www.figma.com/make/UOZv0HlNpWA8ealVSiSfqZ/Smart-Waste-Management-System--Copy-?code-node-id=0-9&p=f&t=8G4BqaBnUbTmaTgc-0&fullscreen=1)

## ✨ Key Features

- **AI-Assisted Waste Identification** — Identify household items from photos and receive suggested disposal methods, with the option to review or correct the suggestions.
- **Recycling Point Locator** — Discover nearby recycling facilities and drop-off points for batteries, electronic waste, recyclable materials, and other supported waste categories.
- **Collection Schedule** — Check waste collection schedules and relevant disposal information.
- **Bulky-Waste Pickup Booking** — Submit pickup requests for items such as sofas, refrigerators, and other large household items by providing item details, photos, and appointment information.
- **Request and Report Tracking** — Monitor submitted collection requests and waste-related reports through their status updates.
- **Green Points** — Encourage sustainable habits through rewards for eligible recycling activities, subject to verification.

## 🔄 How It Works

1. **Identify** — Take a photo of a household item or select its category manually.
2. **Discover** — Review the recommended disposal method and locate a suitable recycling point or collection service.
3. **Take Action** — Follow disposal guidance, visit a drop-off point, or submit a bulky-waste pickup request.
4. **Track** — Check the status of submitted requests and reports.
5. **Earn** — Receive Green Points for eligible recycling activities after verification.

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
- Motivate residents to adopt sustainable habits through Green Points and positive reinforcement.

## 🛠️ Technology Stack

| Area | Technologies | Purpose |
|---|---|---|
| Frontend | React 19, TypeScript | Build the resident and administrator interfaces. |
| Styling and UI | Tailwind CSS, Lucide React, Motion | Style the interface and provide icons and animations. |
| Build Tool | Vite | Run the development server and build the web application. |
| Backend Services | Firebase | Provide managed authentication and database services. |
| Authentication | Firebase Authentication | Support user sign-in, including Google sign-in. |
| Database | Cloud Firestore | Store application records and synchronise updates with the interface. |
| Maps | Google Maps JavaScript API via `@vis.gl/react-google-maps` | Display maps and collection-point locations. |
| Design and Prototyping | Figma | Design and demonstrate interactive user flows. |
| Web Prototype Hosting | Vercel | Host the linked web prototype. |

**AI feature status:** Waste identification runs locally in the browser using the included ONNX model and ONNX Runtime Web. Suggestions can be reviewed and corrected manually. The Google Gen AI SDK (`@google/genai`) is included as a dependency; this flow does not use a live Gemini service.

## 🚧 Project Status

BinGo is being developed as part of the **Sime Darby Property University Hackathon 2026**.

The project focuses on demonstrating an accessible, resident-centred approach to waste identification, recycling discovery, and waste collection coordination. Some features may use simulated data or prototype workflows for demonstration purposes.

## 👥 Team

Developed by a team of four first-year Software Engineering students for the Sime Darby Property University Hackathon 2026.

## ♻️ Our Vision

We believe responsible waste disposal should be easy to understand, convenient to access, and rewarding to practise.

**BinGo — Making every disposal decision count.**

## Run and validate

Use Node.js 22.12+ (Node.js 24 recommended). Run `npm ci`, then `npm run dev`. Copy `.env.example` to `.env.local` to configure your restricted Maps browser key. The point directory remains available without a Maps key.

Run `npm run lint`, `npm test`, and `npm run build` to validate changes. See [current Firebase configuration](docs/CURRENT-FIREBASE.md) before changing or deploying backend configuration.
