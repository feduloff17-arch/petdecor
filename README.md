# PetDecor Studio

Static website for PetDecor Studio: handmade decor, product gallery, workshop page, local admin helper, and contact form endpoint.

## Structure

- `index.html` - home page
- `gallery.html` - full product gallery
- `workshop.html` - workshop/about page
- `admin.html` - local product-card helper
- `data.json` / `data.js` - product catalog
- `script.js` - gallery, filters, language switcher, modals, contact form
- `styles.css` - site styles
- `assets/` - images and videos
- `functions/api/contact.js` - contact form endpoint for Telegram/Formspree

## Local Preview

Open `index.html` in a browser, or run a small static server from this folder:

```bash
python -m http.server 8124
```

Then open:

```text
http://localhost:8124/index.html
```

## Deploy Notes

The site is static. The contact endpoint expects environment variables when deployed:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `FORMSPREE_ENDPOINT`

