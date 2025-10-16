# Security Checklist - Before Production Deployment

## ⚠️ CRITICAL - Must Complete Before Production

### 1. Credentials & Secrets
- [ ] Change MySQL root password from default
- [ ] Generate strong JWT secret: `openssl rand -base64 32`
- [ ] Update all passwords in `.env` file
- [ ] Change default admin password in web UI
- [ ] Review and update database credentials
- [ ] Generate unique secrets for each environment

### 2. Configuration Files
- [ ] Verify `.env` is in `.gitignore`
- [ ] Copy `env.example` to `.env` with production values
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Configure proper `NODE_ENV=production`
- [ ] Remove or secure `ADMIN_CREDENTIALS.txt`

### 3. Database Security
- [ ] Use strong MySQL password (minimum 16 characters)
- [ ] Restrict MySQL network access (bind to specific IP)
- [ ] Enable MySQL audit logging
- [ ] Set up automated backups
- [ ] Test backup restoration procedure
- [ ] Review user permissions in database

### 4. Network Security
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Restrict port access (only 80/443 public)
- [ ] Use internal Docker network for service communication
- [ ] Configure rate limiting in Nginx
- [ ] Set up fail2ban or similar

### 5. Docker Security
- [ ] Review `docker-compose.yml` exposed ports
- [ ] Remove unnecessary port mappings
- [ ] Use specific image versions (not :latest)
- [ ] Run containers as non-root user
- [ ] Scan images for vulnerabilities
- [ ] Limit container resources (CPU/Memory)

### 6. Application Security
- [ ] Update all npm dependencies
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Enable CSRF protection
- [ ] Configure secure session settings
- [ ] Implement rate limiting on API endpoints
- [ ] Set up proper CORS configuration
- [ ] Enable security headers in Nginx

### 7. Access Control
- [ ] Implement IP whitelisting for admin panel
- [ ] Set up VPN access if needed
- [ ] Configure multi-factor authentication (if available)
- [ ] Review and test role permissions
- [ ] Audit user access logs
- [ ] Set up login attempt monitoring

### 8. Monitoring & Logging
- [ ] Configure centralized logging
- [ ] Set up error alerting
- [ ] Monitor failed login attempts
- [ ] Track database query performance
- [ ] Set up uptime monitoring
- [ ] Configure backup monitoring

### 9. SSL/TLS Configuration
- [ ] Obtain SSL certificate (Let's Encrypt recommended)
- [ ] Configure HTTPS in Nginx
- [ ] Force HTTPS redirect
- [ ] Set up HSTS header
- [ ] Configure strong SSL ciphers
- [ ] Test SSL configuration (SSLLabs)

### 10. Backup & Recovery
- [ ] Automated daily database backups
- [ ] Test backup restoration
- [ ] Store backups in secure location
- [ ] Document recovery procedures
- [ ] Set up backup monitoring/alerts
- [ ] Keep multiple backup versions

## 🔍 Security Testing

### Before Deployment
```bash
# Check for hardcoded secrets
grep -r "password\|secret\|key" --include="*.js" --include="*.ts" .

# Scan Docker images
docker scan radius_backend
docker scan radius_frontend

# Test API security
# Use tools like OWASP ZAP or Burp Suite
```

### Post Deployment
- [ ] Perform penetration testing
- [ ] Scan for open ports: `nmap <server-ip>`
- [ ] Test SQL injection protection
- [ ] Test XSS protection
- [ ] Verify authentication bypass protection
- [ ] Test rate limiting

## 📝 Production Environment Variables

Required variables in `.env`:
```bash
# NEVER use these example values in production!
MYSQL_ROOT_PASSWORD=<CHANGE_ME>
DB_PASSWORD=<CHANGE_ME>
JWT_SECRET=<GENERATE_WITH_openssl_rand>
CORS_ORIGIN=https://your-domain.com
```

## 🚨 Incident Response

### If Credentials Compromised
1. Immediately rotate all passwords
2. Revoke active JWT tokens
3. Review access logs for unauthorized access
4. Investigate potential data breach
5. Update all team members
6. Document incident

### Emergency Contacts
- DevOps Team: [CONTACT]
- Security Team: [CONTACT]
- Database Admin: [CONTACT]

## 📋 Compliance

- [ ] GDPR compliance (if applicable)
- [ ] Data retention policies
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] User consent mechanisms

## 🔄 Regular Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check backup status
- [ ] Monitor disk space

### Monthly
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Security patches review

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review user permissions
- [ ] Update documentation

---

**Last Updated**: 2025-10-16  
**Next Review**: [SET_DATE]

⚠️ **IMPORTANT**: Complete this checklist before deploying to production. Keep a signed copy of completed checklist for audit purposes.

