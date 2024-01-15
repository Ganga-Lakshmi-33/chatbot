const {
  WaterfallDialog,
  ComponentDialog,
  DialogSet,
  DialogTurnStatus,
} = require("botbuilder-dialogs");

const {
  ConfirmPrompt,
  ChoicePrompt,
  DateTimePrompt,
  NumberPrompt,
  TextPrompt,
} = require("botbuilder-dialogs");
const axios = require("axios");
const prompts = require("./prompts"); // Adjust the path based on your project structure

const CHOICE_PROMPT = "CHOICE_PROMPT";
const CONFIRM_PROMPT = "CONFIRM_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const NUMBER_PROMPT = "NUMBER_PROMPT";
const DATETIME_PROMPT = "DATETIME_PROMPT";
const WATERFALL_DIALOG = "waterfallDialog";
var endDialog = "";
const reservationDetails = {
  name: "",
  noOfParticipants: "",
  date: "",
  time: "",
};

class MakeReservationDialog extends ComponentDialog {
  constructor(conversationState, userstate) {
    super("makeReservationDialog");

    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
    this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
    this.addDialog(
      new NumberPrompt(NUMBER_PROMPT),
      this.noOfParticipantsValidator()
    );
    this.addDialog(new DateTimePrompt(DATETIME_PROMPT));
    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.firstStep.bind(this), // Ask confirmation if user want to make reservation?
        this.getName.bind(this), // Get name from user
        this.getNumberOfParticipants.bind(this), // Number of participants for reservation
        this.getDate.bind(this), // Data of reservation
        this.getTime.bind(this), // time of reservation
        this.confirmStep.bind(this), // show summary of values entered by user and ask confirmation to make reservation
        this.summaryStep.bind(this),
      ])
    );

    this.initialDialogId = WATERFALL_DIALOG;
  }

  async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);
    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
      console.log(results);
    }
  }

  async firstStep(step) {
    // running a prompt here means the next waterfallstep will be run when the users response is received
    endDialog = false;
    return await step.prompt(CONFIRM_PROMPT, prompts.confirmPrompt, [
      "yes",
      "no",
    ]);
  }

  async getName(step) {
    if (step.result === true) {
      return await step.prompt(TEXT_PROMPT, prompts.namePrompt);
      // const promptOptions = { prompt: 'Please enter your name.' };
      // return await step.prompt(TEXT_PROMPT, promptOptions);
    }
  }

  async getNumberOfParticipants(step) {
    step.values.name = step.result;
    return await step.prompt(NUMBER_PROMPT, prompts.participantsPrompt);
  }

  async getDate(step) {
    step.values.noOfParticipants = step.result;
    return await step.prompt(DATETIME_PROMPT, prompts.datePrompt);
  }

  async getTime(step) {
    step.values.date = step.result;
    return await step.prompt(DATETIME_PROMPT, prompts.timePrompt);
  }

  async confirmStep(step) {
    step.values.time = step.result;

    reservationDetails.name = step.values.name;
    reservationDetails.noOfParticipants = step.values.noOfParticipants;
    reservationDetails.date = step.values.date[0].value;
    reservationDetails.time = step.values.time[0].value;

    var msg = `You have entered following values :\n\n Name: ${step.values.name} \n\n Participants: ${step.values.noOfParticipants} \n\n Date: ${step.values.date[0].value} \n\n Time: ${step.values.time[0].value}`;
    await step.context.sendActivity(msg);
    return await step.prompt(CONFIRM_PROMPT, prompts.summaryPrompt, [
      "yes",
      "no",
    ]);
  }

  async summaryStep(step) {
    if (step.result === true) {
      await step.context.sendActivity(
        "Reservation successfully completed. Your reservation id is: 2349283"
      );
      endDialog = true;

      //send details to tasks
      // const postEndpoint = "http://localhost:3003/api/tasks/chatbot";
      // const getEndpoint = "http://localhost:3003/api/tasks";
      // try {
      //   const response = await axios.post(postEndpoint, reservationDetails);
      //   console.log("Reservation details sent successfully:", response.data);
      // } catch (error) {
      //   console.error("Error sending reservation details:", error.message);
      // }
      // try {
      //   const response = await axios.get(getEndpoint);
      //   const data = response.data;
      //   console.log("tasks", data);

      //   // Use the retrieved data in your bot logic
      //   await step.context.sendActivity(`Retrieved data: ${data}`);

      //   // Continue with the next step in your dialog or end the dialog
      //   // return await step.next();
      // } catch (error) {
      //   console.error("Error retrieving data:", error.message);
      // }az webapp deployment source config-zip --resource-group "<resource-group-name>" --name "<name-of-app-service>" --src "<project-zip-path>"

      return await step.endDialog();
    }
  }

  async noOfParticipantsValidator(promptContext) {
    //this condition is our validator for no of particiapnats
    return (
      promptContext?.recognized.succeeded &&
      promptContext.recognized.value > 1 &&
      promptContext.recognized.value < 150
    );
  }

  async isDialogComplete() {
    console.log(endDialog);
    return endDialog;
  }

  async botDetails() {
    return this.reservationDetails;
  }
}

module.exports.MakeReservationDialog = MakeReservationDialog;
