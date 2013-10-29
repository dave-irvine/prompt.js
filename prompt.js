/* jshint node: true */
"use strict";

var charm = require("charm")(process),
	colors = require("colors"),
	EventEmitter = require("events").EventEmitter,
	Prompt,
	promptInstance = null,
	stream = require("stream"),
	util = require("util");

colors.setTheme({
	"warn": "yellow",
	"debug": "blue",
	"error": "red"
});

(function () {
	var prompt;

	Prompt = function Prompt() {
		var stdinBuffer = new Buffer("", "utf8"),
			writeableStream;

		prompt = this;

		EventEmitter.call(prompt);

		writeableStream = new stream.Writable();
		writeableStream._write = function (chunk, encoding, callback) {
			if (chunk.readInt8(0) !== 13) {
				stdinBuffer = Buffer.concat([stdinBuffer, chunk]);
			} else {
				prompt.emit("line", stdinBuffer.toString());
				stdinBuffer = new Buffer("", "utf8");
			}
			callback();
		};

		process.stdin.pipe(writeableStream);

		prompt.sigint = false;
		prompt.charm = charm;

		charm.removeAllListeners("^C");
		charm.on("^C", function () {
			prompt.sigint = true;
			charm.write("\n");
			process.exit();
		});
	};

	util.inherits(Prompt, EventEmitter);

	Prompt.prototype.choice = function (question, choices, callback) {
		(function asker() {
			charm.write(question + "\n");
			choices.forEach(function (choice, index) {
				charm.write("  " + index + ") " + choice + "\n");
			});

			prompt.once("line", function (input) {
				var index = input.trim() * 1;
				if (prompt.sigint) {
					return;
				}

				if (!/^[0-9]+$/.test(input) || isNaN(index) || index < 0 || index >= choices.length) {
					charm.write("\nTry again:".error);
					charm.write("\n");
					asker();
				} else {
					callback(null, {
						"index": index,
						"value": choices[index]
					});
				}
			});
		}());
	};
	
	Prompt.prototype.question = function (question, callback) {
		charm.write(question + "\n");
		prompt.once("line", function (input) {
			if (prompt.sigint) {
				return;
			}

			callback(null, input);
		});
	};
})();

module.exports = (function () {
	if (promptInstance === null) { promptInstance = new Prompt(); }

	return promptInstance;
})();
