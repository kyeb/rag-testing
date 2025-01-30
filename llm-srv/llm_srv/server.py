import grpc
from concurrent import futures
import logging
import os
import anthropic
from dotenv import load_dotenv
from llm_srv.protos import edit_service_pb2, edit_service_pb2_grpc

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


class EditServiceServicer(edit_service_pb2_grpc.EditServiceServicer):
    def __init__(self, anthropic_client):
        self.anthropic_client = anthropic_client

    def Edit(self, request, context):
        try:
            # Call Claude to get edit suggestions
            message = self.anthropic_client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": f"Please suggest an edit to improve the following text. Return only the edited text, no explanations:\n\n{request.text}",
                    }
                ],
            )

            # Extract the suggested edit from the response
            suggested_edit = message.content[0].text

            return edit_service_pb2.EditResponse(suggested_edit=suggested_edit)
        except Exception as e:
            logging.error(f"Error in Edit RPC: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")
            return edit_service_pb2.EditResponse()


class LLMServer:
    def __init__(self, port=50051):
        self.port = port
        self.server = None

        # Initialize Anthropic client
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        self.anthropic_client = anthropic.Anthropic(api_key=api_key)
        logging.info("Initialized Anthropic client")

    def start(self):
        self.server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        edit_service_pb2_grpc.add_EditServiceServicer_to_server(
            EditServiceServicer(self.anthropic_client), self.server
        )
        server_address = f"[::]:{self.port}"
        self.server.add_insecure_port(server_address)
        self.server.start()
        logging.info(f"Server started on {server_address}")
        self.server.wait_for_termination()

    def stop(self):
        if self.server:
            self.server.stop(0)
            logging.info("Server stopped")


def serve():
    server = LLMServer()
    try:
        server.start()
    except KeyboardInterrupt:
        server.stop()


if __name__ == "__main__":
    serve()
