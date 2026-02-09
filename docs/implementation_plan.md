# Implementation Plan - Database Schema Design

## Goal Description
Design a scalable Postgres schema for FreshIQ within Supabase. The schema will handle multi-user households, fuzzy inventory tracking (loose units), and recipe management. It must ensure data integrity while allowing for the "no mandatory scan-out" philosophy via probability algorithms.

## Proposed Changes

### Database Design
#### [NEW] [database_schema.md](file:///database_schema.md)
I will create a comprehensive design document containing:
- **SQL DDL**: `CREATE TABLE` statements for all 14 requested entities.
- **Enums**: Custom types for `storage_type`, `unit_type`, `user_role`.
- **Logic Documentation**:
  - **Probability Algorithm**: How `confidence_score` decays over time and updates on "cook" actions.
  - **Inventory Deduction**: Strategy for matching recipe ingredients (strict vs. fuzzy) to inventory items.

### Key Logic Highlights
- **Inventory Items**: Will have a `confidence_score` (0.0-1.0) instead of just strict quantity.
- **Activity Log**: Critical for training the future prediction model.
- **Households**: Strict RLS policies will be drafted (conceptually) to ensure data isolation.

## Verification Plan
### Manual Verification
- Review the SQL against the "Core Rules" in the prompt (loose units, shared households, etc.).
- The user will manually run the SQL in Supabase SQL Editor (future step).
