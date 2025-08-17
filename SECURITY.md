# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in CodeCircle, please report it by:

1. **DO NOT** open a public issue
2. Email the maintainer directly (check package.json for contact info)
3. Include detailed information about the vulnerability
4. Allow 48 hours for initial response

## Security Best Practices

### For Contributors
- Never commit credentials, API keys, or sensitive data
- Use environment variables for all secrets
- Run `npm audit` before submitting PRs
- Follow secure coding practices

### For Deployment
- Use HTTPS in production
- Set strong JWT secrets (64+ character random strings)
- Enable rate limiting
- Keep dependencies updated
- Use secure database connections
- Implement proper input validation

### Environment Variables
Always use `.env` files for sensitive data:

```env
# ✅ Good - Use environment variables
JWT_SECRET=your-secret-here
MONGODB_URI=mongodb+srv://...

# ❌ Bad - Never hardcode in source
const secret = "hardcoded-secret";
```

## Vulnerability Response

We take security seriously and will:
- Acknowledge receipt within 48 hours
- Provide a fix timeline within 7 days
- Credit reporters (unless they prefer to remain anonymous)
- Publish security advisories for significant issues

## Dependencies

This project uses automated dependency scanning. Security updates are applied promptly when available.
