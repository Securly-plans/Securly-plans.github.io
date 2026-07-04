# EmeraldOS 5.7

This ZIP contains a starter build of EmeraldOS 5.7 with Win95-style app logos and separate app modules.

## Included apps

- Emerald Mail
- Emerald Office
- Emerald Docs
- Emerald Sheets
- Emerald Slides
- App Editor
- User Appstore
- Virtue Creator
- System Customizer

## Main files

- `OS.html` - main EmeraldOS desktop
- `os.css` - Win95-style system styling
- `os.js` - window manager, desktop, start menu, taskbar, notifications
- `registry.js` - app registry and app metadata
- `permissions.js` - starter permissions layer
- `cloudstorage.js` - localStorage drive adapter, ready to replace with Firestore
- `emerald-office.js` - Office, Docs, Sheets, and Slides
- `emerald-mail.js` - Mail app
- `developer.js` - App Editor
- `appstore.js` - User Appstore
- `startup.js` - startup apps, Virtue Creator, System Customizer
- `applications.js` - compatibility export for older EmeraldOS structure
- `assets/logos/` - Win95-style PNG app logos

## How to use

Open `OS.html` directly in a browser, or upload the full folder to GitHub Pages.

Because these files use JavaScript modules, some browsers may block module imports from local `file://` paths. If that happens, run it through a local server or GitHub Pages.

Example local server:

```bash
python -m http.server 8000
```

Then open:

```txt
http://localhost:8000/OS.html
```

## Notes

This is a frontend starter build. Data is stored in `localStorage` by default. The `cloudstorage.js` file is intentionally structured so it can be swapped with your Firestore-backed `emeraldOSUsers/{username}/drive` system.
