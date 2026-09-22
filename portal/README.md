# PRXDIGY Staff Portal

The portal is a static frontend with Supabase authentication and row-level security. GitHub Pages serves the interface; private staff accounts and menu content stay in Supabase.

## Setup

1. Create a Supabase project and connect its GitHub integration to this repository with the working directory set to `.`.
2. Merge the portal pull request. Supabase deploys the migration in `supabase/migrations/` and applies the authentication configuration in `supabase/config.toml`.
3. Run the separately delivered private menu seed in the SQL editor. Do not commit that file to this public repository.
4. Open the project's **Connect** dialog and put the Project URL and public publishable key in `config.js`.
5. Visit `/portal/`, create the owner account, and confirm its email.
6. On the pending screen, enter the separately delivered one-time owner setup code.
7. The owner can then approve or reject new staff registrations from Team Access.

If automatic deployment is not enabled in the Supabase GitHub integration, run `supabase-schema.sql` once in the SQL editor as a fallback.

Unapproved accounts cannot read menus or operational notes. Prices are never embedded in the public site files.
