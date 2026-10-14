# Island Ledger — Budget & Savings Tracker

A TTD personal-budget learning prototype built with HTML, CSS, and vanilla JavaScript.

## Features
- Add income and expense entries with category and date.
- Show income, expenses, and net balance.
- Group expense totals by category.
- Create savings goals with target amounts and starting savings.
- Manually add savings to a goal and see its progress bar update.
- Delete transactions or goals; clear transactions with confirmation.
- Persist transactions and goals in this browser with `localStorage`.

## Run and test
Open `index.html` in a modern browser. Use fictional data. Add an income and an expense, create a goal, add savings, refresh the page, and verify the information remains. Test invalid or blank amounts too.

## GitHub Pages
Inspect **Settings → Pages** before changing anything. For this static app, a typical setup is branch `main`, folder `/ (root)`, with `index.html` at the repository root. Use the URL shown in Pages settings. If deployment fails, check the latest workflow under **Actions** first.

## Limitations and privacy
This is not a bank connection, secure accounting product, financial advice, or a regulated investment service. Browser local storage is not encrypted or synced and can be cleared. Savings contributions are manually entered; they do not automatically move money or reconcile with transactions. Do not enter sensitive information. Test all features before claiming they work in the deployed version.

## Roadmap
- [ ] Month/date filter.
- [ ] Edit transactions and goal details.
- [ ] CSV export/import with validation.
- [ ] Budget limits per category and monthly summaries.
- [ ] Unit tests for totals and input validation.
- [ ] Accessibility and browser compatibility checks.
