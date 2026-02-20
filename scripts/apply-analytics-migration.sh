#!/bin/bash

# Database Migration Script for Adaptive Simulation Analytics
# This script applies the analytics migration to your Supabase project

echo "=========================================="
echo "Adaptive Simulation Analytics Migration"
echo "=========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if user is logged in
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase."
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# List available projects
echo "Available Supabase projects:"
supabase projects list
echo ""

# Ask for project ref
read -p "Enter your Supabase project reference (e.g., abcdefghijklmnopqrst): " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project reference is required"
    exit 1
fi

echo ""
echo "🔗 Linking to project: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "📊 Applying migration..."
echo ""

# Apply the migration
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Migration applied successfully!"
    echo "=========================================="
    echo ""
    echo "New tables created:"
    echo "  - simulation_sessions"
    echo "  - user_skill_profiles"
    echo "  - learning_analytics"
    echo "  - constraint_violations"
    echo "  - instructor_assignments"
    echo "  - whatif_scenarios"
    echo ""
    echo "Next steps:"
    echo "  1. Regenerate TypeScript types:"
    echo "     supabase gen types typescript --project-ref $PROJECT_REF > src/integrations/supabase/types.ts"
    echo ""
    echo "  2. Restart your development server"
    echo ""
    echo "  3. Test the integration:"
    echo "     - Start a simulation"
    echo "     - Make decisions"
    echo "     - Check that analytics are being saved"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ Migration failed"
    echo "=========================================="
    echo ""
    echo "Please check the error messages above"
    echo ""
    exit 1
fi
