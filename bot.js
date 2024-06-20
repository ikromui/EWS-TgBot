// ==================
// ==== IMPORTS =====
// ==================
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
require('dotenv').config();

// ==================
// = CODE SETTINGS ==
// ==================
const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });
const quizData = JSON.parse(fs.readFileSync('./data.json', 'utf8'));



// ====================
// = DEFAULT SETTINGS =
// ====================
const MAX_QUESTION = 10;

let shQuestions;
let userStates = {};
let userActionData = {};



// ==================
// ===== ALGO =======
// ==================
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}




// ==================
// ==== BUTTON ======
// ==================
function sendMessage(chatId) {
  bot.sendMessage(chatId, "Press the button below to start.", {
    reply_markup: {
      keyboard: [
        [{ text: 'Start Quiz' }]
      ],
      resize_keyboard: true,
    }
  });
}




// ==================
// === START BOT ====
// ==================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  userStates[chatId] = { currentQuestion: 0, score: 0 };
  sendMessage(chatId)



  // PERMENANTLY
  userActionData[userId] = {
    username: msg.from.username,
    first_name: msg.from.first_name,
    last_name: msg.from.last_name || "There is no last name",
    message: msg.text,
    date: new Date().toLocaleString()
  }; sendToChannel(userActionData[userId]);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  shQuestions = (shuffle(quizData).slice(0, MAX_QUESTION));


  if (text === 'Start Quiz') {
    bot.sendMessage(chatId, "⏳ Starting the quiz...", {
      reply_markup: {
        remove_keyboard: true
      }
    }).then(() => {
      sendQuestion(chatId);
    });
  } else {
    console.log("waiting for...");
  }
});


// PERMENANTLY
function sendToChannel(userActionData) {
  const channelId = '@ewsdata';
  const message = `
    𝙐𝙨𝙚𝙧 𝘿𝙖𝙩𝙖:
    Username: ${userActionData.username}
    First Name: ${userActionData.first_name}
    Last Name: ${userActionData.last_name}
    Message: ${userActionData.message}
    -----
    Date: ${userActionData.date}
    -----
  `;
  bot.sendMessage(channelId, message);
}





// ===============================
// === POLL SENDER ( in item ) ===
// ===============================
function sendQuestion(chatId) {
  const userState = userStates[chatId];
  const question = shQuestions[userState.currentQuestion];


  if (userState.currentQuestion < shQuestions.length) {
    let question_answer = question.options.findIndex(x => x == question.answer);
    bot.sendPoll(chatId,
      ((userState.currentQuestion + 1) + ") " + question.question),
      question.options,
      {
        is_anonymous: false,
        type: "quiz",
        correct_option_id: question_answer,
      }).then((poll) => {
        userStates[chatId].pollId = poll.poll.id;
      });
  } else {
    const imagePath = "";
    const endMsg = `You found:  ${userState.score}/${shQuestions.length}. Do you want to /start again?`;

    if (fs.existsSync(imagePath)) {
      bot.sendPhoto(chatId, imagePath,
        {
          caption: endMsg
        });
    } else {
      bot.sendMessage(chatId, endMsg);
    }
  }
}






// ====================================
// === POLL RUNNER ( Step By Step ) ===
// ====================================
bot.on('poll_answer', (pollAnswer) => {
  const chatId = pollAnswer.user.id;
  const userState = userStates[chatId];
  const question = shQuestions[userState.currentQuestion];


  const answerIndex = pollAnswer.option_ids[0];
  if (question.options[answerIndex] === question.answer) {
    userState.score++;
    bot.sendMessage(chatId, "Correct! 🎉");
  }
  else {
    bot.sendMessage(chatId, `Wrong! The correct answer was: "${question.answer}.`);
  }

  userState.currentQuestion++;
  setTimeout(() => sendQuestion(chatId), 500);
});






bot.on('polling_error', (error) => {
  console.error("Polling error:", error);
});
console.log('Bot started...');