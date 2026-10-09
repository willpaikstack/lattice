# Customer onboarding initial draft

Interactive preview of the proposed Lattice customer invitation, sign-in, password setup, shipping, billing, welcome, four-stop contextual tour, and empty workspace handoff. The storyboard below the preview links directly to each tour stop. Includes new/existing identity copy variants, an expired-invitation recovery screen, optional address entry, skip/replay, and expanded view.

The application entry is `/admin/resources/customer-onboarding`, linked from Admin Resources and protected by the existing admin layout. All preview data is synthetic; authentication fields are read-only. Forms advance local preview state only. No email is sent, credentials changed, records written, or requests submitted. Progress resets on reload. Live onboarding and durable progress remain future integration work.

## Standalone review

The standalone entry imports the same React component and CSS module used in the app. Welcome, Tour, and Workspace embed the actual application shell and shared dashboard from `http://localhost:3000/customer-onboarding-workspace`; they require the local Next.js app running on port 3000 and a signed-in Lattice Admin in the same browser. This route remains admin-only. It is not a fully offline export. Build using the existing local Vite tooling:

```sh
npx vite build --config design-exports/customer-onboarding/vite.config.mts
python3 -m http.server 3012 --bind 127.0.0.1 --directory outputs/customer-onboarding
```

Open `http://localhost:3012/` so the workspace frame shares the localhost sign-in context. Generated assets are gitignored under `outputs/customer-onboarding`. The standalone entry uses a system font fallback; the app uses its existing Geist font. No app authentication bypass is introduced.

## Review controls

- Select any screen from the numbered navigation to jump directly to it.
- Follow the primary buttons to play the complete sequence.
- Use Finish later to bypass initial addresses.
- Use Help → Replay introduction after completing or skipping the tour.
- Click any storyboard card to inspect its highlighted target and explanation.
- Restart resets the sequence; Expand preview gives the draft more room.

The workspace uses the same `AppShell` and `CustomerDashboardView` as the real customer dashboard, with empty synthetic data and a preview-only proposed Help entry. Its iframe has its own responsive viewport, font, and styles. Tour spotlights track the measured sidebar controls on desktop and compact navigation/dashboard action on smaller screens. Preview navigation, sign-out, notification requests, and sidebar personalization are intercepted or disabled. Production wiring needs actual account state, role permissions, provider-native authentication, durable per-membership progress, and broader accessibility validation.
