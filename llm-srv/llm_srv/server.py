import grpc
from concurrent import futures
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


class LLMServer:
    def __init__(self, port=50051):
        self.port = port
        self.server = None

    def start(self):
        self.server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        # We'll add service registration here later
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
