FROM rust:1.80-slim AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./

RUN mkdir src \
    && echo 'fn main(){}' > src/main.rs \
    && cargo build --release \
    && rm -rf src

COPY src ./src
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --system --no-create-home --shell /usr/sbin/nologin app

WORKDIR /app
COPY --from=builder /app/target/release/tp-devops /app/tp-devops

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:8080/ping || exit 1

CMD ["./tp-devops"]
