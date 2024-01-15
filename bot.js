// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory, UserState } = require("botbuilder");
const {
  MakeReservationDialog,
} = require("./componentDialog/makeReservationDialog");

class EchoBot extends ActivityHandler {
  constructor(conversationState, userState) {
    super();

    this.conversationState = conversationState;
    this.userState = userState;
    this.dialogState = conversationState.createProperty("dialogState");
    this.makeReservationDialog = new MakeReservationDialog(
      this.conversationState,
      this.userState
    );
    this.previousIntent =
      this.conversationState.createProperty("previousIntent");
    this.conversationData =
      this.conversationState.createProperty("conversationData");

    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    this.onMessage(async (context, next) => {
      // const replyText = `Echo: ${ context.activity.text }`;
      // await context.sendActivity(MessageFactory.text(replyText, replyText));
      // By calling next() you ensure that the next BotHandler is run.
      await this.dispatchToIntentAsync(context);
      await next();
    });

    this.onDialog(async (context, next) => {
      // save any state changes , the load happend during the execution of the Dialog
      await this.conversationState.saveChanges(context, false);
      await this.userState.saveChanges(context, false);
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      // const membersAdded = context.activity.membersAdded;
      // const welcomeText = 'Hello and welcome!';
      // for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
      //     if (membersAdded[cnt].id !== context.activity.recipient.id) {
      //         await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
      //     }
      // }
      // By calling next() you ensure that the next BotHandler is run.
      await this.sendWelcomeMessage(context);
      await next();
    });
  }

  async sendWelcomeMessage(turnContext) {
    const { activity } = turnContext;

    // iterate over all new mmebers added to the conversation
    for (const idx in activity.membersAdded) {
      if (activity.membersAdded[idx].id !== activity.recipient.id) {
        const welcomeMessage = `Welcome to Restaurant Reservation Bot ${activity.membersAdded[idx].name}`;
        await turnContext.sendActivity(welcomeMessage);
        await this.sendSuggestedActions(turnContext);
      }
    }
  }

  async sendSuggestedActions(turnContext) {
    var reply = MessageFactory.suggestedActions(
      ["Make Reservation", "Cancel Reservation"],
      "How can i help you today?"
    );
    await turnContext.sendActivity(reply);
  }

  async dispatchToIntentAsync(context) {
    var currentIntent = "";
    const previousIntent = await this.previousIntent.get(context, {});
    const conversationData = await this.conversationData.get(context, {});

    if (previousIntent.intentName && conversationData.endDialog === false) {
      currentIntent = previousIntent.intentName;
    } else if (
      previousIntent.intentName &&
      conversationData.endDialog === true
    ) {
      currentIntent = context.activity.text;
    } else {
      currentIntent = context.activity.text;
      await this.previousIntent.set(context, {
        intentName: context.activity.text,
      });
    }

    switch (currentIntent) {
      case "Make Reservation":
        await this.conversationData.set(context, { endDialog: false });
        await this.makeReservationDialog.run(context, this.dialogState);
        conversationData.endDialog =
          await this.makeReservationDialog.isDialogComplete();
        // console.log("insdie last", conversationData.endDialog)

        if (conversationData.endDialog) {
          await this.sendSuggestedActions(context);
        }
        break;

      default:
        console.log("Did not match make Reservation case");
        break;
    }
  }
}

module.exports.EchoBot = EchoBot;
