# Chrome Web Store listing — QR Reader

Copy-paste values for the Developer Dashboard.

## Package

Upload `dist/qr-reader-<version>.zip` (build with `tools/build.ps1`). Bump `version` in `manifest.json` for every new upload.

## Store listing tab

**Name:** QR Reader (taken from the manifest)

**Summary** (from the manifest, ≤132 chars):
> Draw a rectangle around a QR code on the page and decode it.

**Description:**
```
Decode any QR code you can see on a web page — no phone needed.

How it works:
1. Click the QR Reader icon in the toolbar (or press Alt+Shift+Q).
2. Drag a rectangle around the QR code on the page.
3. The decoded text appears instantly. Click "Copy" to copy it, or "Open link" if it's a web address.

Features:
• Works on images, canvases and videos — anything visible on the page
• Copy the decoded value with one click
• Open decoded links in a new tab
• Handles light-on-dark (inverted) QR codes
• Keyboard shortcut: Alt+Shift+Q, Esc to cancel

Privacy:
QR Reader only runs when you click it. Decoding happens entirely inside your browser — no screenshots, page content or decoded values are ever sent anywhere. No accounts, no tracking, no analytics.
```

**Category:** Tools
**Language:** English

**Graphic assets:**
| Asset | Size | File |
|---|---|---|
| Store icon | 128×128 | `icons/icon128.png` |
| Screenshot 1 | 1280×800 | `store/screenshot-1-select.png` |
| Screenshot 2 | 1280×800 | `store/screenshot-2-result.png` |
| Small promo tile | 440×280 | `store/promo-small-440x280.png` |

## Privacy tab

**Single purpose description:**
> Decode a QR code located in a region of the current web page that the user selects by drawing a rectangle.

**Permission justifications:**

- **activeTab:** Used only after the user clicks the extension's toolbar button, to take a screenshot of the visible tab so the QR code inside the user-selected rectangle can be decoded. The screenshot is processed in memory and never stored or transmitted.
- **scripting:** Used to inject the selection overlay (where the user draws the rectangle) and the result panel into the current tab when the user clicks the toolbar button.

**Are you using remote code?** No, I am not using remote code. (The QR decoder, jsQR, is bundled in `lib/`.)

**Data usage:** Tick none of the data categories — the extension does not collect or transmit any user data.

Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://github.com/marekmis/qr-reader-chrome-extension/blob/main/store/PRIVACY.md (works once pushed; the repo must be public)

## Account tab

- One-time US$5 developer registration fee
- 2-Step Verification must be enabled on the Google account
- Contact email: marek.mis7@gmail.com (must be verified)
