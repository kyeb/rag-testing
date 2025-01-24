from concurrent import futures
import grpc
import time


class LLMService:
    def __init__(self):
        pass


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))

    server.add_insecure_port("[::]:50051")
    server.start()
    print("Server started on port 50051")

    try:
        while True:
            time.sleep(86400)  # One day in seconds
    except KeyboardInterrupt:
        server.stop(0)
        print("Server stopped")


if __name__ == "__main__":
    serve()
