use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use rand::Rng;
use serde::Deserialize;
use tokio::time::{sleep, Duration};

use crate::{
    models::{CreatePostRequest, Post},
    store::PostStore,
};

pub async fn ping() -> impl IntoResponse {
    Json(serde_json::json!({"status": "ok"}))
}

pub async fn list_posts(State(store): State<PostStore>) -> impl IntoResponse {
    let posts = store.read().unwrap().clone();
    Json(posts)
}

pub async fn get_post(State(store): State<PostStore>, Path(id): Path<String>) -> Response {
    let posts = store.read().unwrap();
    match posts.iter().find(|p| p.id == id) {
        Some(post) => {
            tracing::info!(id = %id, "post found");
            Json(post.clone()).into_response()
        }
        None => {
            tracing::warn!(id = %id, "post not found");
            (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({"error": "post not found", "id": id})),
            )
                .into_response()
        }
    }
}

pub async fn create_post(
    State(store): State<PostStore>,
    Json(payload): Json<CreatePostRequest>,
) -> Response {
    if payload.title.trim().is_empty() {
        tracing::warn!("create_post: empty title rejected");
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "title must not be empty"})),
        )
            .into_response();
    }

    let id = format!("pst-{}", xid::new());
    let post = Post {
        id,
        title: payload.title,
    };

    store.write().unwrap().push(post.clone());
    tracing::info!(id = %post.id, "post created");
    (StatusCode::CREATED, Json(post)).into_response()
}

#[derive(Deserialize)]
pub struct SlowParams {
    ms: Option<u64>,
}

pub async fn slow_posts(
    Query(params): Query<SlowParams>,
    State(store): State<PostStore>,
) -> impl IntoResponse {
    let ms = params.ms.unwrap_or(2000).min(10000);
    tracing::info!(ms, "slow endpoint sleeping");
    sleep(Duration::from_millis(ms)).await;
    let posts = store.read().unwrap().clone();
    Json(posts)
}

pub async fn flaky_posts(State(store): State<PostStore>) -> Response {
    if rand::thread_rng().gen_bool(0.5) {
        tracing::error!("flaky endpoint: simulated failure");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "random failure"})),
        )
            .into_response()
    } else {
        let posts = store.read().unwrap().clone();
        Json(posts).into_response()
    }
}
