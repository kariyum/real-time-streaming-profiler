use actix::prelude::*;
use std::time::Duration;
use tokio_stream::wrappers::UnboundedReceiverStream;

use actix_web::{HttpRequest, HttpResponse, Responder, web};

use crate::{
    actors::{feed_actor::Feeder, sink_actor::SinkActor, sink_manager::SinkManager},
    messages::SinkCommand,
};

use serde::Deserialize;

#[derive(Deserialize)]
pub struct FeedQuery {
    pub feeder_id: String,
}

pub async fn handle_feed(
    req: HttpRequest,
    stream: web::Payload,
    query: web::Query<FeedQuery>,
    feeder_manager: web::Data<Addr<SinkManager>>,
) -> Result<HttpResponse, actix_web::Error> {
    let feeder = Feeder::new(
        query.feeder_id.clone(),
        feeder_manager.get_ref().clone().recipient(),
    );
    actix_web_actors::ws::start(feeder, &req, stream)
}

pub async fn subscribe(sink_manager: web::Data<Addr<SinkManager>>) -> impl Responder {
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
    let sink = SinkActor::new(tx, sink_manager.get_ref().clone().recipient()).start();
    sink_manager.get_ref().do_send(SinkCommand::NewSink {
        recipient: sink.recipient()
    });
    let event_stream = UnboundedReceiverStream::new(rx);
    actix_sse::Sse::from_infallible_stream(event_stream).with_keep_alive(Duration::from_secs(3))
}
