use std::ops::Index;

use actix::prelude::*;
use log::info;

use crate::messages::{FeederMessage, SinkCommand};

#[derive(Eq, PartialEq)]
struct FeederRecipient {
    recipient: Recipient<FeederMessage>,
}

#[derive(Default)]
pub struct SinkManager {
    ws: Vec<FeederRecipient>,
    online_feeders: Vec<String>,
}

impl Handler<FeederMessage> for SinkManager {
    type Result = ();
    fn handle(&mut self, msg: FeederMessage, _ctx: &mut Self::Context) -> Self::Result {
        for ws in &self.ws {
            match &msg {
                FeederMessage::Observation { .. } => (),
                FeederMessage::NewFeeder { name } => self.online_feeders.push(name.clone()),
                FeederMessage::RageQuitFeeder { name } => {
                    self.online_feeders
                        .iter()
                        .position(|feeder| **feeder == *name)
                        .iter()
                        .for_each(|idx| {
                            self.online_feeders.swap_remove(*idx);
                        });
                }
                FeederMessage::OnlineFeeders { .. } => (),
            }
            ws.recipient.do_send(msg.clone());
        }
    }
}

impl Handler<SinkCommand> for SinkManager {
    type Result = ();
    fn handle(&mut self, msg: SinkCommand, _ctx: &mut Self::Context) -> Self::Result {
        match msg {
            SinkCommand::NewSink { recipient } => {
                recipient.do_send(FeederMessage::OnlineFeeders {
                    feeder_ids: self.online_feeders.clone(),
                });
                self.ws.push(FeederRecipient { recipient });
            }
            SinkCommand::Disconnected { recipient } => {
                info!("Cleared up stopped actor");
                self.ws
                    .iter()
                    .position(|r| r.recipient == recipient)
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
