#!/bin/bash

# Apply Phase 1 Migration Script
# This script applies the unified analytics foundation migration

echo "=========================================="
echo "Phase 1: Unified Analytics Foundation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed.${NC}"
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if user is logged in
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Supabase.${NC}"
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

# List available projects
echo "Available Supabase projects:"
supabase projects list
echo ""

# Ask for project ref
read -p "Enter your Supabase project reference (e.g., abcdefghijklmnopqrst): " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Project reference is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔗 Linking to project: $PROJECT_REF${NC}"
supabase link --project-ref "$PROJECT_REF"

echo ""
echo -e "${YELLOW}📊 Applying Phase 1 migration...${NC}"
echo ""

# Apply the migration
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo ""
    echo "New tables created:"
    echo "  ✅ case_performance_metrics"
    echo "  ✅ learning_events"
    echo "  ✅ cross_case_recommendations"
    echo ""
    echo "Extended tables:"
    echo "  ✅ simulation_sessions (added case_type)"
    echo "  ✅ learning_analytics (added case_type)"
    echo "  ✅ user_skill_profiles (added cross_case_metrics)"
    echo ""
    echo "Functions created:"
    echo "  ✅ get_user_cross_case_performance()"
    echo "  ✅ get_user_weakest_case_type()"
    echo "  ✅ calculate_learning_velocity()"
    echo ""
    
    # Ask about regenerating types
    read -p "Would you like to regenerate TypeScript types now? (y/n): " REGENERATE
    
    if [ "$REGENERATE" = "y" ] || [ "$REGENERATE" = "Y" ]; then
        echo ""
        echo -e "${YELLOW}📝 Regenerating TypeScript types...${NC}"
        supabase gen types typescript --project-ref "$PROJECT_REF" > src/integrations/supabase/types.ts
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ TypeScript types regenerated successfully!${NC}"
        else
            echo -e "${RED}❌ Failed to regenerate types${NC}"
            echo "You can do it manually with:"
            echo "  supabase gen types typescript --project-ref $PROJECT_REF > src/integrations/supabase/types.ts"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Phase 1 is complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Build the project: npm run build"
    echo "  2. Start Phase 2: Clinical Cases adaptive features"
    echo "  3. Read the documentation: docs/PHASE_1_COMPLETION.md"
    echo ""
else
    echo ""
    echo -e "${RED}==========================================${NC}"
    echo -e "${RED}❌ Migration failed${NC}"
    echo -e "${RED}==========================================${NC}"
    echo ""
    echo "Please check the error messages above"
    echo ""
    exit 1
fi
