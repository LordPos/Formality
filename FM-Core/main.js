#!/usr/bin/env node --stack_size=100000

var fs = require("fs");
var path = require("path");
var fm = require(".");

try {
  var argv = [].slice.call(process.argv, 2);
  if (argv.length === 0 || argv[0] === "--help") throw "";
  var name = argv.filter(str => str[0] !== "-")[0] || "main";
  var args = {};
  argv.filter(str => str[0] === "-").map(str => str.slice(1)).join("").split("").forEach(c => args[c] = 1);
} catch (e) {
  if (e) console.log(e);
  console.log("Formality-Core");
  console.log("");
  console.log("Usage: fm [options] [args]");
  console.log("");
  console.log("Evaluation modes (default: -d):");
  console.log("-d <term> debug (preserves boxes, using HOAS)");
  console.log("-i <term> interpreted (using HOAS)");
  console.log("-l <term> lazy (using interaction nets)");
  console.log("-s <term> strict (using interaction nets)");
  console.log("-j <term> JavaScript (using native functions)");
  console.log("");
  console.log("Type-checking modes:");
  console.log("-t <term> performs a type check");
  console.log("");
  console.log("FM-Lab:");
  console.log("-S <file> saves a file to FM-Lab"); 
  console.log("");
  console.log("Options:");
  console.log("-h hides interaction net stats");
  console.log("-d disables stratification (termination) checks");
  console.log("-p prints net as JSON");
  console.log("-v displays the version");
  console.log("");
  console.log("Note: fm will automatically import any local file ending in `.fm`.");
  process.exit();
}

if (args.v) {
  console.log(require("./package.json").version);
  process.exit();
} else if (args.S) {
  if (name.slice(-3) === ".fm") {
    name = name.slice(0, -3);
  }
  var file_code = fs.readFileSync(name + ".fm", "utf8");
  fm.lang.save_file(name, file_code)
    .then(file => {
      console.log("Saved file as `" + file + "`!")
      process.exit();
    })
    .catch(e => {
      console.log(e);
      process.exit();
    });

} else {

  var mode
    = args.d ? "DEBUG"
    : args.i ? "INTERPRETED"
    : args.l ? "OPTIMAL_LAZY"
    : args.s ? "OPTIMAL_STRICT"
    : args.j ? "JAVASCRIPT"
    : args.t ? "TYPE"
    : "DEBUG";
  var BOLD = str => "\x1b[4m" + str + "\x1b[0m";

  var code = "";
  var all_defs = [];
  var files = fs.readdirSync(".");
  for (var i = 0; i < files.length; ++i) {
    if (files[i].slice(-3) === ".fm") {
      var file_code = fs.readFileSync("./" + files[i], "utf8");
      all_defs.push(fm.lang.parse(file_code));
    }
  }

  var defs = {};
  for (var i = 0; i < all_defs.length; ++i) {
    for (var def_name in all_defs[i]) {
      defs[def_name] = all_defs[i][def_name];
    }
  }

  (async () => {
    try {
      var stats = {
        rewrites: 0,
        loops: 0,
        max_len: 0,
        input_net: args.p ? null : undefined,
        output_net: args.p ? null : undefined
      };
      var term = await fm.exec(name, defs, mode, args.d, stats);
      console.log(fm.lang.show(term));
      if (args.p || (mode.slice(0,3) === "OPT" && !args.h)) {
        console.log(JSON.stringify(stats));
      }
    } catch (e) {
      console.log(e);
    }
  })();
}
