# Rails Security Best Practices Guide

## Overview
This guide provides secure implementation patterns for common Rails security concerns, based on our assessment findings.

## 1. Authentication & Session Management

### Session Configuration
```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: '_app_session',
  secure: Rails.env.production?,
  httponly: true,
  same_site: :strict,
  expire_after: 12.hours
```

### Strong Password Requirements
```ruby
# app/models/user.rb
class User < ApplicationRecord
  has_secure_password
  
  validates :password,
    length: { minimum: 12 },
    format: { 
      with: /\A(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: "must include uppercase, lowercase, number, and special character"
    }
end
```

## 2. CSRF Protection

### Application Controller
```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :verify_authenticity_token
  
  rescue_from ActionController::InvalidAuthenticityToken do |e|
    Rails.logger.warn "CSRF attempt blocked: #{request.path}"
    redirect_to root_path, alert: "Session expired. Please try again."
  end
end
```

## 3. Input Validation

### Safe Query Pattern
```ruby
# app/models/document.rb
class Document < ApplicationRecord
  scope :visible_to, ->(user) {
    joins(:permissions)
      .where(permissions: { user_id: user.id })
      .where("permissions.access_level >= ?", Permission::READ)
  }
  
  def self.search(query)
    sanitized = sanitize_sql_like(query)
    where("title ILIKE ?", "%#{sanitized}%")
  end
end
```

### Strong Parameters
```ruby
# app/controllers/documents_controller.rb
class DocumentsController < ApplicationController
  def create
    @document = Document.new(document_params)
    
    if @document.save
      redirect_to @document, notice: "Document created."
    else
      render :new
    end
  end
  
  private
  
  def document_params
    params.require(:document)
          .permit(:title, :content, permitted_user_ids: [])
  end
end
```

## 4. Access Control

### Policy Objects
```ruby
# app/policies/document_policy.rb
class DocumentPolicy
  attr_reader :user, :document
  
  def initialize(user, document)
    @user = user
    @document = document
  end
  
  def show?
    return true if user.admin?
    document.permissions.exists?(user: user, access_level: Permission::READ)
  end
  
  def update?
    return true if user.admin?
    document.permissions.exists?(user: user, access_level: Permission::WRITE)
  end
end
```

### Controller Integration
```ruby
# app/controllers/documents_controller.rb
class DocumentsController < ApplicationController
  before_action :authorize_document
  
  def show
    @document = Document.find(params[:id])
  end
  
  private
  
  def authorize_document
    unless DocumentPolicy.new(current_user, @document).show?
      redirect_to root_path, alert: "Access denied."
    end
  end
end
```

## 5. Security Headers

### Configuration
```ruby
# config/initializers/security_headers.rb
Rails.application.config.action_dispatch.default_headers = {
  'X-Frame-Options' => 'SAMEORIGIN',
  'X-XSS-Protection' => '1; mode=block',
  'X-Content-Type-Options' => 'nosniff',
  'X-Download-Options' => 'noopen',
  'X-Permitted-Cross-Domain-Policies' => 'none',
  'Referrer-Policy' => 'strict-origin-when-cross-origin',
  'Content-Security-Policy' => [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
}
```

## 6. Error Handling

### Custom Error Pages
```ruby
# app/controllers/errors_controller.rb
class ErrorsController < ApplicationController
  def not_found
    respond_to do |format|
      format.html { render status: 404 }
      format.json { render json: { error: 'Not found' }, status: 404 }
    end
  end
  
  def internal_server_error
    respond_to do |format|
      format.html { render status: 500 }
      format.json { render json: { error: 'Internal server error' }, status: 500 }
    end
  end
end
```

### Production Configuration
```ruby
# config/environments/production.rb
Rails.application.configure do
  config.consider_all_requests_local = false
  config.action_dispatch.show_exceptions = true
  config.exceptions_app = ->(env) { ErrorsController.action(:show).call(env) }
end
```

## 7. Secure File Uploads

### Model Configuration
```ruby
# app/models/attachment.rb
class Attachment < ApplicationRecord
  include ActiveStorage::Blob::Analyzable
  
  has_one_attached :file
  
  validates :file,
    content_type: %w[application/pdf image/jpeg image/png],
    size: { less_than: 10.megabytes }
    
  before_save :scan_for_viruses
  
  private
  
  def scan_for_viruses
    # Implement virus scanning
  end
end
```

### Controller Implementation
```ruby
# app/controllers/attachments_controller.rb
class AttachmentsController < ApplicationController
  def create
    @attachment = Attachment.new(attachment_params)
    
    if @attachment.save
      redirect_to @attachment, notice: "File uploaded successfully."
    else
      render :new
    end
  end
  
  private
  
  def attachment_params
    params.require(:attachment)
          .permit(:file)
          .merge(user: current_user)
  end
end
```

## 8. Secure API Design

### API Authentication
```ruby
# app/controllers/api/base_controller.rb
module Api
  class BaseController < ApplicationController
    before_action :authenticate_api_request
    
    private
    
    def authenticate_api_request
      authenticate_or_request_with_http_token do |token, options|
        ActiveSupport::SecurityUtils.secure_compare(
          token,
          Rails.application.credentials.api_token!
        )
      end
    end
  end
end
```

### Rate Limiting
```ruby
# config/initializers/rack_attack.rb
class Rack::Attack
  throttle('api/ip', limit: 300, period: 5.minutes) do |req|
    req.ip if req.path.start_with?('/api/')
  end
  
  throttle('login/ip', limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == '/login' && req.post?
  end
end
```

## 9. Secure Database Configuration

### Database Encryption
```ruby
# config/application.rb
config.active_record.encryption.primary_key = Rails.application.credentials.db_encryption_key!
config.active_record.encryption.deterministic_key = Rails.application.credentials.db_deterministic_key!
config.active_record.encryption.key_derivation_salt = Rails.application.credentials.db_key_derivation_salt!
```

### Model Encryption
```ruby
# app/models/user.rb
class User < ApplicationRecord
  encrypts :email, deterministic: true
  encrypts :phone_number, deterministic: true
  encrypts :address
end
```

## 10. Secure Development Workflow

### Brakeman Configuration
```yaml
# .brakeman.yml
:skip_files:
  - app/controllers/dev_controller.rb
:skip_checks:
  - SQL
:ignore_model_output: false
:ignore_http_parameters: false
:min_confidence: 2
```

### RuboCop Security
```yaml
# .rubocop.yml
require:
  - rubocop-rails
  - rubocop-performance

Rails/HttpStatus:
  Enabled: true
  EnforcedStyle: symbolic

Rails/TimeZone:
  Enabled: true
  EnforcedStyle: strict 