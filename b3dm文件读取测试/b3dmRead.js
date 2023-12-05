let fs = require("fs");
const readStream = fs.createReadStream("./data/batchedColors.b3dm");

readStream.on('data',(buffer)=>{

	const b3dm = b3dmParse(buffer);

	gltfParse(b3dm.gltf);

})

// 解析 .b3dm 文件
function b3dmParse(buffer){
	// header
	let offset = 0;
	const magic = buffer.toString('ascii',0, 4);
	offset += 4;
	let dataView = new DataView(buffer.buffer,0);
	const version = dataView.getUint32(offset, true);
	offset += 4;
	const byteLength = dataView.getUint32(offset, true);
	offset += 4;
	// featureTable 中JSON 的长度，以字节为单位
	const featureTableJSONByteLength = dataView.getUint32(offset, true);
	offset += 4;
	// featureTable 中二进制的长度，以字节为单位
	const featureTableBinaryByteLength = dataView.getUint32(offset, true);
	offset += 4;
	// batchTable中JSON的长度，以字节为单位
	const batchTableJSONByteLength = dataView.getUint32(offset, true);
	offset += 4;
	// batchTable中二进制的长度，以字节为单位
	const batchTableBinaryByteLength = dataView.getUint32(offset, true);
	offset += 4;

	// body
	let featureTableJson;
	if(featureTableJSONByteLength === 0){
		featureTableJson = {
			BATCH_LENGTH: featureTableJSONByteLength,
		}
	}else {
		featureTableJson = JSON.parse(buffer.toString("utf-8", offset, offset + featureTableJSONByteLength))
	}
	offset += featureTableJSONByteLength;

	const featureTableBinary = new Uint8Array(buffer.buffer, offset, featureTableBinaryByteLength);
	offset += featureTableBinaryByteLength;


	let batchTableJson, batchTableBinary;
	if(batchTableJSONByteLength > 0){
		batchTableJson = JSON.parse(buffer.toString("utf-8", offset, offset + batchTableJSONByteLength));
		offset += batchTableJSONByteLength;
		if(batchTableBinaryByteLength > 0){
			batchTableBinary = new Uint8Array(buffer.buffer, offset, batchTableBinaryByteLength);
			offset += batchTableBinaryByteLength;
		}
	}

	const gltfByteLength = byteLength - offset;
	let gltfView;
	if(gltfByteLength > 0){
		gltfView = new Uint8Array(buffer.buffer, offset, gltfByteLength);
	}

	return {
		batchLength: batchTableJSONByteLength,
		batchTableJson: batchTableJson,
		batchTableBinary: batchTableBinary,
		featureTableJson: featureTableJson,
		featureTableBinary: featureTableBinary,
		gltf: gltfView
	}
}



function gltfParse(glb){
	let offset = 0;
	let uint8Array = glb.subarray(offset, offset += 4);

	const magic = new TextDecoder('utf-8').decode(uint8Array);
	if(magic !== 'glTF'){
		throw new Error('data is not glTF')
	}
	uint8Array = glb.subarray(offset, offset += 4);
	const version = uint8ToUint32(uint8Array);

	uint8Array = glb.subarray(offset, offset += 4);
	const length = uint8ToUint32(uint8Array);

	uint8Array = glb.subarray(offset, offset += 4);
	const chunk1Length = uint8ToUint32(uint8Array);

	uint8Array = glb.subarray(offset, offset += 4);
	const chunk1Type = new TextDecoder('utf-8').decode(uint8Array);
	let chunk1Data;
	if(chunk1Type === 'JSON'){
		uint8Array = glb.subarray(offset, offset += chunk1Length);
		console.log(new TextDecoder('utf-8').decode(uint8Array));
		chunk1Data = JSON.parse(new TextDecoder('utf-8').decode(uint8Array));
	}else{
		
	}
	uint8Array = glb.subarray(offset, offset += 4);
	const chunk2Length = uint8ToUint32(uint8Array);

	uint8Array = glb.subarray(offset, offset += 4);
	const chunk2Type = new TextDecoder('utf-8').decode(uint8Array);
	let chunk2Data;
	if(chunk2Type === 'JSON'){
		uint8Array = glb.subarray(offset, offset += chunk1Length);
		chunk2Data = JSON.parse(new TextDecoder('utf-8').decode(uint8Array));
	}else{
		uint8Array = glb.subarray(offset,offset += chunk2Length)
		chunk2Data = readBINData(chunk1Data, uint8Array);
	}

}

function readBINData(chunk1Data, uint8Array){
	let offset = 0;
	const accessors = chunk1Data.accessors;
	const bufferViews = chunk1Data.bufferViews;
	const positions = [];
	for (let i = 0; i < accessors.length; i++) {
		const accessor = accessors[i];
		if(accessor.componentType === 5126 && accessor.type === 'VEC3'){
			// FLOAT（Float32Array） VEC3 表示三维矢量（一般是顶点坐标
			const maxOffset = bufferViews[accessor.bufferView].byteOffset + accessor.count * 3 * 4;
			while(offset <= maxOffset){
				const x = new Float32Array(uint8Array.subarray(offset, offset += 4));
				const y = new Float32Array(uint8Array.subarray(offset, offset += 4));
				const z = new Float32Arrayuint8Array.subarray(offset, offset += 4);
				positions.push([x,y,z]);
			}
			
		} else if(accessor.componentType === 5126 && accessor.type === 'VEC3'){

		} else if(accessor.componentType === 5123 && accessor.type === 'SCALAR'){ 
			// UNSIGNED_SHORT（Uint16Array） SCALAR 表示标量无符号短值（一般是索引）
		}
		// accessor.type 还有MAT4，这里不列举

	}
}

function uint8ToUint32(uint8Array){
	return (uint8Array[3] << 24) | (uint8Array[2] << 16) | (uint8Array[1] << 8) | uint8Array[0];
}
