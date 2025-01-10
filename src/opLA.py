import json
import xmltodict

with open('../tools/burpsuite/burpsuite-session-http-history.xml', 'r') as f:
    xml_data = f.read()

json_data = json.dumps(xmltodict.parse(xml_data), indent=4)

with open('../findings/dast-manual/burpsuite-session-http-history.json', 'w') as f:
    f.write(json_data)
