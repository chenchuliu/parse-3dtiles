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
    const chunkType = dataView.getUint32(offset, true);
    offset += 4;
    if (chunkType === 0x4e4f534a) {
      let chunkData = getStrByBuffer(
        dataView.buffer,
        dataView.byteOffset + offset,
        chunkLength
      );
      console.log(chunkData);
      chunkDatas.push({
        chunkLength: chunkLength,
        chunkType: chunkType,
        chunkData: JSON.parse(chunkData),
      });
      offset += chunkLength;
    } else if (chunkType === 0x004e4942) {
      const chunkParam = chunkDatas[0].chunkData;
      const binView = new DataView(
        dataView.buffer,
        dataView.byteOffset + offset,
        chunkLength
      );
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
function parseBINChunk(dataView, chunkData) {
  const accessors = [];
  const scenes = chunkData.scenes;
  const bufferViews = chunkData.bufferViews;
  scenes.forEach((scene) => {
    const nodes = scene.nodes;
    nodes.forEach((item) => {
      const node = chunkData.nodes[item];
      // 取出meshes
      if (node.hasOwnProperty("mesh")) {
        const meshes = chunkData.meshes;
        meshes.forEach((mesh) => {
          const primitives = mesh.primitives;
          primitives.forEach((primitive) => {
            for (const key in primitive) {
              // vertex attribute
              if (key === "attributes") {
                const attributes = primitive[key];
                for (const attribute in attributes) {
                  const accessor = chunkData.accessors[attributes[attribute]];
                  readAccessor(accessor, bufferViews, dataView);
                }
              } else if (key === "indices") {
                const accessor = chunkData.accessors[primitive[key]];
              } else if (key === "material") {
                const accessor = chunkData.accessors[primitive[key]];
              }
            }
          });
        });
      } else if (node.name === "Camera") {
        // do something
      } else if (node.name === "Light") {
        // do something
      } else if (node.name === "Skin") {
        // do something
      }
    });
  });
}

function readAccessor(accessor, bufferViews, dataView) {
  let offset = 0;
  const datas = [];
  const bufferView = bufferViews[accessor.bufferView];
  const byteOffset = bufferView.byteOffset;
  let data;

  while (offset < bufferView.byteLength) {
    switch (accessor.componentType) {
      case 5120:
        data = dataView.getInt8(offset + byteOffset, true);
        offset += 1;
        break;
      case 5121:
        data = dataView.getUint8(offset + byteOffset, true);
        offset += 1;
        break;
      case 5122:
        data = dataView.getInt16(offset + byteOffset, true);
        offset += 2;
        break;
      case 5123:
        data = dataView.getUint16(offset + byteOffset, true);
        offset += 2;
        break;
      case 5125:
        data = dataView.getUint32(offset + byteOffset, true);
        offset += 4;
        break;
      case 5126:
        data = dataView.getFloat32(offset + byteOffset, true);
        offset += 4;
        break;
      default:
        break;
    }
    datas.push(data);
  }
  return datas;
}
