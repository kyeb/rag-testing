import unittest
import threading
import time
import grpc
from llm_srv.server import LLMServer


class TestLLMServer(unittest.TestCase):
    def setUp(self):
        self.server = LLMServer(port=50052)  # Use different port for testing
        self.server_thread = None

    def tearDown(self):
        if self.server:
            self.server.stop()
        if self.server_thread:
            self.server_thread.join(timeout=5)

    def test_server_start_and_stop(self):
        self.server_thread = threading.Thread(target=self.server.start)
        self.server_thread.daemon = True
        self.server_thread.start()

        time.sleep(1)

        try:
            channel = grpc.insecure_channel("localhost:50052")
            grpc.channel_ready_future(channel).result(timeout=2)
            self.assertTrue(True)
        except grpc.FutureTimeoutError:
            self.fail("Server did not start properly")
        finally:
            self.server.stop()
            channel.close()


if __name__ == "__main__":
    unittest.main()
