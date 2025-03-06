const { exec } = require('child_process');
const path = require('path');

const PROTO_PATH = path.resolve(__dirname, '../protos/edit_service.proto');
const OUT_DIR = path.resolve(__dirname, '../protos');

const command = `npx proto-loader-gen-types --keepCase --longs=String --enums=String --defaults --oneofs --grpcLib=@grpc/grpc-js --outDir=${OUT_DIR} ${PROTO_PATH}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log('Proto types generated successfully!');
});
