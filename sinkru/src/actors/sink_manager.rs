use actix::prelude::*;
use log::info;

use crate::messages::{FeederMessage, SinkCommand};


#[derive(Default)]
pub struct SinkManager {
    ws: Vec<Recipient<FeederMessage>>,
}

impl Handler<FeederMessage> for SinkManager {
    type Result = ();
    fn handle(&mut self, msg: FeederMessage, _ctx: &mut Self::Context) -> Self::Result {
        for ws in &self.ws {
            ws.do_send(msg.clone());
        }
    }
}


impl Handler<SinkCommand> for SinkManager {
    type Result = ();
    fn handle(&mut self, msg: SinkCommand, _ctx: &mut Self::Context) -> Self::Result {
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
