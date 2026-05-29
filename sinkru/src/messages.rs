use actix::{Message, Recipient};

#[derive(Message, Clone)]
#[rtype(result = "()")]
pub struct FeederMessage {
    pub msg: String,
}

#[derive(Message, Clone)]
#[rtype(result = "()")]
pub enum SinkCommand {
    NewSink { recipient: Recipient<FeederMessage> },
    Disconnected { recipient: Recipient<FeederMessage> },
}
