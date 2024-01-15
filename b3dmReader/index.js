const parseGlb = require("./src/parseGlb");
const fs = require("fs");

fs.readFile("./data/glb.glb", (err, data) => {
  if (err) {
    console.log(err);
    return;
  }
  parseGlb(data, data.byteOffset, data.byteLength);
});
