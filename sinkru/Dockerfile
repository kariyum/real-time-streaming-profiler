# Stage 1: Build the binary
FROM rust:1.85-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /usr/src/sinkru

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src/

# Copy source and build the actual binary
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Stage 2: Final runtime image
FROM alpine:3.20

WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /usr/src/sinkru/target/release/sinkru /app/sinkru

EXPOSE 8080

CMD ["./sinkru"]
