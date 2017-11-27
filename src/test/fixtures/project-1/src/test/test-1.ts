require("../../../project-1/src/lib");
require("../../src/lib");

require("../lib");
require("src/lib");

require("../lib/index");
require("src/lib/index");

require("../lib/module-1"); // excluded
require("src/lib/module-1"); // excluded

require("../lib/module-3/lib-1/lib-2");
require("src/lib/module-3/lib-1/lib-2");
