use actix::{Message, Recipient};
use serde::Serialize;
use serde_json::Value;

#[derive(Message, Clone, Serialize)]
#[rtype(result = "()")]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum FeederMessage {
    Observation { msg: Value, feeder_id: String },
    NewFeeder { name: String },
    RageQuitFeeder { name: String },
    OnlineFeeders { feeder_ids: Vec<String> },
}

#[derive(Message, Clone)]
#[rtype(result = "()")]
pub enum SinkCommand {
    NewSink { recipient: Recipient<FeederMessage> },
    Disconnected { recipient: Recipient<FeederMessage> },
}
