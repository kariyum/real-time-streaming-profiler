use actix::prelude::*;
use actix_cors::Cors;
use actix_web::{App, HttpServer, web};
use sinkru::actors::sink_manager::SinkManager;
use sinkru::handlers::{handle_feed, subscribe};

#[actix_web::main]
async fn main() -> Result<(), std::io::Error> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    let port = std::env::var("PORT")
        .unwrap_or(String::from("8080"))
        .parse::<u16>()
        .expect("PORT env var is not a number");

    let sink_manager = SinkManager::default().start();

    HttpServer::new(move || {
        let cors = Cors::permissive();
        App::new()
            .wrap(cors)
            .app_data(web::Data::new(sink_manager.clone()))
            .route("/subscribe", web::get().to(subscribe)) // event stream
            .route("/feed", web::get().to(handle_feed)) // websocket
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
