import grpc
from llm_srv.protos import edit_service_pb2, edit_service_pb2_grpc


def run():
    # Create a gRPC channel
    with grpc.insecure_channel("localhost:50051") as channel:
        # Create a stub (client)
        stub = edit_service_pb2_grpc.EditServiceStub(channel)

        while True:
            # Get input from user
            print("\nEnter text to edit (or 'quit' to exit):")
            text = input("> ")

            if text.lower() == "quit":
                break

            try:
                # Create a request
                request = edit_service_pb2.EditRequest(text=text)

                # Make the call
                response = stub.Edit(request)

                # Print the result
                print("\nSuggested edit:")
                print(response.suggested_edit)

            except grpc.RpcError as e:
                print(f"\nRPC failed: {e.code()}")
                print(f"Details: {e.details()}")


if __name__ == "__main__":
    run()
