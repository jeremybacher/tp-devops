mod handlers;
mod models;
mod store;

use axum::{routing::get, Router};
use store::PostStore;
use tower_http::trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer};
use tracing::Level;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn create_router(store: PostStore) -> Router {
    Router::new()
        .route("/ping", get(handlers::ping))
        .route(
            "/v1/posts",
            get(handlers::list_posts).post(handlers::create_post),
        )
        // Static routes must be registered before the :id wildcard
        .route("/v1/posts/slow", get(handlers::slow_posts))
        .route("/v1/posts/flaky", get(handlers::flaky_posts))
        .route("/v1/posts/:id", get(handlers::get_post))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(
                    DefaultMakeSpan::new()
                        .include_headers(false)
                        .level(Level::INFO),
                )
                .on_response(DefaultOnResponse::new().level(Level::INFO)),
        )
        .with_state(store)
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "tp_devops=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    let port = std::env::var("APP_PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("0.0.0.0:{}", port);
    let store = store::new_store();
    let app = create_router(store);

    tracing::info!(addr = %addr, "server starting");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    fn make_app() -> Router {
        create_router(store::new_store())
    }

    async fn body_json(body: Body) -> serde_json::Value {
        let bytes = body.collect().await.unwrap().to_bytes();
        serde_json::from_slice(&bytes).unwrap()
    }

    #[tokio::test]
    async fn ping_returns_ok() {
        let res = make_app()
            .oneshot(Request::builder().uri("/ping").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let json = body_json(res.into_body()).await;
        assert_eq!(json["status"], "ok");
    }

    #[tokio::test]
    async fn list_posts_returns_two() {
        let res = make_app()
            .oneshot(
                Request::builder()
                    .uri("/v1/posts")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let json = body_json(res.into_body()).await;
        assert_eq!(json.as_array().unwrap().len(), 2);
    }

    #[tokio::test]
    async fn get_post_existing_id_returns_200() {
        let store = store::new_store();
        let id = store.read().unwrap()[0].id.clone();
        let res = create_router(store)
            .oneshot(
                Request::builder()
                    .uri(format!("/v1/posts/{}", id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let json = body_json(res.into_body()).await;
        assert_eq!(json["id"], id);
    }

    #[tokio::test]
    async fn get_post_missing_id_returns_404() {
        let res = make_app()
            .oneshot(
                Request::builder()
                    .uri("/v1/posts/pst-doesnotexist0000000")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
        let json = body_json(res.into_body()).await;
        assert_eq!(json["error"], "post not found");
    }

    #[tokio::test]
    async fn create_post_valid_returns_201_with_pst_id() {
        let res = make_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v1/posts")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"title":"My New Post"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::CREATED);
        let json = body_json(res.into_body()).await;
        assert!(json["id"].as_str().unwrap().starts_with("pst-"));
        assert_eq!(json["title"], "My New Post");
    }

    #[tokio::test]
    async fn create_post_empty_title_returns_400() {
        let res = make_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v1/posts")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"title":""}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn slow_posts_respects_ms_param() {
        let start = std::time::Instant::now();
        let res = make_app()
            .oneshot(
                Request::builder()
                    .uri("/v1/posts/slow?ms=50")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let elapsed = start.elapsed();
        assert_eq!(res.status(), StatusCode::OK);
        assert!(
            elapsed.as_millis() >= 50,
            "expected >= 50ms, got {}ms",
            elapsed.as_millis()
        );
    }
}
