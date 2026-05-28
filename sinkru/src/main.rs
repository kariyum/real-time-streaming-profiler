use actix::prelude::*;
use actix_cors::Cors;
use actix_sse::{Data, Event};
use actix_web_actors::ws::WebsocketContext;
use log::{info, logger};
use std::{collections::HashMap, rc::Rc, time::Duration};
use tokio::{
    sync::{
        mpsc::{UnboundedReceiver, UnboundedSender},
        watch::Receiver,
    },
    time::Instant,
};
use tokio_stream::wrappers::{ReceiverStream, UnboundedReceiverStream};

use actix_web::{App, HttpRequest, HttpResponse, HttpServer, Responder, web};
use actix_ws::{Message, ProtocolError};

async fn subscribe(
    req: HttpRequest,
    stream: web::Payload,
    sink_manager: web::Data<Addr<SinkManager>>,
) -> impl Responder {
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
    let sink = SinkActor::new(tx, sink_manager.get_ref().clone().recipient()).start();
    sink_manager.get_ref().do_send(SinkCommand::NewSink {
        recipient: sink.recipient(),
    });
    let event_stream = UnboundedReceiverStream::new(rx);
    actix_sse::Sse::from_infallible_stream(event_stream).with_keep_alive(Duration::from_secs(3))
}

struct Feeder {
    hb: Instant,
    manager: Recipient<FeederMessage>,
}

impl Actor for Feeder {
    type Context = WebsocketContext<Self>;
}

impl Feeder {
    fn new(rec: Recipient<FeederMessage>) -> Self {
        Self {
            hb: Instant::now(),
            manager: rec,
        }
    }

    fn handle_text_message(&mut self, msg: String) -> () {
        self.manager.do_send(FeederMessage { msg });
    }
}

impl StreamHandler<Result<Message, ProtocolError>> for Feeder {
    fn handle(&mut self, msg: Result<Message, ProtocolError>, ctx: &mut Self::Context) {
        let msg = match msg {
            Err(_) => {
                ctx.stop();
                return;
            }
            Ok(msg) => msg,
        };

        match msg {
            Message::Text(json_str) => self.handle_text_message(json_str.to_string()),
            Message::Binary(_) => (),
            Message::Continuation(_) => ctx.stop(),
            Message::Ping(_) => {
                self.hb = Instant::now();
                ctx.pong(b"");
            }
            Message::Pong(_) => (),
            Message::Close(close_reason) => {
                ctx.close(close_reason);
                ctx.stop();
            }
            Message::Nop => todo!(),
        }
    }
}

impl Handler<FeederMessage> for SinkManager {
    type Result = ();
    fn handle(&mut self, msg: FeederMessage, ctx: &mut Self::Context) -> Self::Result {
        for ws in &self.ws {
            ws.do_send(msg.clone());
        }
    }
}

#[derive(Message, Clone)]
#[rtype(result = "()")]
struct FeederMessage {
    pub msg: String,
}

#[derive(Default)]
struct SinkManager {
    ws: Vec<Recipient<FeederMessage>>,
}

#[derive(Message, Clone)]
#[rtype(result = "()")]
enum SinkCommand {
    NewSink { recipient: Recipient<FeederMessage> },
    Disconnected { recipient: Recipient<FeederMessage> },
}

impl Handler<SinkCommand> for SinkManager {
    type Result = ();
    fn handle(&mut self, msg: SinkCommand, ctx: &mut Self::Context) -> Self::Result {
        match msg {
            SinkCommand::NewSink { recipient } => self.ws.push(recipient),
            SinkCommand::Disconnected { recipient } => {
                info!("Cleared up stopped actor");
                self.ws
                    .iter()
                    .position(|r| *r == recipient)
                    .iter()
                    .for_each(|idx| {
                        self.ws.swap_remove(*idx);
                    });
                info!("Remaining connections {}", self.ws.len());
            }
        }
    }
}

impl Actor for SinkManager {
    type Context = Context<Self>;
}

struct SinkActor {
    tx: UnboundedSender<Event>,
    manager: Recipient<SinkCommand>,
}

impl SinkActor {
    fn new(tx: UnboundedSender<Event>, sink_command_recv: Recipient<SinkCommand>) -> Self {
        Self {
            tx,
            manager: sink_command_recv,
        }
    }
}

impl Actor for SinkActor {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        info!("SinkActor started..");
        ctx.run_interval(Duration::from_secs(10), |actor, ctx| {
            if actor.tx.is_closed() {
                info!("Channel is closed... shutting down SinkActor");
                ctx.stop();
            };
        });
    }

    fn stopped(&mut self, ctx: &mut Self::Context) {
        info!("SinkActor stopped..");
        self.manager.do_send(SinkCommand::Disconnected {
            recipient: ctx.address().recipient(),
        });
    }
}

impl Handler<FeederMessage> for SinkActor {
    type Result = ();
    fn handle(&mut self, msg: FeederMessage, ctx: &mut Self::Context) -> Self::Result {
        let data = actix_sse::Data::new(msg.msg);
        match self.tx.send(Event::Data(data)) {
            Ok(_) => (),
            Err(_) => ctx.stop(),
        }
    }
}

async fn handle_feed(
    req: HttpRequest,
    stream: web::Payload,
    feeder_manager: web::Data<Addr<SinkManager>>,
) -> Result<HttpResponse, actix_web::Error> {
    let feeder = Feeder::new(feeder_manager.get_ref().clone().recipient());
    actix_web_actors::ws::start(feeder, &req, stream)
}

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
