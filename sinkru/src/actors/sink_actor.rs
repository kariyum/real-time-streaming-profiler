use actix::prelude::*;
use actix_sse::Event;
use log::info;
use std::time::Duration;
use tokio::sync::mpsc::UnboundedSender;

use crate::messages::{FeederMessage, SinkCommand};

pub struct SinkActor {
    tx: UnboundedSender<Event>,
    manager: Recipient<SinkCommand>,
}

impl SinkActor {
    pub fn new(tx: UnboundedSender<Event>, sink_command_recv: Recipient<SinkCommand>) -> Self {
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
