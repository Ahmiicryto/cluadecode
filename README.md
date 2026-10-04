# Ahmad — Portfolio

Freelance portfolio for Shopify / e‑commerce, ads, SEO, web & AI tool development.
Pure HTML + CSS + JS — no build step. Open `index.html` or deploy the folder to
GitHub Pages / Netlify / Vercel.

## Add a project (auto-fetch)

Edit **`projects.js`** and add one line per project:

```js
{ url: "https://client-store.com", category: "shopify", tags: ["Custom Theme"], result: "+40% CVR" },
```

The site automatically pulls in:
- **Screenshot** of the live website (via thum.io), falling back to its `og:image`
- **Title & description** from the site's meta tags (via Microlink, cached 7 days in the browser)
- **Favicon** of the domain

Override anything by adding `title`, `desc` or `image` (e.g. `image: "assets/store.jpg"`).
Use your own images for clients whose stores are password-protected or behind NDA.

Categories: `shopify`, `ads`, `web`, `seo`, `ai` — empty categories are hidden from the filter bar.

## Your details
Set name, email, WhatsApp number and social links in the `PROFILE` block at the bottom of `projects.js`.
Hero stats (120+ projects etc.) are in `index.html` → `data-count` attributes.
