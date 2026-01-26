# Configure Gel Auth Extension
# Run this with: gel query -f dbschema/auth-config.edgeql

# Configure auth basics
CONFIGURE CURRENT BRANCH SET
  ext::auth::AuthConfig::auth_signing_key := 'REPLACE_WITH_SECURE_KEY_IN_PRODUCTION';

CONFIGURE CURRENT BRANCH SET
  ext::auth::AuthConfig::token_time_to_live := <duration>'336 hours';

# Allow redirects from frontend
CONFIGURE CURRENT BRANCH SET
  ext::auth::AuthConfig::allowed_redirect_urls := {
    'http://localhost:3000',
    'http://localhost:3000/auth',
    'http://localhost:3001',
    'http://localhost:3001/auth'
  };

# Configure app branding (optional)
CONFIGURE CURRENT BRANCH SET
  ext::auth::AuthConfig::app_name := 'Publication Intelligence';

# Enable Email/Password provider
CONFIGURE CURRENT BRANCH
INSERT ext::auth::EmailPasswordProviderConfig {
  require_verification := false,
};

# Configure local SMTP for development (using Mailpit or similar)
# Uncomment and configure when you have Mailpit running
# CONFIGURE CURRENT BRANCH INSERT cfg::SMTPProviderConfig {
#   name := 'local_mailpit',
#   sender := '"Publication Intelligence" <noreply@pubint.local>',
#   host := 'localhost',
#   port := <int32>1025,
#   security := 'STARTTLSOrPlainText',
#   validate_certs := false,
#   timeout_per_email := <duration>'60 seconds',
#   timeout_per_attempt := <duration>'15 seconds',
# };
