'use strict';

//  After loading content, display all tweets
document.addEventListener('DOMContentLoaded', () => {
  all_posts();

  //  Add eventListeners to navbar items
  const links = Array.from(document.getElementsByClassName('js-navs'));
  links.forEach((link) => {
    let id = link.id;
    link.addEventListener('click', (e) => {
      e.preventDefault();

      //  Create history if clicked
      history.pushState({ id }, '', `./${id}`);
      //  Toggle specific view
      selectSection(id);
    });
  });

  document.querySelector('#submit').addEventListener('click', () => sendPost());
});

//  Display specific view according to the selection
function selectSection(id) {
  switch (id) {
    case 'all_posts':
      all_posts();
      break;
    case 'network':
      all_posts();
      break;
    case 'profile':
      profile();
      break;
    case 'following':
      following();
      break;
  }
}

//  If selected, display all tweets. Default option
function all_posts() {
  //  Show requested view, hide others
  const tweetsDiv = document.querySelector('#tweets_view');
  tweetsDiv.innerHTML = '';
  document.querySelector('#alert_div').style.display = 'none';
  document.querySelector('#post_view').style.display = 'block';
  document.querySelector('textarea').value = '';

  //  Fetch tweets and pagination data
  fetch('/network/all_posts')
    .then((response) => response.json())
    .then((jsonResponse) => {
      //  Create div for tweets
      const parentDiv = createTweetsDiv();
      jsonResponse.tweets.forEach((tweet) => {
        //  Create div for each tweet
        pasteTweets(tweet, parentDiv);
      });
      //  Create paginator
      createPaginator(jsonResponse);
    });
}

//  Display Profile page
function profile() {
  let tweets_div = document.querySelector('#tweets_view');
  tweets_div.innerHTML = '';
  document.querySelector('#alert_div').style.display = 'none';
  document.querySelector('#post_view').style.display = 'none';

  fetch('/network/profile')
    .then((response) => response.json())
    .then((jsonResponse) => {
      //  Create div for counts of followers and followed users
      createFollowDiv(jsonResponse, tweets_div);
      //  Create divs for tweets and other registered users
      createParentDivs(tweets_div);
      //  Paste those users
      pasteUsers(jsonResponse);
      const tweets = jsonResponse.tweets;
      tweets.forEach((tweet) => {
        //  Paste tweets
        pasteTweets(tweet);
      });
    });
}

//  Display Following page
function following() {
  const tweetsDiv = document.querySelector('#tweets_view');
  tweetsDiv.innerHTML = '';
  document.querySelector('#alert_div').style.display = 'none';
  document.querySelector('#post_view').style.display = 'none';

  //  Fetch paginated tweets
  fetch('/network/following')
    .then((response) => response.json())
    .then((jsonResponse) => {
      // Catch message if exists
      if (jsonResponse.message) {
        const followingMessage = document.createElement('h2');
        followingMessage.innerText = jsonResponse.message;
        tweetsDiv.appendChild(followingMessage);
      } else {
        const followingDiv = true;
        const parentDiv = createTweetsDiv(followingDiv);
        //  Display tweets
        jsonResponse.tweets.forEach((tweet) => {
          pasteTweets(tweet, parentDiv);
        });
        //  Create paginator
        createPaginator(jsonResponse);
      }
    });
}

//  Send "Follow" request
function follow(user) {
  fetch('/network/follow', {
    method: 'PUT',
    body: JSON.stringify({
      followed: user,
    }),
  })
    .then((response) => response.json())
    .then((jsonResponse) => {
      //  Update users in profile reflecting the change
      pasteUsers(jsonResponse);
      //  Update count of followed users
      const following_subdiv = document.querySelector('.following_subdiv');
      following_subdiv.innerHTML = '';
      following_subdiv.innerHTML = `<h3>Following</h3><p>${jsonResponse.following_count}</p>`;
    });
}

//  Allow editing of logged in user's tweet
function edit(tweet_id) {
  const editButton = document.querySelector(`[data-tweet_id="${tweet_id}"]`);
  const tweetDiv = editButton.parentElement;
  const paragraph = editButton.nextElementSibling;
  const originalText = paragraph.innerText;
  tweetDiv.innerHTML = '';

  //  Create textarea with original text
  const textElement = document.createElement('textarea');
  textElement.innerHTML = originalText;
  textElement.dataset.tweet_id = tweet_id;
  const newEditButton = document.createElement('button');
  newEditButton.className = 'btn btn-primary';
  newEditButton.innerText = 'Edit';
  newEditButton.onclick = sendPost.bind(textElement, tweet_id);
  tweetDiv.appendChild(textElement);
  tweetDiv.appendChild(newEditButton);
}

//  Send tweet
function sendPost(tweet_id) {
  let text;

  //  Check if tweet is new or edited
  if (tweet_id) {
    text = document.querySelector(`[data-tweet_id="${tweet_id}"]`).value;
  } else {
    text = document.querySelector('textarea').value;
  }

  // Send tweet to database
  fetch('/network/tweet', {
    method: 'POST',
    body: JSON.stringify({
      text: text,
      tweet_id: tweet_id,
    }),
  })
    .then((response) => response.json())
    .then((msg) => {
      //  Display message of action
      display_msg(msg);
    });

  //  Display all tweets reflecting the change
  setTimeout(all_posts, 5000);
}

//  Process like or unlike request
function amendLikes(tweet_id) {
  fetch('/network/like', {
    method: 'PUT',
    body: JSON.stringify({
      tweet_id: tweet_id,
    }),
  })
    .then((response) => response.json())
    .then((jsonResponse) => {
      //  Update count of likes
      const tweet = document.querySelector(`[data-tweet_id="${tweet_id}"]`);
      const like = tweet.parentNode.querySelector('.like_count');
      like.innerHTML = jsonResponse.likes;
    });
}
