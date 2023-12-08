module.exports = parseGlb;

function parseGlb(buffer, byteOffset = 0, byteLength) {
  const dataView = new DataView(buffer.buffer, byteOffset);
  let offset = 0;
  // let uint8Array = new Uint8Array(buffer.buffer, offset, 12);
  const header = getHeader(dataView);
  if (header.magic !== "glTF") {
    throw new Error("this data is not glTF.");
  }
  offset += 12;
  const chunkDatas = [];
  while (offset < header.gltfLength) {
    const chunkLength = dataView.getUint32(offset, true);
    offset += 4;
    const chunkType = getStrByBuffer(
      dataView.buffer,
      dataView.byteOffset + offset,
      4
    );
    offset += 4;
    if (chunkType.trim() === "JSON") {
      let chunkData = getStrByBuffer(
        dataView.buffer,
        dataView.byteOffset + offset,
        chunkLength
      );
      console.log(chunkData);
      chunkDatas.push({
        chunkLength: chunkLength,
        chunkType: chunkType,
        chunkData: JSON.parse(chunkData)
      });
      offset += chunkLength;
    }  else if(chunkType.trim() === "BIN"){
      const chunkParam = chunkDatas[0].chunkData;
      const binView = new DataView(dataView.buffer, dataView.byteOffset + offset, chunkLength);
      parseBINChunk(binView, chunkParam);
    }
  }
}


function getHeader(dataView) {
  let offset = 0;
  const magic = getStrByBuffer(dataView.buffer, dataView.byteOffset, 4);
  offset += 4;

  const gltfVersion = dataView.getUint32(offset, true);
  offset += 4;

  const gltfLength = dataView.getUint32(offset, true);
  offset += 4;

  return {
    magic,
    gltfVersion,
    gltfLength,
  };
}

function getStrByBuffer(buffer, offset, length) {
  const uint8Array = new Uint8Array(buffer, offset, length);
  const str = new TextDecoder("utf-8").decode(uint8Array);
  return str;
}
// 根据 JSON 中的参数解析 Binary 中的 索引数据 等
function parseBINChunk(dataView, chunkData){
  const accessors = [];
  const scenes = chunkData.scenes;

  scenes.forEach((scene) => {
    const nodes = scene.nodes;
    nodes.forEach((item)=>{
      const node = chunkData.nodes[item];
      // 取出meshes
      if(node.hasOwnProperty('mesh')){
        const meshes = chunkData.meshes;
        meshes.forEach((mesh)=>{
          const primitives = mesh.primitives;
          primitives.forEach((primitive) => {
            for (const key in primitive) {
              // vertex attribute
              if(key === "attributes"){
                const attributes = primitive[key];
                for (const attribute in attributes) {
                  const accessor = chunkData.accessors[attributes[attribute]];
                  readAccessor(accessor, bufferViews, dataView);
                }
              }else if(key === "indices"){
                const accessor = chunkData.accessors[primitive[key]];
              }else if(key === "material"){
                const accessor = chunkData.accessors[primitive[key]];
              }
            }
          })
        })
      }else if(node.name === "Camera"){
        // do something
      }else if(node.name === "Light"){
        // do something
      }else if(node.name === "Skin"){
        // do something
      }
    })
  })
}


function readAccessor(accessor, bufferViews, dataView){
  const 
}