# WAD Capstone API

WAD Capstone Project - Unit 1: Dasar dan Arsitektur Web Modern

## Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Running the Server

```bash
# Development mode (with nodemon auto-restart)
npm run dev

# Production mode
npm start
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/info` | API information |
| GET | `/api/echo/:msg` | Echo a message |

## Examples

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api/info

# Echo
curl http://localhost:3000/api/echo/HelloWorld

# Echo with uppercase
curl "http://localhost:3000/api/echo/HelloWorld?upper=true"
```
