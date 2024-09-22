const express = require('express');
const { OpenAI } = require('openai');
const Reddit = require('reddit')
const Snoowrap = require('snoowrap');
const fs = require('fs').promises;

const r = new Snoowrap({
    client_id: 'vCJeAqJnoFv-ku3bshk2MQ',
    client_secret: 'ItMafHX5Y_XmSCuZQluR5VFS5kyxOA',
    user_agent: 'MyAnotherBotV00002',
    username: 'xmaelxdbot1',
    password: 'Lerusse2002@'
});


const openai = new OpenAI({
  apiKey: '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',
});
// console.log('openai openai  Reddit et stocktwit clientId: ORbKN4NY5cJ1mr35QrmxHQ secret: fFJ-bXGOOIaYdoTifRQpGZoWIYgzJw')

const r2 = new Reddit({
  appId: 'vCJeAqJnoFv-ku3bshk2MQ',
  appSecret: 'ItMafHX5Y_XmSCuZQluR5VFS5kyxOA',
  username: 'xmaelxdbot1',
  password: 'Lerusse2002@'
});


async function readFromFile(fileName) {
  const filePath = "./src/"+fileName;
  try {
    const data = await fs.readFile(filePath, 'utf8');
    console.log('Data read from file:', data);
    return data;
  } catch (err) {
    console.error('Error reading from file:', err);
  }
}

async function writeToFile(id, fileName) {
  const oldDATA = await readFromFile(fileName);
  const data = (oldDATA ==="" ? "": ",")+id;
  const filePath = "./src/"+fileName;
  try {
    await fs.writeFile(filePath, oldDATA+data);
  } catch (err) {
    console.error('Error writing to file:', err);
  }
}

async function chatGptRequest(prompt) { 
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `"${prompt}"`,
        },
      ],
    });
    // console.log('chatCompletion chatCompletion ', chatCompletion?.choices)
    // const response = await openai.Completions.create({
    //   engine: "text-davinci-003",
    //   prompt: "Write a poem about a cat",
    //   max_tokens: 100,
    //   n: 1,
    //   stop: null,
    //   temperature: 0.7,
    // })
    // console.log('REQU resp ', response.data)
    // return response.data.choices[0].text;
    return chatCompletion?.choices[0]?.message?.content
  } catch (error) {
    console.error(error);
    return null;
  }
}

const app = express();
const SPECIAL_WORD = "Free game";

async function workReddit(){
  console.log('==== STARTED REDDIT ====')
  const limit = 100; // number of posts to retrieve per page
  let after = null; 
  let found; 
  let comments; 
  const posts = [];
  while (true) {
    const options = {
      limit: limit,
      after: after
    };
    
    const response = await r2.get("/r/developer/hot", options)
    // const response = await r.getHot("developer", options)
    const newPosts = response?.data?.children;
  
    posts.push(...newPosts);
  
    if (newPosts.length < limit) {
      break;
    }
  
    after = response?.data?.after;
  }
  if(posts && posts.length){
    for(let i = 0; i < posts.length; i++){
      const post = posts[i];
      if(post.data?.selftext.includes(SPECIAL_WORD) || post.data?.title.includes(SPECIAL_WORD)){
        console.log('POST FOUND HERE')
        ///Reply with chatGPT
        found = post
        ///deja reply here
        let newProperComments = []
        if(post.data?.num_comments){
          comments = await r2.get("/r/developer/comments/"+post.data?.id, {})
          for (let j = 0; j < comments.length; j++) {
            const elt = comments[j];
            newProperComments.push(...elt.data?.children)
          } 
          comments = newProperComments 
        }
  
      }
    }
  }
  let resultGPT = {};
  if(comments && comments.length){
    for (let k = 0; k < comments.length; k++) {
      const comment = comments[k];
      //post.data?.selftext.includes(SPECIAL_WORD) || post.data?.title.includes(SPECIAL_WORD)
      if(true){
        const dataFIle = await readFromFile("comments_replied_to_reddit.txt");
        if(!dataFIle.includes(comment?.data?.id)){
          chatResp = await chatGptRequest(comment?.data?.selftext || comment?.data?.body)
          resultGPT[k] = chatResp
          const detailC = await r.getComment(comment?.data?.id)
          console.log('detailC ', detailC)
          detailC.reply(chatResp)
          .then(async (reply) => {
            console.log(`Replied to comment ${comment?.data?.id} with:txt`);
            await writeToFile(comment?.data?.id, "comments_replied_to_reddit.txt");
          })
          .catch((error) => {
            console.error(`Error replying to comment: ${error}`);
          });
        }
      }
    }
  }
  console.log('==== FINISHED ====')
}

app.get('/', async (req, res) => {
  // const subreddit = await r.getSubreddit("r/developer");

  // res.json({resultGPT, comments});
});

app.listen(3000, async() => {
  // await writeToFile("teyeyd", "comments_replied_to_reddit.txt");
  // await writeToFile("7dff", "comments_replied_to_reddit.txt");
  // await readFromFile("comments_replied_to_reddit.txt");
  console.log('Serveur démarré sur le port 3000');
  await workReddit()
  // const t = await reddit._getToken()
  // console.log('t t ', t)
});