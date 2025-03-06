# RAG testing

### Development

```
docker compose -f docker-compose.dev.yml up --build --watch
```

### Deploy

<!-- todo kubernetes woohoo -->

```
docker compose up --build
```

### Features

#### Document Viewer

The application includes a document viewer that displays markdown content from a mounted volume. Access the documents at `/markdown` path in the frontend.

The document viewer reads files from the `/content` directory inside the container, which is mounted from `./archwiki-scraper/output` in the host filesystem.

Features include:
- Browse and view all markdown files
- Navigate through folder structures
- Responsive design with proper markdown formatting
- Automatic navigation links between pages

### Customizing Content

To use your own markdown content:
1. Place your markdown files in a directory
2. Update the Docker Compose files to mount your directory to `/content`
