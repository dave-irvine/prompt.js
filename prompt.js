/* jshint node: true */
"use strict";

var colors = require("colors"),
	EventEmitter = require("events").EventEmitter,
	Prompt,
	promptInstance = null,
	readline = require("readline"),
	util = require("util");

colors.setTheme({
	"warn": "yellow",
	"debug": "blue",
	"error": "red"
});

(function () {
	var closeInterface,
		openInterface,
		prompt,
		rl,
		sigintHandler;

	Prompt = function Prompt() {
		prompt = this;

		EventEmitter.call(prompt);

		prompt.interfaceOpen = false;
		prompt.sigint = false;
	};

	util.inherits(Prompt, EventEmitter);

	Prompt.prototype.choice = function (question, choices, callback) {
		var asker;

		openInterface();

		rl.write(question + "\n");
		choices.forEach(function (choice, index) {
			rl.write("  " + index + ") " + choice + "\n");
		});

		asker = function () {
			rl.prompt();
			rl.once("line", function (input) {
				var index = input.trim() * 1;
				if (prompt.sigint) {
					return;
				}

				if (!/^[0-9]+$/.test(input) || isNaN(index) || index < 0 || index >= choices.length) {
					rl.write("Try again:".warn);
					rl.write("\n");
					asker();
				} else {
					callback(null, {
						"index": index,
						"value": choices[index]
					});

					closeInterface();
				}
			});
		};

		asker();
	};

	sigintHandler = function () {
		prompt.sigint = true;
		rl.write("\n");
		
		closeInterface();
	};

	closeInterface = function () {
		if (!prompt.interfaceOpen) {
			return;
		}

		rl.close();
		rl.removeListener("SIGINT", sigintHandler);

		prompt.interfaceOpen = false;
		prompt.sigint = false;
	};

	openInterface = function () {
		if (prompt.interfaceOpen) {
			return;
		}

		rl = readline.createInterface({
			"input": process.stdin,
			"output": process.stdout
		});

		rl.on("SIGINT", sigintHandler);

		prompt.interfaceOpen = true;
		prompt.sigint = false;
	};
})();

module.exports = (function () {
	if (promptInstance === null) { promptInstance = new Prompt(); }

	return promptInstance;
})();