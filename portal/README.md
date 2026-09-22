# PRXDIGY Staff Portal

The portal is a static frontend with Supabase authentication and row-level security. GitHub Pages serves the interface; private staff accounts and menu content stay in Supabase.

## Setup

1. Create a Supabase project.
2. In Authentication settings, require email confirmation and add `https://prxdigystudio.com/portal/` as an allowed redirect URL.
3. Run `supabase-schema.sql` in the Supabase SQL editor.
4. Run the separately delivered private menu seed in the SQL editor. Do not commit that file to this public repository.
5. Open the project's **Connect** dialog and put the Project URL and public publishable key in `config.js`.
6. Visit `/portal/`, create the owner account, and confirm its email.
7. Run the one-time owner bootstrap statement shown at the bottom of `supabase-schema.sql`.
8. Sign in. The owner can approve or reject new staff registrations from Team Access.

Unapproved accounts cannot read menus or operational notes. Prices are never embedded in the public site files.
