use actix::prelude::*;
use actix_web_actors::ws::{Message, ProtocolError, WebsocketContext};
use std::time::Duration;
use tokio::time::Instant;

use crate::messages::FeederMessage;

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(10);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(30);

pub struct Feeder {
    name: String,
    hb: Instant,
    manager: Recipient<FeederMessage>,
}

impl Feeder {
    pub fn new(name: String, rec: Recipient<FeederMessage>) -> Self {
        Self {
            name,
            hb: Instant::now(),
            manager: rec,
        }
    }

    fn handle_text_message(&mut self, msg: String) {
        self.manager.do_send(FeederMessage { msg });
    }

    fn start_heartbeat(&self, ctx: &mut WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |actor, ctx| {
            if Instant::now().duration_since(actor.hb) > CLIENT_TIMEOUT {
                log::warn!("Feeder '{}' heartbeat failed, shutting down", actor.name);
                ctx.stop();
            }
        });
    }
}

impl Actor for Feeder {
    type Context = WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        log::info!("Feeder '{}' connected", self.name);
        self.start_heartbeat(ctx);
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        log::info!("Feeder '{}' disconnected", self.name);
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
            Message::Ping(bytes) => {
                self.hb = Instant::now();
                ctx.pong(&bytes);
            }
            Message::Pong(_) => {
                self.hb = Instant::now();
            }
            Message::Close(close_reason) => {
                ctx.close(close_reason);
                ctx.stop();
            }
            Message::Nop => {}
        }
    }
}

