//  Display action message with animation
function display_msg(msg) {
  const msg_div = document.querySelector('#alert_div');
  msg_div.innerHTML = '';
  msg_div.innerHTML = msg.message;
  msg_div.style.display = 'block';
  msg_div.style.animationPlayState = 'running';
}

//  Process and display tweets
function pasteTweets(tweet, parentDiv) {
  const username = document.getElementById('user').textContent;
  const tweetDiv = document.createElement('div');
  tweetDiv.className = 'tweet';
  const userTweetsDiv = document.querySelector('.user_tweets_div');

  //  Check different views and how to display tweets
  if (userTweetsDiv) {
    userTweetsDiv.appendChild(tweetDiv);
  } else {
    document.querySelector('#tweets_view').append(parentDiv);
    parentDiv.appendChild(tweetDiv);
    const element1 = document.createElement('h5');
    element1.innerHTML = tweet.user;
    tweetDiv.appendChild(element1);
  }

  //  Add an edit button if logged in user owns the tweet
  if (tweet.user === username) {
    const element2 = document.createElement('button');
    element2.className = 'btn_edit';
    element2.dataset.tweet_id = tweet.id;
    element2.innerHTML = 'Edit';
    element2.onclick = edit.bind(element2, tweet.id);
    tweetDiv.appendChild(element2);
  }

  //  Add tweet text
  const element3 = document.createElement('p');
  element3.innerText = tweet.text;
  //  Add timestamp
  const element4 = document.createElement('p');
  element4.className = 'timestamp';
  element4.innerHTML = tweet.timestamp;
  //  Add username
  const element5 = document.createElement('p');
  element5.dataset.tweet_id = tweet.id;
  //  Add likes
  element5.innerHTML = `<span class="heart">❤️</span><span class="like_count">${tweet.likes}</span>`;
  element5.onclick = amendLikes.bind(element5, tweet.id);
  //  Merge all in one div
  tweetDiv.appendChild(element3);
  tweetDiv.appendChild(element4);
  tweetDiv.appendChild(element5);
}

//  Div for displaying followers and followed users
function createFollowDiv(jsonResponse, tweets_div) {
  const followDiv = document.createElement('div');
  followDiv.className = 'follow_div';
  followDiv.innerHTML = `<div class="following_subdiv"><h3>Following</h3><p>${jsonResponse.following_count}</p></div><div class="follower_subdiv"><h3>Followers</h3><p>${jsonResponse.followers_count}</p></div>`;
  tweets_div.appendChild(followDiv);
}

//  Create divs in profile view to display users and tweets separately
function createParentDivs(tweets_div) {
  const profileDiv = document.createElement('div');
  profileDiv.className = 'profile_div';
  const userTweetsDiv = document.createElement('div');
  userTweetsDiv.className = 'user_tweets_div';
  userTweetsDiv.innerHTML = '<h3>Your tweets</h3>';
  const usersDiv = document.createElement('div');
  usersDiv.className = 'users_div';
  usersDiv.innerHTML = '<h3>You can follow or unfollow others here</h3>';

  profileDiv.appendChild(userTweetsDiv);
  profileDiv.appendChild(usersDiv);
  tweets_div.appendChild(profileDiv);
}

// Paste users in profile view
function pasteUsers(jsonResponse) {
  const usersDiv = document.querySelector('.users_div');
  usersDiv.innerHTML = '';
  usersDiv.innerHTML = '<h3>You can follow or unfollow others here</h3>';

  // Check if followed users exists
  if (jsonResponse.following_users) {
    const followingUsers = jsonResponse.following_users;
    followingUsers.forEach((followingUser) => {
      //  Create divs for followed users
      createUserDivs(usersDiv, followingUser, null);
    });
  }

  //  Create divs for not followed users
  const users = jsonResponse.users;
  users.forEach((userToFollow) => {
    createUserDivs(usersDiv, null, userToFollow);
  });
}

//  Create divs for followed and not followed users in profile view
function createUserDivs(usersDiv, followingUser, userToFollow) {
  const userDiv = document.createElement('div');
  userDiv.className = 'user_div';
  const followButton = document.createElement('button');
  followButton.className = 'btn btn-primary';

  //  If user is followed, create "Unfollow" button
  if (followingUser) {
    followButton.dataset.user = followingUser;
    followButton.innerText = 'Unfollow';
    followButton.onclick = follow.bind(followButton, followingUser);
    userDiv.innerHTML = `<h5>${followingUser}</h5>`;
  } else {
    //  For other users create "Follow" button
    followButton.dataset.user = userToFollow;
    followButton.innerText = 'Follow';
    followButton.onclick = follow.bind(followButton, userToFollow);
    userDiv.innerHTML = `<h5>${userToFollow}</h5>`;
  }

  userDiv.appendChild(followButton);
  usersDiv.appendChild(userDiv);
}

//  Pagination
function createPaginator(jsonResponse) {
  const tweetsView = document.querySelector('#tweets_view');
  const paginatorDiv = document.createElement('nav');
  paginatorDiv.setAttribute('aria-label', 'Tweets navigation');
  const pagesList = document.createElement('ul');
  pagesList.className = 'pagination pagination-lg';

  //  Left arrows in paginator
  createArrows(1, pagesList, jsonResponse);

  //  Create adequate count of buttons depending on the count of pages
  for (let i = 0; i < jsonResponse.num_pages; i++) {
    const pageItem = document.createElement('li');
    pageItem.className = 'page-item';
    link = document.createElement('a');
    link.className = 'page-link';
    link.innerHTML = i + 1;
    //  Activate and deactivate buttons
    if (link.innerHTML == jsonResponse.number) {
      link.classList.add('active-pg');
    } else {
      link.classList.remove('active-pg');
    }
    pageItem.appendChild(link);
    pagesList.appendChild(pageItem);
  }

  //  Right arrows in paginator
  createArrows(2, pagesList, jsonResponse);

  paginatorDiv.appendChild(pagesList);
  tweetsView.append(paginatorDiv);

  //  Toggle a specific button
  const pageAnchors = Array.from(document.getElementsByClassName('page-link'));
  pageAnchors.forEach((pageAnchor) => {
    pageAnchor.addEventListener('click', (e) => {
      //  And load that specific page
      loadTweets(e);
    });
  });
}

//  Create arrows in paginator
function createArrows(location, pagesList, jsonResponse) {
  const arrows = document.createElement('li');
  arrows.className = 'page-item';
  let link = document.createElement('a');
  link.className = 'page-link';

  //  Check left or right side
  if (location === 1) {
    link.setAttribute('aria-label', 'previous');
    //  Set previous page number as value
    link.value = jsonResponse.number - 1;
    link.innerHTML = '&laquo;';
    // Disable arrows if no previous page
    if (link.value < 1) {
      link.classList.add('disabled');
      link.style.pointerEvents = 'none';
    }
  } else {
    link.setAttribute('aria-label', 'next');
    //  Set next page number as value
    link.value = jsonResponse.number + 1;
    link.innerHTML = '&raquo;';
    // Disable arrows if no next page
    if (link.value > jsonResponse.num_pages) {
      link.classList.add('disabled');
      link.style.pointerEvents = 'none';
    }
  }

  arrows.appendChild(link);
  pagesList.appendChild(arrows);
}

// Fetch requested page of tweets and display
function loadTweets(e) {
  // Check if on the Following page
  let followingDiv;
  if (document.querySelector('.parent_div_following')) {
    followingDiv = true;
  } else {
    followingDiv = false;
  }

  //  Clean the view
  const tweetsDiv = document.querySelector('#tweets_view');
  tweetsDiv.innerHTML = '';

  // Recreate tweets div
  const parentDiv = createTweetsDiv(followingDiv);

  // Store page number
  let page = Number(e.target.innerHTML);

  //  If arrows hit, retrieve an adequate page number
  if (isNaN(page)) {
    page = e.target.value;
  }

  fetch('/network/load_tweets', {
    method: 'POST',
    body: JSON.stringify({
      page: page,
      following_page: followingDiv,
    }),
  })
    // Fetch new batch of tweets
    .then((response) => response.json())
    .then((jsonResponse) => {
      jsonResponse.tweets.forEach((tweet) => {
        pasteTweets(tweet, parentDiv);
      });
      createPaginator(jsonResponse);
    });
}

//  Create div for tweets
function createTweetsDiv(followingDiv) {
  if (followingDiv) {
    // Div for the Following page
    const parentDiv = document.createElement('div');
    parentDiv.className = 'parent_div_following';
    //  Add heading
    const heading = document.createElement('h1');
    heading.innerText = "Your favorite users' posts";
    parentDiv.appendChild(heading);
    return parentDiv;
  } else {
    const parentDiv = document.createElement('div');
    parentDiv.className = 'parent_div';
    return parentDiv;
  }
}
