# LLM Server

A gRPC server that provides an interface to Claude for text editing.

## Setup

1. Make sure you have Poetry installed
2. Install dependencies:
   ```bash
   poetry install
   ```
3. Create a `.env` file with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

## Development

### Working with Protobufs

The gRPC service definitions are in `llm_srv/protos/`. If you modify any `.proto` files, you'll need to regenerate the Python artifacts:

```bash
# From the llm-srv directory:
poetry run python -m grpc_tools.protoc \
    -I. \
    --python_out=. \
    --grpc_python_out=. \
    llm_srv/protos/edit_service.proto
```

This will regenerate:

- `llm_srv/protos/edit_service_pb2.py` (message classes)
- `llm_srv/protos/edit_service_pb2_grpc.py` (service classes)

### Running the Server

```bash
poetry run python -m llm_srv.server
```

### Testing with the Client

In a separate terminal:

```bash
poetry run python test_client.py
```

Then enter text at the prompt to get suggested edits from Claude.
