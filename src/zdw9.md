# Data Normalization Guidelines

This document provides step-by-step instructions on normalizing data from SAST and DAST tools using JSON and Python for better integration and analysis.

## SAST Data Normalization
1. Export the SAST tool findings in a compatible format (e.g., JSON, XML, CSV).
2. Parse the exported data using Python libraries like `json`, `xml`, or `csv`, depending on the format.
3. Extract relevant fields such as vulnerability type, file path, line number, and severity.
4. Transform the extracted data into a consistent JSON structure, using a schema like:
   ```json
   {
     "tool": "SAST_TOOL_NAME",
     "vulnerability_type": "VULNERABILITY_TYPE",
     "file_path": "FILE_PATH",
     "line_number": LINE_NUMBER,
     "severity": "SEVERITY"
   }
   ```
5. Save the normalized data in a JSON file for further integration.

## DAST Data Normalization
1. Export the DAST tool findings in a compatible format (e.g., JSON, XML, CSV).
2. Parse the exported data using Python libraries like `json`, `xml`, or `csv`, depending on the format.
3. Extract relevant fields such as vulnerability type, URL, HTTP method, and severity.
4. Transform the extracted data into a consistent JSON structure, using a schema like:
   ```json
   {
     "tool": "DAST_TOOL_NAME",
     "vulnerability_type": "VULNERABILITY_TYPE",
     "url": "URL",
     "http_method": "HTTP_METHOD",
     "severity": "SEVERITY"
   }
   ```
5. Save the normalized data in a JSON file for further integration.

## Data Integration
1. Load the normalized SAST and DAST data from their respective JSON files using Python.
2. Merge the loaded data into a single list or dictionary, maintaining the consistent structure.
3. Integrate the merged data with findings from manual testing, aligning them based on the security assessment categories.
4. Perform any necessary data transformations or aggregations to facilitate analysis and reporting.
5. Save the integrated data in a JSON file or database for further use in the security assessment process.

By following these guidelines, you can normalize and integrate data from SAST and DAST tools effectively, enabling better analysis and insights in combination with manual testing findings. 