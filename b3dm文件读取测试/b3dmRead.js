let fs = require("fs");
fs.readFile('./data/tile.b3dm', (err, data)=>{
	if(err){
		console.error('Error reading file:', err);
    return;
	}
	const b3dm = b3dmParse(data);

	gltfParse(b3dm.gltf);
})
// fs.readFile('./data/untitled.glb', (err, data)=>{
// 	if(err){
// 		console.error('Error reading file:', err);
//     return;
// 	}
// 	const gltf = new Uint8Array(data.buffer, 0);
// 	gltfParse(gltf);
// })

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
	const gltfVersion = uint8ToUint32(uint8Array);

	uint8Array = glb.subarray(offset, offset += 4);
	const gltfLength = uint8ToUint32(uint8Array);

	uint8Array = glb.subarray(offset, offset += 4);
	const chunk1Length = uint8ToUint32(uint8Array);

	uint8Array = glb.subarray(offset, offset += 4);
	const chunk1Type = new TextDecoder('utf-8').decode(uint8Array);
	let chunk1Data;
	if(chunk1Type === 'JSON'){
		uint8Array = glb.subarray(offset, offset += chunk1Length);
		console.log(new TextDecoder('utf-8').decode(uint8Array))
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
		// uint8Array = glb.subarray(offset,offset += chunk2Length);
		const binView = new DataView(uint8Array.buffer, glb.byteOffset + offset, chunk2Length);
		chunk2Data = readBINData(chunk1Data, binView);
	}

}

function readBINData(chunk1Data, dataview){
	let offset = 0;
	const accessors = chunk1Data.accessors;
	const bufferViews = chunk1Data.bufferViews;
	const positions = [];
	for (let i = 0; i < accessors.length; i++) {
		const accessor = accessors[i];
		if(accessor.componentType === 5126 && accessor.type === 'VEC3'){
			// FLOAT（Float32Array） VEC3 表示三维矢量（一般是顶点坐标, uv坐标, 颜色值, 法线等)
			// const maxOffset = bufferViews[accessor.bufferView].byteOffset + accessor.byteOffset + accessor.count * 3 * 4;
			const maxOffset = offset + accessor.count * 3 * 4;
			while(offset < maxOffset){
				const x = dataview.getFloat32(offset, true);
				offset += 4;
				const y = dataview.getFloat32(offset, true);
				offset += 4;
				const z = dataview.getFloat32(offset, true);
				offset += 4;
				positions.push([x,y,z]);
				console.log(`Float32 VEC3 x:${x},y:${y},z:${z}`);
			}
		}else if(accessor.componentType === 5126 && accessor.type === 'VEC2'){ 
			// UNSIGNED_SHORT（Uint16Array） SCALAR 表示标量无符号短值（一般是索引）
			// const maxOffset = bufferViews[accessor.bufferView].byteOffset + accessor.byteOffset + accessor.count * 2;
			const maxOffset = offset + accessor.count * 2 * 4;
			while(offset < maxOffset){
				const x = dataview.getFloat32(offset, true);
				offset += 4;
				const y = dataview.getFloat32(offset, true);
				offset += 4;
				console.log(`Float32 VEC2 x:${x},y:${y}`);
			}
		} else if(accessor.componentType === 5126 && accessor.type === 'SCALAR'){
			// UNSIGNED_SHORT（Uint16Array） SCALAR 
			// const maxOffset = bufferViews[accessor.bufferView].byteOffset + accessor.byteOffset + accessor.count * 4;
			const maxOffset = offset + accessor.count * 4;
			while(offset < maxOffset){
				const x = dataview.getFloat32(offset, true);
				offset += 4;
				console.log(`Float32 SCLALAR:${x}`);
			}
		} else if(accessor.componentType === 5123 && accessor.type === 'SCALAR'){ 
			// UNSIGNED_SHORT（Uint16Array） SCALAR 表示标量无符号短值（一般是索引）
			// const maxOffset = bufferViews[accessor.bufferView].byteOffset + accessor.byteOffset + accessor.count * 2;
			const maxOffset = offset + accessor.count * 2;
			while(offset < maxOffset){
				const x = dataview.getUint16(offset, true);
				offset += 2;
				console.log(`Uint16 SCLALAR x:${x}`);
			}
		} 
		
		// accessor.type 还有MAT4， VEC2，这里不列举

	}
	console.log(offset)
}

function uint8ToUint32(uint8Array){
	return (uint8Array[3] << 24) | (uint8Array[2] << 16) | (uint8Array[1] << 8) | uint8Array[0];
}
