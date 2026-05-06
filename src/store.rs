use std::sync::{Arc, RwLock};

use crate::models::Post;

pub type PostStore = Arc<RwLock<Vec<Post>>>;

pub fn new_store() -> PostStore {
    let posts = vec![
        Post {
            id: "pst-9m4e2mr0ui3e8a215n4g".to_string(),
            title: "Hello, DevOps!".to_string(),
        },
        Post {
            id: "pst-9m4e2mr0ui3e8a215n4f".to_string(),
            title: "CI/CD with GitHub Actions".to_string(),
        },
    ];
    Arc::new(RwLock::new(posts))
}
