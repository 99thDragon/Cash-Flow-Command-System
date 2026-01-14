# Cash Flow Command System

## Overview
A professional cash flow management system for small businesses and solo founders. Track AR/AP, forecast cash flow, and make informed financial decisions.

## Current Status: Phase 5 Complete, Phase 6 In Progress

### What's Built

**Original Version (Vanilla JS) - Root folder**
- `index.html` - Main application
- `style.css` - Styling with dark mode
- `app.js` - Core application logic
- `sample_data.json` / `sample_data_small.json` - Test data
- `sample_transactions.csv` - CSV import example

**Pro Version (Next.js) - `cash-flow-pro/`**
- Next.js app with TypeScript
- Modern React architecture
- In development for Phase 6

### Completed Features (Phase 1-5)
- Real-time cash position tracking
- 12-week cash flow forecast
- Accounts Receivable management with aging
- Accounts Payable tracking with priority
- Recurring transaction templates
- CSV import for bank transactions
- Decision simulation tool ("Can we afford X?")
- Weekly Review Wizard
- Dark mode + Chart.js visualizations

### Phase 6 (In Progress)
- Backend infrastructure (Next.js + PostgreSQL)
- Multi-user authentication
- Bank integration (Plaid)
- Cloud deployment

---

## Notes for Future Sessions

### Known Issues / TODO
- [ ] Complete Next.js migration (cash-flow-pro)
- [ ] Set up PostgreSQL database
- [ ] Implement Plaid bank integration
- [ ] Add user authentication

### Last Session Context
<!-- Update this section each session -->
- Date: 2026-01-13
- Status: Project review
- Next: User to specify what to work on

---

## Quick Reference

**To Run (Original):**
Just open `index.html` in browser - no server needed!

**To Run (Pro):**
```bash
cd cash-flow-pro
npm install
npm run dev
```

**Tech Stack:**
- Original: HTML5, CSS3, Vanilla JS, Chart.js, localStorage
- Pro: Next.js, TypeScript, PostgreSQL (planned), Plaid (planned)
