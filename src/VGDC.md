# Authentication Handling Guidelines

## Core Principles
1. **No Popup Prompts**
   - Never trigger GUI authentication popups
   - Avoid operations requiring interactive auth
   - Use proper service/system permissions
   - Respect existing auth contexts

2. **Permission Management**
   - Use systemd service permissions
   - Leverage existing sudo rules
   - Operate within user context
   - Follow principle of least privilege

3. **Best Practices**
   - Configure services with correct user/group
   - Use systemd for privilege management
   - Maintain security without prompts
   - Preserve user experience

## Implementation
1. **Service Setup**
   ```
   [Service]
   User=jon
   Group=jon
   ```

2. **File Operations**
   - Work within user directories
   - Use proper file permissions
   - Avoid root operations in user space
   - Leverage service contexts

3. **System Integration**
   - Configure during installation
   - Use sudoers.d for permissions
   - Maintain security boundaries
   - Preserve seamless operation 