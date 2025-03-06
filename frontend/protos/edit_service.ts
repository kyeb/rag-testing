import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type {
  EditServiceClient as _edit_EditServiceClient,
  EditServiceDefinition as _edit_EditServiceDefinition,
} from './edit/EditService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  edit: {
    EditRequest: MessageTypeDefinition;
    EditResponse: MessageTypeDefinition;
    EditService: SubtypeConstructor<typeof grpc.Client, _edit_EditServiceClient> & {
      service: _edit_EditServiceDefinition;
    };
  };
}
