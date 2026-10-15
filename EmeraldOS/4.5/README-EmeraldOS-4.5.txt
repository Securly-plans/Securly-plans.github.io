EmeraldOS 4.5 - Office 360 & Desktop Consistency Update

This build is based on EmeraldOS 4.4 and keeps the existing 40_ localStorage prefix for EmeraldOS 4.x compatibility.

New in 4.5:
- Adds Emerald 360, a consolidated productivity suite inspired by office-suite workflows.
- Adds Economy edition writing tools:
  - Writer Basic
  - Letter Pad
  - Document Reader
  - Text Composer
- Adds Home edition applications:
  - Home Center
  - Spreadsheet Basic
  - Presentation Basic
  - Personal Planner
  - Budget Lite
  - Household Checklist
  - Recipe Box
  - Reading List
  - Photo Album
  - Family Calendar
  - Bookmark Shelf
- Adds Business Center to consolidate workspace/business tools.
- Consolidates similar-purpose apps into suites so the desktop app folders stay cleaner.
- Office Apps is now visible starting in Economy so basic writing tools are available to the lowest edition.
- Adds Desktop Consistency tools for repairing app folders, cleaning redundant pins, and re-rendering the desktop/start menu.
- Adds terminal shortcuts:
  - office
  - 360
  - emerald360
  - writer
  - home.center
  - desktop.consistency
  - desktop.repair45

Edition behavior:
- Default edition remains Virtue unless changed by BIOS/localStorage.
- Developer edition remains staff-gated by Emerald Games mod/admin verification.
- Executive edition remains admin-gated by Emerald Games admin verification.
- Locked apps stay hidden.

Important:
Keep your existing firebase.js in this same folder. cloudstorage.js and login/register files import firebase.js locally.
