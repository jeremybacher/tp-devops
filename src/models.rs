use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub id: String,
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePostRequest {
    pub title: String,
}
