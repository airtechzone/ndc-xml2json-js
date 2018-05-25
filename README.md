# xml2json (Node.js)

This Node.js tool converts NDC XML messages into JSON equivalents.

It uses the "singletons-\*.json" supporting files in order to ouput valid NDC messages (elements with maxOccurs > 1 should always be in arrays, whatever the number of actual occurences). This file is stored in the `singletons` folder: the correct NDC version should be chosen for the input message version.

**Assumption**: input XML is well-formed and the first element is the root.

Usage:
```
node xml2json.js inputFile.xml outputFile.json
```
