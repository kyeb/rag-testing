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

export const editClient = new proto.edit.EditService(
  llmServiceUrl,
  grpc.credentials.createInsecure()
);

export const editText = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    editClient.Edit(
      { text } as EditRequest,
      (
        error: grpc.ServiceError | null,
        response: EditResponse__Output | undefined
      ) => {
        if (error) {
          reject(error);
          return;
        }
        if (!response || !response.suggested_edit) {
          reject(new Error("No suggested edit received"));
          return;
        }
        resolve(response.suggested_edit);
      }
    );
  });
};
