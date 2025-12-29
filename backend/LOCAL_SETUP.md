# Local Development Setup

## Quick Start

1. **Make sure `.env.local` exists** (already created with Supabase config)

2. **Run the application:**
   ```bash
   cd backend
   ./run.sh
   ```

   Or manually:
   ```bash
   cd backend
   source .env.local
   ./mvnw spring-boot:run
   ```

## Configuration

- **Database**: Uses Supabase (`db.ltveafhtsxylygslitwz.supabase.co`)
- **Port**: 8080 (default)
- **Environment**: Development mode with SQL logging enabled

## Files

- `.env.local` - Local development environment variables (uses Supabase)
- `.env` - Production environment variables (for AWS deployment)
- `run.sh` - Script that automatically loads `.env.local` for local runs

## Troubleshooting

### If you get "UnknownHostException":
- The hostname resolves to IPv6 only
- Java should handle this with `JAVA_TOOL_OPTIONS` in `.env.local`
- If still failing, check your network/DNS settings

### If database connection fails:
- Verify Supabase credentials in `.env.local`
- Check if Supabase project is active
- Test connection: `psql "postgresql://postgres:GuhanAein%40123@db.ltveafhtsxylygslitwz.supabase.co:5432/postgres" -c "SELECT 1;"`

## Switching Between Local and Production

- **Local**: Uses `.env.local` (automatically loaded by `run.sh`)
- **Production**: Uses `.env` (for AWS deployment)
