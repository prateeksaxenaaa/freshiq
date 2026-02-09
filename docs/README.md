# FreshIQ Documentation

Welcome to the FreshIQ documentation! This folder contains comprehensive documentation for the project.

## 📋 Table of Contents

### Project Overview
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current project status, what's working, what's been tested

### Database & Architecture
- **[DATABASE_SCHEMA.md](./database_schema.md)** - Complete database schema with table definitions
- **[DATABASE_RELATIONSHIPS.md](./DATABASE_RELATIONSHIPS.md)** - How recipes connect to cookbooks (junction table pattern)

### Implementation Guides
- **[AI_INTEGRATION_PLAN.md](./AI_INTEGRATION_PLAN.md)** - 3-phase plan for AI video analysis (upcoming feature)
- **[SUPABASE_SETUP_GUIDE.md](./supabase_setup_guide.md)** - How to set up Supabase for this project

### Features & Flows
- **[AUTH_FLOW.md](./auth_flow.md)** - Authentication and user onboarding flow
- **[INVENTORY_LOGIC.md](./inventory_logic.md)** - Inventory management design (not yet implemented)

### Historical Documents
- **[implementation_plan.md](./implementation_plan.md)** - Original implementation plan
- **[walkthrough.md](./walkthrough.md)** - Feature walkthroughs and demos

---

## 🚀 Quick Links

**Getting Started:**
1. Read [PROJECT_STATUS.md](./PROJECT_STATUS.md) to understand what's built
2. Review [DATABASE_SCHEMA.md](./database_schema.md) for data structure
3. Check [SUPABASE_SETUP_GUIDE.md](./supabase_setup_guide.md) for backend setup

**Understanding the Codebase:**
1. [AUTH_FLOW.md](./auth_flow.md) - How auth works
2. [DATABASE_RELATIONSHIPS.md](./DATABASE_RELATIONSHIPS.md) - Recipe-cookbook connections

**Next Phase:**
1. [AI_INTEGRATION_PLAN.md](./AI_INTEGRATION_PLAN.md) - Upcoming AI video analysis implementation

---

## 📊 Current Status

✅ **Completed & Tested:**
- Google OAuth authentication
- Recipe CRUD operations
- Cookbook management
- Recipe-cookbook associations
- Enhanced recipe cards with metadata
- Uncategorized recipes handling

🚧 **In Progress:**
- AI video analysis (planning phase)

❌ **Not Yet Started:**
- Inventory management
- Meal planning
- Shopping list sync
- Image upload

---

## 🛠️ Tech Stack

- **Frontend:** Expo (React Native)
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **State Management:** React Query + Context API
- **Navigation:** Expo Router (file-based)
- **AI (Planned):** Gemini AI, Supabase Edge Functions

---

## 📝 Contributing

When adding new features:
1. Update [PROJECT_STATUS.md](./PROJECT_STATUS.md) with testing status
2. Document new database tables in [DATABASE_SCHEMA.md](./database_schema.md)
3. Create implementation plans before major features
4. Keep walkthroughs updated with screenshots

---

**Last Updated:** February 8, 2026
