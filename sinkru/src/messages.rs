use actix::{Message, Recipient};
use serde::Serialize;
use serde_json::Value;

use crate::actors::sink_manager::FeederId;

#[derive(Message, Clone, Serialize)]
#[rtype(result = "()")]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum FeederMessage {
    Observation { msg: Value, feeder_id: String },
    NewFeeder { name: String, id: String },
    RageQuitFeeder { name: String, id: String },
    OnlineFeeders { feeder_ids: Vec<FeederId> },
}

#[derive(Message, Clone)]
#[rtype(result = "()")]
pub enum SinkCommand {
    NewSink { recipient: Recipient<FeederMessage> },
    Disconnected { recipient: Recipient<FeederMessage> },
}
