# Fallback Assets

The generated assets in `generated/` are synthetic local presentation assets for the seeded fallback transaction.

They are for fallback walkthrough use only, not proof that the live Google workbook, form, calendar, or Gmail draft surfaces were exercised from this machine.

They are intentionally safe:

- sample data only
- no client docs
- no Gmail send
- no live Google auth required to show the pack

Generate or refresh them with:

```powershell
cd C:\VFC\tammy-roundtable-demo
npm run render:fallback
```
