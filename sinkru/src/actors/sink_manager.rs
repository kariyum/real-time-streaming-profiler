use std::{collections::HashSet, ops::Index};

use actix::prelude::*;
use log::info;
use serde::Serialize;

use crate::messages::{FeederMessage, SinkCommand};

#[derive(Eq, PartialEq)]
struct FeederRecipient {
    recipient: Recipient<FeederMessage>,
}

#[derive(Clone, Serialize, Hash, Eq, PartialEq)]
pub struct FeederId {
    id: String,
    name: String,
}

#[derive(Default)]
pub struct SinkManager {
    ws: Vec<FeederRecipient>,
    online_feeders: HashSet<FeederId>,
}

impl Handler<FeederMessage> for SinkManager {
    type Result = ();
    fn handle(&mut self, msg: FeederMessage, _ctx: &mut Self::Context) -> Self::Result {
        for ws in &self.ws {
            match &msg {
                FeederMessage::Observation { .. } => (),
                FeederMessage::NewFeeder { name, id } => {
                    self.online_feeders.insert(FeederId {
                        id: id.clone(),
                        name: name.clone(),
                    });
                }
                FeederMessage::RageQuitFeeder { name, id } => {
                    self.online_feeders.remove(&FeederId {
                        id: id.to_string(),
                        name: name.to_string(),
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
                info!("New sink!");
                recipient.do_send(FeederMessage::OnlineFeeders {
                    feeder_ids: self.online_feeders.clone().into_iter().collect(),
                });
                self.ws.push(FeederRecipient { recipient });
            }
            SinkCommand::Disconnected { recipient } => {
                info!("Cleared up sink");
                self.ws
                    .iter()
                    .position(|r| r.recipient == recipient)
                    .iter()
                    .for_each(|idx| {
                        self.ws.swap_remove(*idx);
                    });
                info!("Remaining sinks {}", self.ws.len());
            }
        }
    }
}

impl Actor for SinkManager {
    type Context = Context<Self>;
}
