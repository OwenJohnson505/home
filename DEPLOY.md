# Putting Nest online (so you can use it on your iPad & share with your partner)

The whole app is **one file: `index.html`**. Your data lives in the cloud (Supabase),
so once the page is online, every device that opens the same board link shares one live list.

You only need to host that single file. Pick whichever route is easiest for you.

---

## Route A — GitHub Pages (you already use this) ✅ recommended

1. Go to <https://github.com/new> and create a repo, e.g. **`nest`** (Public).
2. On the new repo page, click **“uploading an existing file”**.
3. Drag in **`index.html`** from this folder. Commit.
4. Go to **Settings → Pages**.
5. Under **Build and deployment → Source**, choose **Deploy from a branch**,
   pick branch **`main`** and folder **`/ (root)`**, then **Save**.
6. Wait ~1 minute. Your app is live at:
   **`https://<your-username>.github.io/nest/`**

Open that URL on your iPad, tap **🔗 Share / Sync**, and you’ll get a board link to
send to your partner. Done.

### (Optional) Command line instead of drag-and-drop
A local git repo is already initialized here. If you create the empty repo on GitHub first:
```bash
git remote add origin https://github.com/<your-username>/nest.git
git branch -M main
git push -u origin main
```
Then do steps 4–6 above to turn on Pages.

---

## Route B — Netlify Drop (fastest, no account needed to try)

1. Go to <https://app.netlify.com/drop>.
2. Drag **`index.html`** onto the page.
3. You instantly get a live `https://…netlify.app` URL. (Make a free account to keep it.)

---

## Notes
- The Supabase **publishable key** baked into the file is safe to be public — that’s what it’s for.
- Your list is gated by a private, hard-to-guess board id in the URL (the part after `#b=`).
  Anyone with that link can view/edit the list, so only share it with people you want editing.
- To move an existing list to a new device manually, you can still use **⬇️ Backup / ⬆️ Restore**.
