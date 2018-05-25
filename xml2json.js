#!/usr/bin/node

var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;

var json = '';
var xml;
var singletons = [];

var args = process.argv.slice(2);

// read singletons file
fs.readFile('./singletons/singletons-172.json', 'utf8', function(err, data) {
	if (err) {
		console.error('Error reading singletons.json\n' + err);
		return -1;
	} else {
		singletons = JSON.parse(data);
		xml2json();
	}
});


function xml2json() {
	// read input (XML file)
	fs.readFile(args[0], 'utf8', function(err, data) {
		if (err) {
			console.error('Invalid input file\n' + err);
			return -1;
		}
		try {
			var parser = new DOMParser();
			xml = parser.parseFromString(data, 'text/xml');
		} catch (err) {
			console.error('Invalid XML input\n' + err);
			return -1;
		}
		var root = getFirstElementNode(xml.childNodes);
		if (root == null) {
			console.error('No element node at root level of XML file');
			return -1;
		}
		json = '{"' + root.nodeName + '":';
		parse(root, root.nodeName+'/');
		json += '}';
		// beautify JSON
		json = JSON.stringify(JSON.parse(json), null, '\t');
		fs.writeFile(args[1], json, function(err) {
			if (err) {
				console.error('Error writing to ouput file\n' + err);
				return -1;
			}
		});
	});
	return 0;
}


function getFirstElementNode(nodes) {
	for (var i=0 ; i<nodes.length ; i++) {
		if (nodes[i].nodeType == 1) {
			return nodes[i];
		}
	}
	return null;
}


function getTextContent(node) {
	var text = null;
	for (var i=0 ; i<node.childNodes.length ; i++) {
		var ch = node.childNodes[i];
		if (ch.nodeType == 1) {
			return null;
		}
		if (ch.nodeType == 3) {
			text = ch.textContent;
		}
	}
	return text;
}


function getElementChildNodes(node) {
	var children = [];
	for (var i=0 ; i<node.childNodes.length ; i++) {
		var ch = node.childNodes[i];
		if (ch.nodeType == 1) {
			children.push(ch);
		}
	}
	return children;
}


function parse(node, xpath) {
	// opening object
	json += '{';

	var hasAttributes = false;

	// attributes
	if (node.attributes.length > 0) {
		hasAttributes = true;
		json += '"$":{';
		for (var i=0; i<node.attributes.length ; i++) {
			var attr = node.attributes[i];
			json += '"' + attr.name + '":"' + attr.value + '"';
			if (i < node.attributes.length-1) {
				json += ',';
			}
		}
		json += '}';
	}

	// value
	var textContent = getTextContent(node);
	if (textContent != null) {
		if (hasAttributes) {
			json += ',';
		}
		json += '"_":"' + node.textContent
			.replace(/\n/g, '\\n')
			.replace(/\t/g, '\\t')
			.replace(/"/g, '\\"') + '"';
	} else { // children
		var processed = [];
		var numberProcessed = 0;
		var child;
		var children = getElementChildNodes(node);
		if (hasAttributes && children.length > 0) {
			json += ',';
		}
		for(var i=0; i<children.length; i++) {
			child = children[i];
			if (processed.includes(child.nodeName) || child.nodeType != 1) {
				continue;
			}
			processed.push(child.nodeName);
			var newXpath = xpath + child.nodeName + '/';
			if (singletons.includes(newXpath)) {
				json += '"' + child.nodeName + '":';
				parse(child, newXpath);
				numberProcessed++;
			} else {
				json += '"' + child.nodeName + '":[';
				parse(child, newXpath);
				numberProcessed++;
				var child2;
				for (var j=i+1; j<children.length; j++) {
					child2 = children[j];
					if (child2.nodeName === child.nodeName) {
						json += ',';
						parse(child2, newXpath);
						numberProcessed++;
					}
				}
				json += ']';
			}
			if (numberProcessed < children.length) {
				json += ',';
			}
		}
	}

	// closing object
	json += '}';
}
