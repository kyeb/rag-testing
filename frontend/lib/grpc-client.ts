import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import type { ProtoGrpcType } from "../protos/edit_service";
import type { EditResponse__Output } from "../protos/edit/EditResponse";
import type { EditRequest } from "../protos/edit/EditRequest";
import path from "path";

const PROTO_PATH = path.resolve(process.cwd(), "protos/edit_service.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(
  packageDefinition
) as unknown as ProtoGrpcType;

const llmServiceUrl = process.env.LLM_SERVICE_URL || "localhost:50051";
console.log("Connecting to LLM service at:", llmServiceUrl);

export const editClient = new proto.edit.EditService(
  llmServiceUrl,
  grpc.credentials.createInsecure()
);

export const editText = (text: string): Promise<string> => {
  console.log("Sending edit request with text:", text);
  return new Promise((resolve, reject) => {
    editClient.Edit(
      { text } as EditRequest,
      (
        error: grpc.ServiceError | null,
        response: EditResponse__Output | undefined
      ) => {
        if (error) {
          console.error("gRPC error:", error.message);
          console.error("Error details:", error.details);
          console.error("Error code:", error.code);
          reject(error);
          return;
        }
        console.log("Received response:", response);
        if (!response || !response.suggested_edit) {
          console.error("Invalid response:", response);
          reject(new Error("No suggested edit received"));
          return;
        }
        console.log("Suggested edit:", response.suggested_edit);
        resolve(response.suggested_edit);
      }
    );
  });
};
