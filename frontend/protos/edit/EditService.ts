// Original file: /Users/kyeb/code/rag-testing/frontend/protos/edit_service.proto

import type * as grpc from '@grpc/grpc-js';
import type { MethodDefinition } from '@grpc/proto-loader';
import type {
  EditRequest as _edit_EditRequest,
  EditRequest__Output as _edit_EditRequest__Output,
} from '../edit/EditRequest';
import type {
  EditResponse as _edit_EditResponse,
  EditResponse__Output as _edit_EditResponse__Output,
} from '../edit/EditResponse';

export interface EditServiceClient extends grpc.Client {
  Edit(
    argument: _edit_EditRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_edit_EditResponse__Output>
  ): grpc.ClientUnaryCall;
  Edit(
    argument: _edit_EditRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_edit_EditResponse__Output>
  ): grpc.ClientUnaryCall;
  Edit(
    argument: _edit_EditRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_edit_EditResponse__Output>
  ): grpc.ClientUnaryCall;
  Edit(
    argument: _edit_EditRequest,
    callback: grpc.requestCallback<_edit_EditResponse__Output>
  ): grpc.ClientUnaryCall;
  edit(
    argument: _edit_EditRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_edit_EditResponse__Output>
  ): grpc.ClientUnaryCall;
  edit(
    argument: _edit_EditRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_edit_EditResponse__Output>
  ): grpc.ClientUnaryCall;
  edit(
    argument: _edit_EditRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_edit_EditResponse__Output>
  ): grpc.ClientUnaryCall;
  edit(
    argument: _edit_EditRequest,
    callback: grpc.requestCallback<_edit_EditResponse__Output>
  ): grpc.ClientUnaryCall;
}

export interface EditServiceHandlers extends grpc.UntypedServiceImplementation {
  Edit: grpc.handleUnaryCall<_edit_EditRequest__Output, _edit_EditResponse>;
}

export interface EditServiceDefinition extends grpc.ServiceDefinition {
  Edit: MethodDefinition<
    _edit_EditRequest,
    _edit_EditResponse,
    _edit_EditRequest__Output,
    _edit_EditResponse__Output
  >;
}
