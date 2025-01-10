# Data Normalization Plan

This document outlines the process for normalizing findings data from various sources (code-llm, dast-manual, sast-dependency) into a consistent format for storage in MongoDB. The goal is to facilitate comprehensive analysis and scoring using the OWASP Risk Rating Methodology.

## Required Fields

Each finding should be normalized to include the following fields:

- `finding_id`: A unique identifier for the finding.
- `source`: The origin of the finding (e.g., "skipfish", "manual", "sast").
- `title`: A brief title describing the finding.
- `description`: A detailed description of the finding.
- `severity`: The severity level of the finding (e.g., "low", "medium", "high").
- `recommendations`: Suggested actions to remediate the finding.
- `location`: An object containing:
  - `file`: The file where the issue was found.
  - `line`: The line number of the issue.
- `category`: General category of the finding (e.g., Injection, Authentication).
- `tool`: Tool or method used to discover the finding.
- `references`: List of references or links for more information.
- `timestamp`: Timestamp of when the finding was recorded.
- `additional_data`: An object for any extra fields specific to the source.

## Normalization Method

1. **Data Extraction**: Extract raw data from each source. For example, parse HTML reports from Skipfish, JSON outputs from SAST tools, and manual findings from spreadsheets or documents.

2. **Field Mapping**: Map the extracted data to the required fields. Use scripts to automate this process, ensuring consistency across different sources.

3. **Data Transformation**: Convert data types as needed (e.g., strings to integers for line numbers). Ensure all fields are in a format suitable for MongoDB storage.

4. **Validation**: Validate the normalized data to ensure all required fields are present and correctly formatted. Implement checks for missing or malformed data.

5. **Insertion into MongoDB**: Insert the normalized data into a MongoDB collection. Use a script to automate this process, ensuring data integrity and consistency.

## Context and Considerations

- **Application Context**: Consider the specific architecture and use cases of `@codebase[app]`. Ensure that the normalization process captures all relevant details for accurate risk assessment.

- **Business Context**: Align the normalization process with Binti's business goals and risk tolerance. Ensure that the data supports meaningful analysis and decision-making.

- **Scalability**: Design the normalization process to handle large volumes of data efficiently. Consider using batch processing or parallelization for performance optimization.

- **Security**: Ensure that the normalization process does not introduce security vulnerabilities. Implement access controls and data encryption as needed.

## Risk Scoring Integration

The normalized findings data serves as input to our OWASP Risk Rating process:

1. **Data Fields Used for Scoring**
   - `severity`: Base severity level
   - `description`: Used to identify impact areas and context
   - `tool_name`: Influences ease of discovery assessment
   - `proof_of_concept`: Affects ease of exploit rating
   - `compliance_related`: Impacts business risk assessment
   - `location`: Used for Rails-specific categorization

2. **Scoring Enhancements**
   - Each finding is enriched with:
     - OWASP risk factors (likelihood and impact)
     - Rails security categorization
     - Prevention and detection metadata
     - Risk score and adjusted severity

3. **Output Format**
   ```json
   {
     "title": "Original finding title",
     "severity": "CRITICAL",
     "description": "Original description",
     "owasp_risk_factors": {
       "likelihood": {
         "score": 7.5,
         "factors": ["High skill level required", "..."]
       },
       "impact": {
         "score": 8.0,
         "factors": ["Critical data exposure", "..."]
       },
       "overall_score": 6.0
     },
     "prevention": ["Input validation", "..."],
     "detection": ["Log monitoring", "..."]
   }
   ```

4. **Processing Pipeline**
   ```
   Raw Tool Output -> Normalization -> Risk Scoring -> Categorization -> Reports
   ```

---

### Scoring Plan

Now, let's outline a detailed plan for scoring the findings using the OWASP Risk Rating Methodology:

1. **Define Risk Factors**: Use OWASP's factors and tailor them to `@codebase[app]` and Binti's context.
   - **Threat Agent Factors**: Skill level, motive, opportunity, size.
   - **Vulnerability Factors**: Ease of discovery, ease of exploit, awareness, intrusion detection.
   - **Technical Impact Factors**: Loss of confidentiality, integrity, availability, accountability.
   - **Business Impact Factors**: Financial damage, reputation damage, non-compliance, privacy violation.

2. **Weighting and Customization**: Adjust the weights of each factor based on the specific context of `@codebase[app]` and Binti's business priorities. For example, if data privacy is a top concern, increase the weight of the "Loss of Confidentiality" factor.

3. **Scoring Algorithm**: Implement a function that calculates a risk score for each finding based on these factors. Use a formula that combines the weighted risk factors to produce a final risk score.

4. **Integration with MongoDB**: Update each finding in MongoDB with the calculated risk score. Use a script to automate this process, ensuring data integrity and consistency.

5. **Validation and Iteration**: Review the calculated scores to ensure they align with expert judgment and organizational priorities. Adjust weights and factors as needed.

6. **Documentation and Reporting**: Maintain clear documentation of the scoring methodology, including the rationale for weightings and any customizations made. Create a dashboard to visualize the risk scores and trends over time.
